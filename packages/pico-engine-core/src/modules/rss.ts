import { XMLParser } from "fast-xml-parser";
import { krl } from "krl-stdlib";

interface Feed {
  version: string;
  channel: { [name: string]: any };
  items: Array<{ [name: string]: any }>;
}

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  textNodeName: "#text",
  parseTagValue: false,
  parseAttributeValue: false,
  trimValues: true,
  htmlEntities: true,
});

function asArray(v: any): any[] {
  return v === undefined || v === null ? [] : Array.isArray(v) ? v : [v];
}

/** An element with child elements becomes a map, one with text becomes its text, an empty one its attributes. */
function simplify(node: any): any {
  if (node === null || node === undefined) {
    return "";
  }
  if (Array.isArray(node)) {
    return node.map(simplify);
  }
  if (typeof node !== "object") {
    return String(node);
  }
  const attrs: { [name: string]: string } = {};
  const children: { [name: string]: any } = {};
  let text: string | undefined;
  for (const key of Object.keys(node)) {
    if (key === "#text") {
      text = String(node[key]);
    } else if (key.startsWith("@_")) {
      attrs[key.slice(2)] = String(node[key]);
    } else {
      children[key] = simplify(node[key]);
    }
  }
  if (Object.keys(children).length > 0) {
    return { ...attrs, ...children };
  }
  if (text !== undefined) {
    return text;
  }
  return Object.keys(attrs).length > 0 ? attrs : "";
}

function atomHref(link: any): string | null {
  const links = asArray(link);
  const alt = links.find((l) => typeof l === "object" && (!l.rel || l.rel === "alternate")) || links[0];
  if (!alt) {
    return null;
  }
  return typeof alt === "object" ? alt.href || null : String(alt);
}

function parse(xml: string): Feed {
  let doc: any;
  try {
    doc = parser.parse(xml);
  } catch (err) {
    throw new TypeError("rss: could not parse the feed: " + err);
  }
  if (doc.rss) {
    const { item, ...channel } = doc.rss.channel || {};
    return {
      version: String(doc.rss["@_version"] || "2.0"),
      channel: simplify(channel) || {},
      items: asArray(item).map(simplify),
    };
  }
  if (doc["rdf:RDF"]) {
    const rdf = doc["rdf:RDF"];
    return {
      version: "1.0",
      channel: simplify(rdf.channel) || {},
      items: asArray(rdf.item).map(simplify),
    };
  }
  if (doc.feed) {
    const { entry, ...feed } = doc.feed;
    const channel = simplify(feed) || {};
    channel.link = atomHref(channel.link);
    if (channel.description === undefined && channel.subtitle !== undefined) {
      channel.description = channel.subtitle;
    }
    const items = asArray(entry).map((e) => {
      const item = simplify(e);
      item.link = atomHref(item.link);
      item.guid = item.guid ?? item.id;
      item.description = item.description ?? item.summary ?? item.content;
      item.pubDate = item.pubDate ?? item.published ?? item.updated;
      return item;
    });
    return { version: "atom", channel, items };
  }
  throw new TypeError("rss: not an RSS or Atom feed");
}

/** A feed from rss:parse, the XML text of a feed, or an http:get response holding one. */
function toFeed(source: any): Feed {
  if (krl.isString(source)) {
    return parse(source);
  }
  if (krl.isMap(source) && krl.isArray(source.items) && krl.isMap(source.channel)) {
    return source;
  }
  if (krl.isMap(source) && krl.isString(source.content)) {
    return parse(source.content);
  }
  throw new TypeError("rss: expected a feed, its XML, or an http:get response but got " + krl.typeOf(source));
}

const rss: krl.Module = {
  parse: krl.Function(["source"], function (source) {
    return toFeed(source);
  }),

  version: krl.Function(["feed"], function (feed) {
    return toFeed(feed).version;
  }),

  items: krl.Function(["feed"], function (feed) {
    return toFeed(feed).items;
  }),

  first: krl.Function(["feed"], function (feed) {
    return toFeed(feed).items[0] ?? null;
  }),

  last: krl.Function(["feed"], function (feed) {
    const items = toFeed(feed).items;
    return items[items.length - 1] ?? null;
  }),

  index: krl.Function(["feed", "n"], function (feed, n) {
    const i = krl.toNumberOrNull(n);
    if (i === null) {
      throw new TypeError("rss:index expected a number but got " + krl.typeOf(n));
    }
    return toFeed(feed).items[i - 1] ?? null;
  }),

  random: krl.Function(["feed"], function (feed) {
    const items = toFeed(feed).items;
    return items.length > 0 ? items[Math.floor(Math.random() * items.length)] : null;
  }),

  channel: krl.Function(["feed", "name"], function (feed, name) {
    const channel = toFeed(feed).channel;
    return name === undefined || name === null ? channel : channel[krl.toString(name)] ?? null;
  }),

  item: krl.Function(["item", "name"], function (item, name) {
    if (!krl.isMap(item)) {
      throw new TypeError("rss:item expected an item map but got " + krl.typeOf(item));
    }
    return item[krl.toString(name)] ?? null;
  }),
};

export default rss;
