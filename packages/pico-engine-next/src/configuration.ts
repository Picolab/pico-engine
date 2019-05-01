import * as _ from "lodash";
import * as path from "path";
import { RulesetEnvironment } from "./KrlCtx";
import { RulesetRegistry } from "./RulesetRegistry";
import { KrlLogger } from "./KrlLogger";

const homeDir = require("home-dir");
const version = require("../package.json").version;

/**
 * Configuration options that may be set by the user
 */
export interface PicoEngineSettings {
  /**
   * The absolute path to the folder where the engine should store the database and logs.
   *
   * Default: "~/.pico-engine/"
   */
  home?: string;

  /**
   * The port number the http server should listen on
   *
   * Default: 8080
   */
  port?: number;

  /**
   * The base url others should use when addressing your engine.
   *
   * Default: "http://localhost:8080"
   */
  base_url?: string;
}

/**
 * The configuration used by the engine
 */
export interface PicoEngineConf {
  home: string;
  port: number;
  base_url: string;
  log_path: string;
  db_path: string;
  version: string;

  log: KrlLogger;

  rsRegistry: RulesetRegistry;
  rsEnvironment: RulesetEnvironment;
}

export function inputToConf(input: PicoEngineSettings = {}): PicoEngineConf {
  let home = input.home;
  let port = input.port;
  let base_url = input.base_url;

  if (typeof home !== "string") {
    home = homeDir(".pico-engine") as string;
  }
  if (!port || !_.isInteger(port) || port < 1) {
    port = 8080;
  }
  if (typeof base_url !== "string") {
    base_url = `http://localhost:${port}`;
  }

  const log_path = path.resolve(home, "pico-engine.log");

  const log = new KrlLogger(log_path, "");

  return {
    home,
    port,
    base_url,
    log_path,
    db_path: path.resolve(home, "db"),
    version,

    log,

    rsRegistry: new RulesetRegistry(home),

    rsEnvironment: new RulesetEnvironment(log)
  };
}
