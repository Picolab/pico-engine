/** Stored Veramo key material for did:peer re-import after engine restart. */
export interface StoredVeramoKey {
  type: string;
  kid: string;
  privateKeyHex: string;
  publicKeyHex: string;
  meta?: Record<string, unknown>;
  kms: string;
}

export interface StoredPeerDidBundle {
  veramoKeys: StoredVeramoKey[];
}

export function peerKeysFromRecord(
  keys: Record<string, unknown> | undefined
): StoredVeramoKey[] | null {
  if (!keys || !Array.isArray(keys.veramoKeys)) {
    return null;
  }
  return keys.veramoKeys as StoredVeramoKey[];
}
