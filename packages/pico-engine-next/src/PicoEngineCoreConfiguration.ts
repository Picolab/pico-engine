import { AbstractLevelDOWN } from "abstract-leveldown";
import { krl, KrlLogger, PicoLogEntry } from "krl-stdlib";
import { RulesetRegistryLoader } from "./RulesetRegistry";

/**
 * Configuration options that may be set by the user
 */
export interface PicoEngineCoreConfiguration {
  /**
   * provide the persistence layer
   */
  leveldown: AbstractLevelDOWN;

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
}
