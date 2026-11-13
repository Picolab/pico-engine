/**
 * KRL ical module builtins.
 */

import test from "ava";
import kical from "../../src/modules/ical";
import makeCoreAndKrlCtx from "../helpers/makeCoreAndKrlCtx";

test("module - ical:from_array", async function (t) {
  const { krlCtx: ctx } = await makeCoreAndKrlCtx();

  const cal: string = await kical.from_array(ctx, [
    [
      {
        uid: "standup-1@example.com",
        dtstart: "2026-11-20T09:00:00-07:00",
        dtend: "20261120T163000Z",
        summary: "Standup; daily, short",
        description: "Line one\nLine two",
        location: "Room 2",
        geo: [40.33, -111.71],
        organizer: { name: "Ada", email: "ada@example.com" },
        attendee: ["bob@example.com", "Cy"],
        comment: ["first", "second"],
        categories: ["work", "team"],
        url: "https://example.com/standup",
      },
      { dtstart: "2026-12-25", summary: "x".repeat(100) },
    ],
    { name: "Team", desc: "Team events" },
  ]);

  t.true(cal.endsWith("\r\n"));
  t.false(/[^\r]\n/.test(cal), "every line ends in CRLF");
  const lines = cal.replace(/\r\n /g, "").split("\r\n");
  t.deepEqual(lines.slice(0, 6), [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Pico Labs//pico-engine//EN",
    "CALSCALE:GREGORIAN",
    "X-WR-CALNAME:Team",
    "X-WR-CALDESC:Team events",
  ]);
  for (const line of [
    "UID:standup-1@example.com",
    "DTSTART:20261120T160000Z",
    "DTEND:20261120T163000Z",
    "SUMMARY:Standup\\; daily\\, short",
    "DESCRIPTION:Line one\\nLine two",
    "LOCATION:Room 2",
    "GEO:40.33;-111.71",
    'ORGANIZER;CN="Ada":mailto:ada@example.com',
    "ATTENDEE:mailto:bob@example.com",
    'ATTENDEE;CN="Cy":invalid:nomail',
    "COMMENT:first",
    "COMMENT:second",
    "CATEGORIES:work,team",
    "URL:https://example.com/standup",
    "DTSTART;VALUE=DATE:20261225",
    "SUMMARY:" + "x".repeat(100),
  ]) {
    t.true(lines.includes(line), line);
  }
  t.is(lines.filter((l) => l === "BEGIN:VEVENT").length, 2);
  t.is(lines.filter((l) => l.startsWith("DTSTAMP:")).length, 2);
  t.regex(lines.filter((l) => l.startsWith("UID:"))[1], /^UID:[0-9a-f-]{36}@pico-engine$/, "a UID is added");
  t.true(cal.split("\r\n").every((l) => Buffer.byteLength(l) <= 75), "long lines are folded");
  t.is(lines[lines.length - 2], "END:VCALENDAR");

  await t.throwsAsync(async () => kical.from_array(ctx, [[{ summary: "no start" }]]), { message: /needs a dtstart/ });
  await t.throwsAsync(async () => kical.from_array(ctx, [[{ dtstart: "someday" }]]), { message: /as a time/ });
});
