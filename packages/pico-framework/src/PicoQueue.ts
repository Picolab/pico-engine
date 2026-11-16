import { PicoEvent } from "./PicoEvent";
import { PicoQuery } from "./PicoQuery";
import { PicoFrameworkEvent } from "./PicoFrameworkEvent";

export interface PicoTxn_base {
  id: string;
}
export interface PicoTxn_event extends PicoTxn_base {
  kind: "event";
  event: PicoEvent;
}
export interface PicoTxn_query extends PicoTxn_base {
  kind: "query";
  query: PicoQuery;
}
export type PicoTxn = PicoTxn_event | PicoTxn_query;

export class PicoQueue {
  // TODO use flumelog-offset or similar
  private txnLog: PicoTxn[] = [];
  private txnWaiters: {
    [id: string]: { resolve: (data: any) => void; reject: (err: any) => void };
  } = {};
  private isWorking = false;

  private currentTxn: PicoTxn | undefined;

  constructor(
    private picoId: string,
    private worker: (txn: PicoTxn) => Promise<any>,
    private emit: (txn: PicoFrameworkEvent) => void
  ) {}

  push(txn: PicoTxn) {
    Object.freeze(txn);
    this.txnLog.push(txn);
    this.emit({
      type: "txnQueued",
      picoId: this.picoId,
      txn
    });
    setTimeout(() => this.doWork(), 0);
  }

  waitFor(id: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.txnWaiters[id] = { resolve, reject };
    });
  }

  getCurrentTxn(): PicoTxn | undefined {
    return this.currentTxn;
  }

  private async doWork() {
    if (this.isWorking) {
      return;
    }
    this.isWorking = true;

    while ((this.currentTxn = this.txnLog.shift())) {
      let txn = this.currentTxn;
      let data;
      let error;

      this.emit({
        type: "txnStart",
        picoId: this.picoId,
        txn
      });

      try {
        data = await this.worker(txn);
      } catch (err) {
        error = err;
      }

      if (error) {
        this.emit({
          type: "txnError",
          picoId: this.picoId,
          txn,
          error
        });
      } else {
        this.emit({
          type: "txnDone",
          picoId: this.picoId,
          txn,
          data
        });
      }

      if (this.txnWaiters[txn.id]) {
        if (error) {
          this.txnWaiters[txn.id].reject(error);
        } else {
          this.txnWaiters[txn.id].resolve(data);
        }
        delete this.txnWaiters[txn.id];
      }
    }
    this.txnWaiters = {};
    this.isWorking = false;
    this.currentTxn = undefined;
  }
}
