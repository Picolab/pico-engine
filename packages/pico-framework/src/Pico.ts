import * as _ from "lodash";
import {
  Channel,
  ChannelConfig,
  ChannelReadOnly,
  validateCustomChannelId,
} from "./Channel";
import {
  assertChannelPolicyWithinCeiling,
  assertPolicyCeilingWithin,
  normalizePolicyCeiling,
  PolicyCeiling,
} from "./policyCeiling";
import { dbRange } from "./dbRange";
import { cleanEvent, copyEnumerableSymbols, PicoEvent, PicoEventPayload } from "./PicoEvent";
import { PicoFramework } from "./PicoFramework";
import { PicoFrameworkEvent } from "./PicoFrameworkEvent";
import { PicoQuery } from "./PicoQuery";
import { PicoQueue, PicoTxn } from "./PicoQueue";
import { Ruleset, RulesetConfig, RulesetInstance } from "./Ruleset";
import { createRulesetContext } from "./RulesetContext";
import { LevelBatch } from "./utils";

export interface PicoReadOnly {
  /**
   * The pico's id, used to correlate framework events.
   * This is also an ECI only the pico can use to talk to itself i.e. scheduled events
   */
  id: string;

  /**
   * The pico's parent ECI
   * This is null for the root pico.
   */
  parent: string | null;

  /**
   * List of ECIs to the pico's children
   */
  children: string[];

  /**
   * List of the pico's channels
   */
  channels: ChannelReadOnly[];

  /**
   * Rulesets installed on the pico
   */
  rulesets: PicoRulesetReadOnly[];
}

export interface PicoRulesetReadOnly {
  rid: string;
  config: RulesetConfig;
}

export interface NewPicoRuleset {
  rs: Ruleset;
  config?: RulesetConfig;
}

export interface NewPicoConfig {
  rulesets?: NewPicoRuleset[];
  /** Optional ceiling for the new pico; must not exceed the parent's ceiling. */
  policyCeiling?: PolicyCeiling;
}

export class Pico {
  id: string;

  /**
   * The ECI string to the parent pico. Null if it's the root pico.
   */
  parent: string | null = null;

  /**
   * The ECI strings to the child pico's
   */
  children: string[] = [];

  channels: { [eci: string]: Channel } = {};

  /**
   * Maximum event/query policy any non-family channel on this pico may grant.
   * When unset, {@link Pico.getEffectivePolicyCeiling} uses the framework default.
   */
  policyCeiling?: PolicyCeiling;

  rulesets: {
    [rid: string]: {
      config: RulesetConfig;

      // instance may be null when it's pending startup
      instance: RulesetInstance | null;
      startupError?: any;
    };
  } = {};

  private queue: PicoQueue;

  constructor(
    private pf: PicoFramework,
    id: string,
  ) {
    this.id = id;
    this.channels[id] = new Channel(this, id, { tags: ["system", "self"] }, id);

    this.queue = new PicoQueue(
      this.id,
      this.doTxn.bind(this),
      (ev: PicoFrameworkEvent) => this.pf.emit(ev),
    );
  }

  async event(event: PicoEvent): Promise<string> {
    const eid = this.pf.genID();
    this.queue.push({
      id: eid,
      kind: "event",
      event,
    });
    return eid;
  }

  eventWait(event: PicoEvent): Promise<{ eid: string; responses: any[] }> {
    const eid = this.pf.genID();
    this.queue.push({
      id: eid,
      kind: "event",
      event,
    });
    return this.queue.waitFor(eid);
  }

  async eventQuery(event: PicoEvent, query: PicoQuery): Promise<any> {
    const eid = this.pf.genID();
    this.queue.push({
      id: eid,
      kind: "event",
      event,
    });
    const eidQ = eid + ".q";
    this.queue.push({
      id: eidQ,
      kind: "query",
      query,
    });
    const p0 = this.queue.waitFor(eid);
    const p1 = this.queue.waitFor(eidQ);
    await p0; // this may throwup
    return p1;
  }

  async query(query: PicoQuery): Promise<any> {
    const eid = this.pf.genID();
    this.queue.push({
      id: eid,
      kind: "query",
      query,
    });
    return this.queue.waitFor(eid);
  }

  getCurrentTxn(): PicoTxn | undefined {
    return this.queue.getCurrentTxn();
  }

  waitFor(txnId: string): Promise<any> {
    return this.queue.waitFor(txnId);
  }

