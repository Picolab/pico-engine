import { randomUUID } from "crypto";
import { krl } from "krl-stdlib";

const DATE_PROPS = new Set([
  "dtstart",
  "dtend",
  "dtstamp",
  "due",
  "created",
  "last-modified",
  "recurrence-id",
  "exdate",
  "rdate",
  "completed",
]);
const TEXT_PROPS = new Set(["summary", "description", "location", "comment", "contact", "resources", "categories"]);
const ADDRESS_PROPS = new Set(["organizer", "attendee"]);

function escapeText(str: string): string {
  return str.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

function pad(n: number, width = 2): string {
  return String(n).padStart(width, "0");
}

function utcStamp(d: Date): string {
  return (
    pad(d.getUTCFullYear(), 4) +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    "T" +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds()) +
    "Z"
  );
}

/** ";VALUE=DATE:20261120" for a date, ":20261120T220000Z" for a time. */
function dateValue(name: string, val: any): string {
  const str = krl.isNumber(val) ? new Date(val).toISOString() : krl.toString(val);
  if (/^\d{8}$/.test(str)) {
    return ";VALUE=DATE:" + str;
  }
  if (/^\d{8}T\d{6}Z?$/.test(str)) {
    return ":" + str;
  }
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(str);
  if (dateOnly) {
    return ";VALUE=DATE:" + dateOnly[1] + dateOnly[2] + dateOnly[3];
  }
  const d = new Date(str);
  if (isNaN(d.getTime())) {
    throw new TypeError("ical:from_array could not read " + name + " as a time: " + str);
  }
  return ":" + utcStamp(d);
}

function addressValue(val: any): string {
  if (krl.isMap(val)) {
    const name = val.cn || val.name;
    const email = val.email ? "mailto:" + krl.toString(val.email) : "invalid:nomail";
    return (name ? ';CN="' + krl.toString(name).replace(/"/g, "'") + '"' : "") + ":" + email;
  }
  const str = krl.toString(val);
  if (/^[a-z][a-z0-9+.-]*:/i.test(str)) {
    return ":" + str;
  }
  if (str.includes("@")) {
    return ":mailto:" + str;
  }
  return ';CN="' + str.replace(/"/g, "'") + '":invalid:nomail';
}

function geoValue(val: any): string {
  if (krl.isArray(val)) {
    return ":" + val[0] + ";" + val[1];
  }
  if (krl.isMap(val)) {
    return ":" + val.lat + ";" + (val.lon ?? val.lng ?? val.long);
  }
  return ":" + krl.toString(val).replace(/\s*,\s*/, ";");
}

function propertyLine(key: string, val: any): string {
  const name = key.toLowerCase();
  let rest: string;
  if (DATE_PROPS.has(name)) {
    rest = dateValue(name, val);
  } else if (ADDRESS_PROPS.has(name)) {
    rest = addressValue(val);
  } else if (name === "geo") {
    rest = geoValue(val);
  } else if (name === "categories" && krl.isArray(val)) {
    rest = ":" + val.map((v: any) => escapeText(krl.toString(v))).join(",");
  } else if (TEXT_PROPS.has(name)) {
    rest = ":" + escapeText(krl.toString(val));
  } else {
    rest = ":" + krl.toString(val);
  }
  return name.toUpperCase() + rest;
}

/** RFC 5545 3.1: lines longer than 75 octets continue on lines that start with a space. */
function fold(line: string): string {
  const parts: string[] = [];
  let current = "";
  let octets = 0;
  for (const ch of line) {
    const size = Buffer.byteLength(ch);
    const limit = parts.length === 0 ? 75 : 74;
    if (octets + size > limit) {
      parts.push(current);
      current = "";
      octets = 0;
    }
    current += ch;
    octets += size;
  }
  parts.push(current);
  return parts.join("\r\n ");
}

const ical: krl.Module = {
  from_array: krl.Function(["entries", "meta"], function (entries, meta) {
    if (!krl.isArray(entries)) {
      throw new TypeError("ical:from_array expected an array of maps but got " + krl.typeOf(entries));
    }
    const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Pico Labs//pico-engine//EN", "CALSCALE:GREGORIAN"];
    if (krl.isMap(meta) && meta.name) {
      lines.push("X-WR-CALNAME:" + escapeText(krl.toString(meta.name)));
    }
    if (krl.isMap(meta) && meta.desc) {
      lines.push("X-WR-CALDESC:" + escapeText(krl.toString(meta.desc)));
    }
    const stamp = utcStamp(new Date());
    entries.forEach((entry: any, i: number) => {
      if (!krl.isMap(entry) || !entry.dtstart) {
        throw new TypeError("ical:from_array entry " + i + " needs a dtstart");
      }
      const keys = Object.keys(entry);
      const has = (k: string) => keys.some((key) => key.toLowerCase() === k);
      lines.push("BEGIN:VEVENT");
      if (!has("uid")) {
        lines.push("UID:" + randomUUID() + "@pico-engine");
      }
      if (!has("dtstamp")) {
        lines.push("DTSTAMP:" + stamp);
      }
      for (const key of keys) {
        const val = entry[key];
        if (val === null || val === undefined) {
          continue;
        }
        const values = krl.isArray(val) && key.toLowerCase() !== "categories" && key.toLowerCase() !== "geo" ? val : [val];
        for (const v of values) {
          lines.push(propertyLine(key, v));
        }
      }
      lines.push("END:VEVENT");
    });
    lines.push("END:VCALENDAR");
    return lines.map(fold).join("\r\n") + "\r\n";
  }),
};

export default ical;
