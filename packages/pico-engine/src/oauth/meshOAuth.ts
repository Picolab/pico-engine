import { PicoFramework } from "pico-framework";

/** Optional ruleset installed on a root pico to enable mesh-level OAuth (Layer 3b). */
export const OAUTH_MESH_RULESET_RID = "io.picolabs.oauth";

export function rootPicoIdForChannelEci(
  pf: PicoFramework,
  eci: string
): string | null {
  try {
    let pico = pf.lookupChannel(eci).pico;
    while (pico.parent) {
      pico = pf.getPico(pico.parent);
    }
    return pico.id;
  } catch (_e) {
    return null;
  }
}

/** True when the channel's root pico has the mesh OAuth ruleset installed. */
export function meshRequiresOAuth(pf: PicoFramework, eci: string): boolean {
  const rootId = rootPicoIdForChannelEci(pf, eci);
  if (!rootId) {
    return false;
  }
  return rootHasOAuthMeshRuleset(pf, rootId);
}

export function rootHasOAuthMeshRuleset(
  pf: PicoFramework,
  rootPicoId: string
): boolean {
  try {
    const root = pf.getPico(rootPicoId);
    return OAUTH_MESH_RULESET_RID in root.rulesets;
  } catch (_e) {
    return false;
  }
}

/** True when the channel ECI belongs to a pico under rootPicoId (inclusive). */
export function isChannelUnderRoot(
  pf: PicoFramework,
  channelEci: string,
  rootPicoId: string
): boolean {
  const channelRootId = rootPicoIdForChannelEci(pf, channelEci);
  return !!channelRootId && channelRootId === rootPicoId;
}
