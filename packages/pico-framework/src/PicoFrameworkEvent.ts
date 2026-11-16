import { RulesetConfig } from ".";
import { PicoEvent } from "./PicoEvent";
import { PicoTxn, PicoTxn_event } from "./PicoQueue";

export type PicoFrameworkEvent =
  | PicoFrameworkEvent_startup
  | PicoFrameworkEvent_startupDone
  | PicoFrameworkEvent_startupRulesetInitError
  | PicoFrameworkEvent_txnQueued
  | PicoFrameworkEvent_txnStart
  | PicoFrameworkEvent_txnDone
  | PicoFrameworkEvent_txnError
  | PicoFrameworkEvent_reInitRulesetError
  | PicoFrameworkEvent_newPicoInstallError
  | PicoFrameworkEvent_eventScheduleAdded
  | PicoFrameworkEvent_eventScheduleCleared
  | PicoFrameworkEvent_picoDeleted;

export interface PicoFrameworkEvent_startup {
  type: "startup";
}

export interface PicoFrameworkEvent_startupDone {
  type: "startupDone";
}

/**
 * Error trying to initialize a ruleset during the startup phase
 */
export interface PicoFrameworkEvent_startupRulesetInitError {
  type: "startupRulesetInitError";
  picoId: string;
  rid: string;
  config: RulesetConfig;
  error: any;
}

export interface PicoFrameworkEvent_txnQueued {
  type: "txnQueued";
  picoId: string;
  txn: PicoTxn;
}

export interface PicoFrameworkEvent_txnStart {
  type: "txnStart";
  picoId: string;
  txn: PicoTxn;
}

export interface PicoFrameworkEvent_txnDone {
  type: "txnDone";
  picoId: string;
  txn: PicoTxn;
  data: any;
}

export interface PicoFrameworkEvent_txnError {
  type: "txnError";
  picoId: string;
  txn: PicoTxn;
  error: any;
}

export interface PicoFrameworkEvent_reInitRulesetError {
  type: "reInitRulesetError";
  picoId: string;
  rid: string;
  config?: RulesetConfig;
  error: any;
}

export interface PicoFrameworkEvent_newPicoInstallError {
  type: "newPicoInstallError";
  picoId: string;
  rid: string;
  config?: RulesetConfig;
  error: any;
}

export interface PicoFrameworkEvent_eventScheduleAdded {
  type: "eventScheduleAdded";
  picoId: string;
  txn: PicoTxn_event;
  rid: string;
  event: PicoEvent;
}

export interface PicoFrameworkEvent_eventScheduleCleared {
  type: "eventScheduleCleared";
  picoId: string;
  txn: PicoTxn_event;
}

export interface PicoFrameworkEvent_picoDeleted {
  type: "picoDeleted";
  picoId: string;
}
