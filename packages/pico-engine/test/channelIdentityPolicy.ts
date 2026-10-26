import test from "ava";
import {
  channelHasUnrestrictedAllow,
  isDidcommIngressChannel,
} from "../src/channelIdentityPolicy";

test("channelHasUnrestrictedAllow detects event or query wildcards", (t) => {
  t.false(
    channelHasUnrestrictedAllow({
      id: "x",
      tags: [],
      familyChannelPicoID: null,
      eventPolicy: { allow: [{ domain: "a", name: "b" }], deny: [] },
      queryPolicy: { allow: [{ rid: "r", name: "q" }], deny: [] },
    })
  );
  t.true(
    channelHasUnrestrictedAllow({
      id: "x",
      tags: [],
      familyChannelPicoID: null,
      eventPolicy: { allow: [{ domain: "*", name: "*" }], deny: [] },
      queryPolicy: { allow: [{ rid: "r", name: "q" }], deny: [] },
    })
  );
  t.true(
    channelHasUnrestrictedAllow({
      id: "x",
      tags: [],
      familyChannelPicoID: null,
      eventPolicy: { allow: [], deny: [] },
      queryPolicy: { allow: [{ rid: "*", name: "*" }], deny: [] },
    })
  );
});

test("isDidcommIngressChannel", (t) => {
  t.true(
    isDidcommIngressChannel({
      id: "x",
      tags: ["didcomm", "ingress"],
      familyChannelPicoID: null,
      eventPolicy: { allow: [], deny: [] },
      queryPolicy: { allow: [], deny: [] },
    })
  );
  t.false(
    isDidcommIngressChannel({
      id: "x",
      tags: ["didcomm"],
      familyChannelPicoID: null,
      eventPolicy: { allow: [], deny: [] },
      queryPolicy: { allow: [], deny: [] },
    })
  );
});
