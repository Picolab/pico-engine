/**
 * Ruleset ctx API: newChannel.
 */

import * as _ from "lodash";
import test from "ava";
import { mkCtxTestEnv } from "./helpers/mkCtxTestEnv";

test("ctx.newChannel", async function(t) {
  const { pf, event, query } = await mkCtxTestEnv();

  const chann = await event("newChannel", [
    {
      tags: ["some", "thing"],
      eventPolicy: { allow: [], deny: [] },
      queryPolicy: { allow: [], deny: [] }
    }
  ]);

  t.deepEqual(chann, {
    id: "id3",
    tags: ["some", "thing"],
    familyChannelPicoID: null,
    eventPolicy: { allow: [], deny: [] },
    queryPolicy: { allow: [], deny: [] },
    mcpPolicy: { allow: [], deny: [] }
  });

  let err = await t.throwsAsync(
    event("newChannel", [
      { eventPolicy: { allow: [], deny: [{ not: "an", event: "rule" }] } }
    ])
  );
  t.is(
    err + "",
    "TypeError: EventPolicyRule expects {domain: string, name: string}"
  );

  err = await t.throwsAsync(
    event("newChannel", [
      { queryPolicy: { allow: [], deny: [{ not: "a", query: "rule" }] } }
    ])
  );
  t.is(
    err + "",
    "TypeError: QueryPolicyRule expects {rid: string, name: string}"
  );

  err = await t.throwsAsync(event("newChannel", [{ tags: "wat" }]));
  t.is(
    err + "",
    "TypeError: Channel `tags` must be an array of non-empty strings."
  );

  err = await t.throwsAsync(event("newChannel", [{ tags: [1] }]));
  t.is(
    err + "",
    "TypeError: Channel `tags` must be an array of non-empty strings."
  );

  err = await t.throwsAsync(event("newChannel", [{ tags: ["\t\n "] }]));
  t.is(err + "", "TypeError: Channel tag cannot be a blank string.");

  err = await t.throwsAsync(event("newChannel", [{ tags: ["system"] }]));
  t.is(err + "", 'TypeError: Cannot tag channel as "system".');

  const chann1 = await event("newChannel", [{ tags: [] }]);
  t.is(chann1.tags.join(","), "", "tags can be empty");

  const chann2 = await event("newChannel", [
    { tags: ["  Foo--bar_baz 123 ", " -- some-\t-- thing Else?\nI think."] }
  ]);
  t.is(
    chann2.tags.join(","),
    "foo-bar_baz-123,some-thing-else-i-think",
    "slugify channel tags"
  );
});