  getEffectivePolicyCeiling(): PolicyCeiling {
    if (this.policyCeiling) {
      return this.policyCeiling;
    }
    if (this.parent == null) {
      return this.pf.getDefaultRootPolicyCeiling();
    }
    const { pico: parentPico } = this.pf.lookupChannel(this.parent);
    return parentPico.getEffectivePolicyCeiling();
  }

  private resolveChildPolicyCeiling(conf?: NewPicoConfig): PolicyCeiling {
    const parentCeiling = this.getEffectivePolicyCeiling();
    if (conf?.policyCeiling) {
      const normalized = normalizePolicyCeiling(conf.policyCeiling);
      assertPolicyCeilingWithin(normalized, parentCeiling);
      return normalized;
    }
    return normalizePolicyCeiling(parentCeiling);
  }

  private channelTagsCeilingExempt(tags: string[]): boolean {
    const lower = tags.map((t) => t.toLowerCase());
    if (lower.includes("system")) {
      return true;
    }
    if (lower.includes("didcomm") || lower.includes("ingress")) {
      return true;
    }
    if (lower.includes("engine") && lower.includes("ui")) {
      return true;
    }
    if (lower.includes("discovery")) {
      return true;
    }
    return false;
  }

  private assertChannelWithinCeiling(
    channel: Channel,
    conf?: ChannelConfig,
  ): void {
    if (channel.familyChannelPicoID) {
      return;
    }
    const tags = conf?.tags ?? channel.tags;
    if (this.channelTagsCeilingExempt(tags)) {
      return;
    }
    const ceiling = this.getEffectivePolicyCeiling();
    assertChannelPolicyWithinCeiling(
      channel.eventPolicy,
      channel.queryPolicy,
      ceiling,
      channel.mcpPolicy,
    );
  }

  async newPico(conf?: NewPicoConfig) {
    const child = new Pico(this.pf, this.pf.genID());
    child.policyCeiling = this.resolveChildPolicyCeiling(conf);
    const parentChannel = this.newChannelBase(
      { tags: ["system", "parent"] },
      child.id,
    );
    child.parent = parentChannel.id;

    const childChannel = child.newChannelBase(
      { tags: ["system", "child"] },
      this.id,
    );
    child.channels[childChannel.id] = childChannel;
    this.children.push(childChannel.id);

    const dbOps: LevelBatch[] = [
      this.toDbPut(),
      child.toDbPut(),
      parentChannel.toDbPut(),
      childChannel.toDbPut(),
    ];

    try {
      await this.pf.db.batch(dbOps);
    } catch (err) {
      this.children = this.children.filter((c) => c !== childChannel.id);
      throw err;
    }

    this.channels[parentChannel.id] = parentChannel;
    this.pf.addPico(child);

    if (conf && conf.rulesets) {
      for (const rs of conf.rulesets) {
        try {
          await child.install(rs.rs, rs.config);
        } catch (err) {
          this.pf.emit({
            type: "newPicoInstallError",
            picoId: child.id,
            rid: rs.rs.rid,
            config: rs.config,
            error: err,
          });
        }
      }
    }

    return childChannel.id;
  }

  async delPico(eci: string) {
    if (this.children.indexOf(eci) < 0) {
      throw new Error(`delPico(${eci}) - not found in children ECIs`);
    }

    const { pico } = this.pf.lookupChannel(eci);

    const { ops, picoIds } = await pico.delPicoDbOps();

    if (pico.parent) {
      ops.push(this.channels[pico.parent].toDbDel());
    }

    this.children = this.children.filter((c) => c !== eci);
    ops.push(this.toDbPut());

    try {
      await this.pf.db.batch(ops);
    } catch (err) {
      this.children.push(eci); // restore state
      throw err;
    }

    if (pico.parent) {
      delete this.channels[pico.parent];
    }
    for (const id of picoIds) {
      this.pf.removePico(id);
    }
  }

  /**
   * Recursively get the delete operations and ids
   * DO NOT mutate state, only build the operations
   */
  private async delPicoDbOps(): Promise<{
    ops: LevelBatch[];
    picoIds: string[];
  }> {
    let ops: LevelBatch[] = [];
    let picoIds: string[] = [];

    for (const eci of this.children) {
      // recursive delete
      const { pico } = this.pf.lookupChannel(eci);
      const sub = await pico.delPicoDbOps();
      ops = ops.concat(sub.ops);
      picoIds = picoIds.concat(sub.picoIds);
    }

    for (const channel of Object.values(this.channels)) {
      ops.push(channel.toDbDel());
    }
    for (const rid of Object.keys(this.rulesets)) {
      ops = ops.concat(await this.uninstallBase(rid));
    }
    ops.push(this.toDbDel());

    picoIds.push(this.id);

    return { ops, picoIds };
  }

