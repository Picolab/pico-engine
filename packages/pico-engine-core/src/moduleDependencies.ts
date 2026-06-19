import { Ruleset } from "pico-framework";
import { CachedRuleset } from "./RulesetRegistry";

export function getModuleUses(ruleset: Ruleset): string[] {
  const meta = (
    ruleset as { meta?: { use?: { kind: string; rid: string }[] } }
  ).meta;
  if (!meta?.use) {
    return [];
  }
  return meta.use.filter((u) => u.kind === "module").map((u) => u.rid);
}

function findCycle(graph: Map<string, string[]>): string[] | null {
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const path: string[] = [];

  function dfs(node: string): string[] | null {
    if (visiting.has(node)) {
      const cycleStart = path.indexOf(node);
      return [...path.slice(cycleStart), node];
    }
    if (visited.has(node)) {
      return null;
    }
    visiting.add(node);
    path.push(node);
    for (const dep of graph.get(node) || []) {
      const cycle = dfs(dep);
      if (cycle) {
        return cycle;
      }
    }
    path.pop();
    visiting.delete(node);
    visited.add(node);
    return null;
  }

  for (const node of graph.keys()) {
    const cycle = dfs(node);
    if (cycle) {
      return cycle;
    }
  }
  return null;
}

function formatCycle(cycle: string[], preferStart: string): string {
  const nodes = cycle.slice(0, -1);
  const idx = nodes.indexOf(preferStart);
  if (idx === -1) {
    return cycle.join(" -> ");
  }
  return [...nodes.slice(idx), ...nodes.slice(0, idx), preferStart].join(" -> ");
}

export function validateModuleDependencies(
  cachedRulesets: CachedRuleset[],
  updating: { url: string; rid: string; deps: string[] }
): void {
  const availableRids = new Set<string>();
  const graph = new Map<string, string[]>();

  for (const crs of cachedRulesets) {
    if (crs.url === updating.url) {
      continue;
    }
    availableRids.add(crs.rid);
    graph.set(crs.rid, getModuleUses(crs.ruleset));
  }

  for (const dep of updating.deps) {
    if (dep !== updating.rid && !availableRids.has(dep)) {
      throw new Error(`Dependant module not loaded: ${dep}`);
    }
  }

  graph.set(updating.rid, updating.deps);

  const cycle = findCycle(graph);
  if (cycle) {
    throw new Error(
      `Dependency Cycle Found: ${formatCycle(cycle, updating.rid)}`
    );
  }
}
