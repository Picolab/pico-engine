import test from "ava";
import {
  attachRequestCookies,
  isEngineCredentialCookie,
  parseApplicationCookies,
  requestCookie,
} from "../src/requestCookies";

test("application cookies are kept and engine cookies are dropped", (t) => {
  t.true(isEngineCredentialCookie("pico-session"));
  t.true(isEngineCredentialCookie("pico-session-3000"));
  t.true(isEngineCredentialCookie("pico-ceremony"));
  t.true(isEngineCredentialCookie("pico-ceremony-3001"));
  t.false(isEngineCredentialCookie("wellKnown_Rx"));

  const jar = parseApplicationCookies(
    "wellKnown_Rx=abc123; pico-session-3000=sekret; pair=a=b; pico-ceremony=cer"
  );
  t.deepEqual(jar, { wellKnown_Rx: "abc123", pair: "a=b" });
});

test("requestCookie reads the jar attached to the event", (t) => {
  const event: { data: { attrs: Record<string, string> } } = {
    data: { attrs: { which: "wellKnown_Rx" } },
  };
  attachRequestCookies(event, "wellKnown_Rx=abc123; pico-session=sekret; pair=a=b");
  t.deepEqual(event.data.attrs, { which: "wellKnown_Rx" });

  const host = { getEvent: () => event, getQuery: () => null };
  t.is(requestCookie(host, "wellKnown_Rx"), "abc123");
  t.is(requestCookie(host, "pair"), "a=b");
  t.is(requestCookie(host, "pico-session"), null);
  t.is(requestCookie(host, "nope"), null);
  t.is(requestCookie(null, "wellKnown_Rx"), null);
});
