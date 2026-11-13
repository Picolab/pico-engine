/**
 * KRL rss module builtins.
 */

import test from "ava";
import krss from "../../src/modules/rss";
import makeCoreAndKrlCtx from "../helpers/makeCoreAndKrlCtx";

const RSS2 = `<?xml version="1.0"?>
<rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>Phil's blog</title>
    <link>https://example.com/</link>
    <description>Notes &amp; essays</description>
    <item>
      <title>First</title>
      <link>https://example.com/1</link>
      <description><![CDATA[<p>One</p>]]></description>
      <guid isPermaLink="false">post-1</guid>
      <dc:creator>Phil</dc:creator>
      <category>picos</category>
      <category>krl</category>
    </item>
    <item>
      <title>Second</title>
      <link>https://example.com/2</link>
      <enclosure url="https://example.com/2.mp3" length="10" type="audio/mpeg"/>
    </item>
    <item><title>Third</title></item>
  </channel>
</rss>`;

const ATOM = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Atom feed</title>
  <subtitle>About things</subtitle>
  <link rel="self" href="https://example.com/feed.xml"/>
  <link href="https://example.com/"/>
  <id>urn:uuid:feed</id>
  <updated>2026-11-13T12:00:00Z</updated>
  <entry>
    <title>Only entry</title>
    <link href="https://example.com/a"/>
    <id>urn:uuid:a</id>
    <updated>2026-11-13T12:00:00Z</updated>
    <summary>Short</summary>
  </entry>
</feed>`;

test("module - rss:* on RSS 2.0", async function (t) {
  const { krlCtx: ctx } = await makeCoreAndKrlCtx();
  const feed = await krss.parse(ctx, [RSS2]);

  t.is(await krss.version(ctx, [feed]), "2.0");
  t.is(await krss.version(ctx, [RSS2]), "2.0", "the XML text works too");
  t.is(await krss.version(ctx, [{ status_code: 200, content: RSS2 }]), "2.0", "and an http:get response");
  t.is(await krss.channel(ctx, [feed, "title"]), "Phil's blog");
  t.is(await krss.channel(ctx, [feed, "description"]), "Notes & essays");
  t.is(await krss.channel(ctx, [feed, "nope"]), null);

  const items = await krss.items(ctx, [feed]);
  t.is(items.length, 3);
  t.like(items[0], {
    title: "First",
    description: "<p>One</p>",
    guid: "post-1",
    "dc:creator": "Phil",
    category: ["picos", "krl"],
  });
  t.deepEqual(items[1].enclosure, { url: "https://example.com/2.mp3", length: "10", type: "audio/mpeg" });

  t.is((await krss.first(ctx, [feed])).title, "First");
  t.is((await krss.last(ctx, [feed])).title, "Third");
  t.is((await krss.index(ctx, [feed, 2])).title, "Second", "index counts from 1");
  t.is(await krss.index(ctx, [feed, 9]), null);
  t.true(["First", "Second", "Third"].includes((await krss.random(ctx, [feed])).title));
  t.is(await krss.item(ctx, [items[0], "link"]), "https://example.com/1");
  t.is(await krss.item(ctx, [items[2], "link"]), null);
});

test("module - rss:* on Atom and bad input", async function (t) {
  const { krlCtx: ctx } = await makeCoreAndKrlCtx();
  const feed = await krss.parse(ctx, [ATOM]);

  t.is(feed.version, "atom");
  t.like(feed.channel, { title: "Atom feed", link: "https://example.com/", description: "About things" });
  t.like(await krss.first(ctx, [feed]), {
    title: "Only entry",
    link: "https://example.com/a",
    guid: "urn:uuid:a",
    description: "Short",
    pubDate: "2026-11-13T12:00:00Z",
  });

  await t.throwsAsync(async () => krss.parse(ctx, ["<html><body>hi</body></html>"]), { message: /not an RSS or Atom feed/ });
  await t.throwsAsync(async () => krss.items(ctx, [42]), { message: /expected a feed/ });
});
