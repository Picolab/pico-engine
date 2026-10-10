import test from "ava";
import { patchEstablishedBusesForMovedRoot } from "../src/identity/localPeerReconcile";

test("patchEstablishedBusesForMovedRoot updates coordinator bus for moved bike", (t) => {
  const oldTx = "old-bike-query-eci";
  const newTx = "new-bike-query-eci";
  const established = [
    {
      Id: "sub-coord",
      layer2: true,
      Tx_role: "ride_coordinator",
      Rx_role: "bike",
      picoID: "old-bike-pico",
      Tx: oldTx,
      Tx_did: "did:webvh:old",
      Tx_host: "http://localhost:3001",
    },
  ];
  const result = {
    oldRootPicoId: "old-bike-pico",
    newRootPicoId: "new-bike-pico",
    newRootEci: "new-family",
    eciMap: { [oldTx]: newTx, "old-bike-pico": "new-bike-pico" },
    picoIdMap: { "old-bike-pico": "new-bike-pico" },
  };
  const { next, changed } = patchEstablishedBusesForMovedRoot(
    established,
    result,
    {
      priorDid: "did:webvh:old",
      newDid: "did:webvh:new-scid-same",
    },
    "http://localhost:3002"
  );
  t.true(changed);
  t.is(next[0].picoID, "new-bike-pico");
  t.is(next[0].Tx, newTx);
  t.is(next[0].Tx_did, "did:webvh:new-scid-same");
  t.is(next[0].Tx_host, "http://localhost:3002");
});
