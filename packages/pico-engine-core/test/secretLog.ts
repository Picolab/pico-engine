import test from "ava";
import {
  redactSecretsForLog,
  redactTxnForLog,
  rememberPdsSettings,
} from "../src/secretLog";

test("settings records and add_settings values are masked in logs", (t) => {
  rememberPdsSettings("pico-1", {
    "app.rid": {
      secret: ["apiKey"],
      data: { apiKey: "square-sandbox-key-123", shareEmail: true },
    },
  });
  const logged = redactSecretsForLog({
    data: { apiKey: "square-sandbox-key-123", shareEmail: true },
    secret: ["apiKey"],
    note: "square-sandbox-key-123",
  });
  t.deepEqual(logged, {
    data: { apiKey: { secret: true, set: true }, shareEmail: true },
    secret: ["apiKey"],
    note: { secret: true, set: true },
  });

  const txn = redactTxnForLog("pico-1", {
    kind: "event",
    event: {
      domain: "pds",
      name: "add_settings",
      data: {
        attrs: {
          keyed_rid: "app.rid",
          data_key: "apiKey",
          value: "square-sandbox-key-123",
        },
      },
    },
  });
  t.deepEqual(
    (txn as { event: { data: { attrs: { value: unknown } } } }).event.data.attrs.value,
    { secret: true, set: true }
  );

  const scheduled = redactSecretsForLog({
    domain: "pds",
    name: "add_settings",
    data: {
      attrs: {
        keyed_rid: "app.rid",
        data_key: "apiKey",
        value: "square-sandbox-key-456",
      },
    },
  }) as { data: { attrs: { value: unknown } } };
  t.deepEqual(scheduled.data.attrs.value, { secret: true, set: true });
});
