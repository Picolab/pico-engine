import * as _ from "lodash";

export class PicoRidDependencies {
  private picoRidUses: {
    [picoId: string]: { [rid: string]: { [usesRid: string]: true } };
  } = {};
  private picoRidUsedBy: {
    [picoId: string]: { [rid: string]: { [usedByRid: string]: true } };
  } = {};

  use(picoId: string, myRid: string, theirRid: string) {
    _.set(this.picoRidUses, [picoId, myRid, theirRid], true);
    _.set(this.picoRidUsedBy, [picoId, theirRid, myRid], true);
  }

  whoUses(picoId: string, rid: string): string[] {
    return Object.keys(_.get(this.picoRidUsedBy, [picoId, rid], {}));
  }

  unUse(picoId: string, rid: string) {
    _.unset(this.picoRidUses, [picoId, rid]);
  }
}