  toReadOnly(): PicoReadOnly {
    const data: PicoReadOnly = {
      id: this.id,
      parent: this.parent,
      children: this.children.slice(0),
      channels: Object.values(this.channels).map((c) => c.toReadOnly()),
      rulesets: Object.keys(this.rulesets).map((rid) => ({
        rid,
        config: this.rulesets[rid].config,
      })),
    };
    data.channels = _.sortBy(data.channels, (c) => {
      return c.id;
    });
    return Object.freeze(data);
  }

  toDbPut(): LevelBatch {
    const value: Record<string, unknown> = {
      id: this.id,
      parent: this.parent,
      children: this.children.slice(0),
    };
    if (this.policyCeiling) {
      value.policyCeiling = this.policyCeiling;
    }
    return {
      type: "put",
      key: ["pico", this.id],
      value,
    };
  }

  toDbDel(): LevelBatch {
    return { type: "del", key: ["pico", this.id] };
  }

  static fromDb(pf: PicoFramework, val: any): Pico {
    const pico = new Pico(pf, val.id);
    pico.parent = val.parent;
    pico.children = val.children;
    if (val.policyCeiling) {
      pico.policyCeiling = normalizePolicyCeiling(val.policyCeiling);
    }
    return pico;
  }

  async newChannel(
    conf?: ChannelConfig,
    familyChannelPicoID?: string,
  ): Promise<Channel> {
    const chann = this.newChannelBase(conf, familyChannelPicoID);
    this.assertChannelWithinCeiling(chann, conf);
    if (this.channels[chann.id]) {
      throw new Error(`Channel id already in use: ${chann.id}`);
    }
    await this.pf.db.batch([chann.toDbPut()]);
    this.channels[chann.id] = chann;
    return chann;
  }

  private resolveNewChannelId(
    conf?: ChannelConfig,
    familyChannelPicoID?: string,
  ): string {
    if (familyChannelPicoID) {
      return this.pf.genID();
    }
    const requestedId = conf?.id;
    if (requestedId == null || requestedId === "") {
      return this.pf.genID();
    }
    const id = validateCustomChannelId(requestedId);
    if (this.pf.eciIsTaken(id)) {
      throw new Error(`Channel id already in use: ${id}`);
    }
    return id;
  }

  private newChannelBase(
    conf?: ChannelConfig,
    familyChannelPicoID?: string,
  ): Channel {
    const id = this.resolveNewChannelId(conf, familyChannelPicoID);
    const chann = new Channel(this, id, conf, familyChannelPicoID);
    return chann;
  }

  async putChannel(eci: string, conf: ChannelConfig): Promise<Channel> {
    const chann = this.channels[eci];
    if (!chann) {
      throw new Error(`ECI not found ${eci}`);
    }
    if (chann.familyChannelPicoID == this.id) {
      throw new Error("Cannot edit the self channel.");
    }
    chann.update(conf);
    this.assertChannelWithinCeiling(chann, conf);
    await this.pf.db.batch([chann.toDbPut()]);
    return chann;
  }

  async delChannel(eci: string): Promise<void> {
    const chann = this.channels[eci];
    if (!chann) {
      throw new Error(`ECI not found ${eci}`);
    }
    if (chann.familyChannelPicoID) {
      throw new Error("Cannot delete family channels.");
    }
    await this.pf.db.del(["pico-channel", chann.id]);
    delete this.channels[eci];
  }

  async install(rs: Ruleset, config: RulesetConfig = {}) {
    const { instance, dbPut } = await this.installBase(rs, config);
    await this.pf.db.batch([dbPut]);
    this.rulesets[rs.rid] = { config, instance };
  }

  async reInitRuleset(rs: Ruleset) {
    const rid = rs.rid;
    if (this.rulesets[rid]) {
      const config = this.rulesets[rid].config;
      const ctx = createRulesetContext(this.pf, this, { rid, config });
      const instance = await rs.init(ctx, this.pf.environment);
      this.rulesets[rid].instance = instance;
      delete this.rulesets[rid].startupError;
    }
  }

