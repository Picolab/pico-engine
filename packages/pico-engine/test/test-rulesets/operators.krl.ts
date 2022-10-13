import test from "ava";
import { startTestEngine } from "../helpers/startTestEngine";

test("operators.krl", async t => {
  const { mkQuery } = await startTestEngine(["operators.krl"]);
  const query = mkQuery("io.picolabs.operators");

  t.deepEqual(await query("results"), {
    str_as_num: 100.25,
    num_as_str: "1.05",
    regex_as_str: "re#blah#i",
    isnull: [false, false, true],
    typeof: [
      "Number",
      "String",
      "String",
      "Array",
      "Map",
      "RegExp",
      "Null",
      "Null"
    ],
    "75.chr()": "K",
    "0.range(10)": [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    "10.sprintf": "< 10>",
    ".capitalize()": "Hello World",
    ".decode()": [3, 4, 5],
    ".extract": ["s is a st", "ring"],
    ".lc()": "hello world",
    ".match true": true,
    ".match false": false,
    ".ord()": 72,
    ".replace": "Hello Billiam!",
    ".split": ["a", "b", "c"],
    ".sprintf": "Hello Jim!",
    ".substr(5)": "is a string",
    ".substr(5, 4)": "is a",
    ".substr(5, -5)": "is a s",
    ".substr(25)": "",
    ".uc()": "HELLO WORLD"
  });

  t.deepEqual(await query("returnMapAfterKlog"), { a: 1 });
  t.deepEqual(await query("returnArrayAfterKlog"), [1, 2]);
});
