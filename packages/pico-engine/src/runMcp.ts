import {
  installEngineRuntimeSettings,
  resolveEngineSettings,
} from "./engineConfig";

/** Dev MCP stdio entry (pico-engine mcp --stdio). */
export async function runMcpCli(argv: string[]): Promise<void> {
  const settings = resolveEngineSettings({});
  installEngineRuntimeSettings(settings);
  if (!process.env.PICO_ENGINE_BASE_URL) {
    process.env.PICO_ENGINE_BASE_URL = settings.baseUrl;
  }
  if (!process.env.PICO_ENGINE_HOME) {
    process.env.PICO_ENGINE_HOME = settings.home;
  }
  const args = argv.slice(1);
  const stdio = args.includes("--stdio") || args.length === 0;
  if (!stdio) {
    console.error("Usage: pico-engine mcp --stdio");
    console.error("");
    console.error("Connects to a running local engine (PICO_ENGINE_BASE_URL).");
    console.error("Requires localhost /c access or PICO_ENGINE_UI_ECI.");
    process.exit(1);
  }
  // JS (not tsc): avoids pulling MCP SDK types into the main compile.
  const { runDevMcpStdio } = require("../mcp/runStdio.js") as {
    runDevMcpStdio: () => Promise<void>;
  };
  await runDevMcpStdio();
}