  private async installBase(
    rs: Ruleset,
    config: RulesetConfig = {},
  ): Promise<{ instance: RulesetInstance; dbPut: LevelBatch }> {
    // even if we already have that rid installed, we need to init again
    // b/c the configuration may have changed
    const ctx = createRulesetContext(this.pf, this, {
      rid: rs.rid,
      config,
    });
    const instance = await rs.init(ctx, this.pf.environment);

    return {
      instance,
      dbPut: {
        type: "put",
        key: ["pico-ruleset", this.id, rs.rid],
        value: {
          rid: rs.rid,
          config,
        },
      },
    };
  }

  async uninstall(rid: string) {
    const ops = await this.uninstallBase(rid);
    await this.pf.db.batch(ops);
    delete this.rulesets[rid];
  }

  private async uninstallBase(rid: string): Promise<LevelBatch[]> {
    const ops = await dbRange(
      this.pf.db,
      { prefix: ["entvar", this.id, rid] },
      (data) => {
        const delEnt: LevelBatch = {
          type: "del",
          key: data.key,
        };
        return delEnt;
      },
    );
    ops.push({
      type: "del",
      key: ["pico-ruleset", this.id, rid],
    });
    return ops;
  }

  private assertInstalled(rid: string) {
    if (!this.rulesets[rid]) {
      throw new Error(`Not installed ${rid}`);
    }
  }

  async getEnt(rid: string, name: string) {
    this.assertInstalled(rid);
    let data: any;
    try {
      data = await this.pf.db.get(["entvar", this.id, rid, name]);
    } catch (err: any) {
      if (err.notFound) {
        return null;
      }
    }
    return data;
  }

  async putEnt(rid: string, name: string, value: any) {
    this.assertInstalled(rid);
    const key = ["entvar", this.id, rid, name];
    if (value === null || value === undefined) {
      await this.pf.db.del(key);
    } else {
      await this.pf.db.put(key, value);
    }
  }

  async delEnt(rid: string, name: string) {
    this.assertInstalled(rid);
    await this.pf.db.del(["entvar", this.id, rid, name]);
  }

  private schedule: { rid: string; event: PicoEvent }[] = [];
  private current: { rid: string; event: PicoEvent } | undefined;
  private currentTxn: PicoTxn | undefined;

  raiseEvent(
    domain: string,
    name: string,
    attrs: PicoEventPayload["attrs"],
    forRid?: string,
  ) {
    const event = cleanEvent({
      eci: (this.current && this.current.event.eci) || "[raise]",
      domain,
      name,
      data: { attrs },
    });
    if (this.current) {
      copyEnumerableSymbols(this.current.event, event);
    }
    if (typeof forRid === "string") {
      this.addToSchedule(forRid, event);
    } else {
      this.addEventToSchedule(event);
    }
  }

  clearSchedule() {
    this.schedule = [];
    if (this.currentTxn && this.currentTxn.kind === "event") {
      this.pf.emit({
        type: "eventScheduleCleared",
        picoId: this.id,
        txn: this.currentTxn,
      });
    }
  }

  addToSchedule(rid: string, event: PicoEvent) {
    this.schedule.push({ rid, event });
    if (this.currentTxn && this.currentTxn.kind === "event") {
      this.pf.emit({
        type: "eventScheduleAdded",
        picoId: this.id,
        txn: this.currentTxn,
        rid,
        event,
      });
    }
  }

  private addEventToSchedule(event: PicoEvent) {
    for (const rid of Object.keys(this.rulesets)) {
      this.addToSchedule(rid, event);
    }
  }

  private async doTxn(txn: PicoTxn): Promise<any> {
    this.currentTxn = txn;
    try {
      switch (txn.kind) {
        case "event":
          this.schedule = []; // reset schedule every new event
          this.addEventToSchedule(txn.event);
          const eid = txn.id;
          const responses: any[] = [];
          try {
            while ((this.current = this.schedule.shift())) {
              const rs = this.rulesets[this.current.rid];
              if (rs?.instance?.event) {
                // must process one event at a time to maintain the pico's single-threaded guarantee
                const response = await rs.instance.event(
                  this.current.event,
                  eid,
                );
                responses.push(response);
              }
            }
          } finally {
            this.current = undefined;
          }
          return { eid, responses };
        case "query":
          const rs = this.rulesets[txn.query.rid];
          if (!rs) {
            throw new Error(`Pico doesn't have ${txn.query.rid} installed.`);
          }
          const qfn = rs?.instance?.query && rs.instance.query[txn.query.name];
          if (!qfn) {
            throw new Error(
              `Ruleset ${txn.query.rid} does not have query function "${txn.query.name}"`,
            );
          }
          const data = await qfn(txn.query, txn.id);
          return data;
      }
    } finally {
      this.currentTxn = undefined;
    }
  }
}
