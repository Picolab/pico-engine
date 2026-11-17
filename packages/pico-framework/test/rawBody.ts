/**
 * A channel keeps the raw HTTP body only when rawBody is set. Old channel
 * records, which have no such field, do not.
 */

import test from "ava";
import { Channel } from "../src/Channel";
import { Pico } from "../src/Pico";

const pico = {} as Pico;

test("rawBody is off unless the channel asks for it, and it round-trips", (t) => {
  const plain = Channel.fromDb(pico, {
    id: "old-channel-id",
    tags: ["hook"],
  });
  t.false(plain.rawBody);
  t.false(storedRawBody(plain));
  t.false(Object.prototype.hasOwnProperty.call(plain.toReadOnly(), "rawBody"));

  const kept = Channel.fromDb(pico, {
    id: "signed-channel",
    tags: ["hook"],
    rawBody: true,
  });
  t.true(kept.rawBody);
  t.true(storedRawBody(kept));
  t.is(kept.toReadOnly().rawBody, true);

  kept.update({
    tags: ["hook"],
    eventPolicy: kept.eventPolicy,
    queryPolicy: kept.queryPolicy,
    rawBody: false,
  });
  t.false(kept.rawBody);
  t.false(storedRawBody(kept));
});

function storedRawBody(channel: Channel): boolean {
  const op = channel.toDbPut();
  return op.type === "put" && (op.value as { rawBody?: boolean }).rawBody === true;
}
