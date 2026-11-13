import { krl } from "krl-stdlib";

function cell(val: any): string {
  if (val === null || val === undefined) {
    return "";
  }
  const str = krl.isArrayOrMap(val) ? krl.encode(val) : krl.toString(val);
  return /[",\r\n]|^\s|\s$/.test(str) ? '"' + str.replace(/"/g, '""') + '"' : str;
}

/** RFC 4180 records: quoted fields may hold commas, doubled quotes, and line breaks. */
function parseRecords(text: string): string[][] {
  const records: string[][] = [];
  let record: string[] = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') {
        quoted = false;
      } else {
        field += c;
      }
    } else if (c === '"') {
      quoted = true;
    } else if (c === ",") {
      record.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") {
        i++;
      }
      record.push(field);
      records.push(record);
      record = [];
      field = "";
    } else {
      field += c;
    }
  }
  if (field !== "" || record.length > 0) {
    record.push(field);
    records.push(record);
  }
  return records;
}

const csv: krl.Module = {
  from_array: krl.Function(["entries", "fields"], function (entries, fields) {
    if (!krl.isArray(entries)) {
      throw new TypeError("csv:from_array expected an array of maps but got " + krl.typeOf(entries));
    }
    let columns: string[];
    if (krl.isArray(fields)) {
      columns = fields.map(krl.toString);
    } else {
      const seen = new Set<string>();
      for (const entry of entries) {
        if (krl.isMap(entry)) {
          Object.keys(entry).forEach((k) => seen.add(k));
        }
      }
      columns = Array.from(seen);
    }
    const lines = [columns.map(cell).join(",")];
    for (const entry of entries) {
      const row = krl.isMap(entry) ? entry : {};
      lines.push(columns.map((col) => cell(row[col])).join(","));
    }
    return lines.join("\n") + "\n";
  }),

  to_array: krl.Function(["str"], function (str) {
    const [header, ...rows] = parseRecords(krl.toString(str));
    if (!header) {
      return [];
    }
    return rows
      .filter((row) => !(row.length === 1 && row[0] === ""))
      .map((row) => {
        const entry: { [field: string]: string } = {};
        header.forEach((col, i) => {
          entry[col] = row[i] === undefined ? "" : row[i];
        });
        return entry;
      });
  }),
};

export default csv;
