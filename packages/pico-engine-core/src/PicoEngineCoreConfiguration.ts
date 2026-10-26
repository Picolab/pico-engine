import { krl, KrlLogger, PicoLogEntry } from "krl-stdlib";
import { RulesetRegistryLoader } from "./RulesetRegistry";
import {
  EventPolicyRule,
  PicoDb,
  PolicyCeiling,
  QueryPolicyRule,
} from "pico-framework";

/**
 * Configuration options that may be set by the user
 */
export interface PicoEngineCoreConfiguration {
  /**
   * provide the persistence layer
   */
  db: PicoDb;

  /**
   * How should rulesets be loaded in?
   */
  rsRegLoader: RulesetRegistryLoader;

  /**
   * Logging implementation
   */
  log: KrlLogger;
  getPicoLogs(picoId: string): Promise<PicoLogEntry[]>;

  /**
   * Provide any custom krl modules
   */
  modules?: { [domain: string]: krl.Module };

  /**
   * Trust event.time input. Used for testing
   */
  useEventInputTime?: boolean;

  /**
   * Optionally specify how ids should be generated. Used for testing
   */
  genID?: () => string;

  /**
   * Provide the base URL
   */
  base_url?: string;

  /**
   * When false (default for pico-engine 1b+), the framework boots with zero roots.
   * Set true in tests that expect the historical auto-created root.
   */
  autoCreateRootPico?: boolean;

  /** Default max channel policy for root picos (1.8 policy ceiling). */
  defaultRootPolicyCeiling?: PolicyCeiling;

  /** Engine-wide event denies applied on every channel (1.8). */
  globalEventDeny?: EventPolicyRule[];

  /** Engine-wide query denies applied on every channel (1.8). */
  globalQueryDeny?: QueryPolicyRule[];

  /**
   * Called after ctx:newPico creates a child pico (Epic 3+ identity provisioning).
   */
  onPicoCreated?: (
    picoId: string,
    ctx: { isRoot: boolean; parentPicoId: string }
  ) => Promise<void>;
}
