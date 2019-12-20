import { Token, TokenType } from "./types";

const rawToks = [
  "<=>",
  "<=",
  "<",
  "||",
  "|",
  "==",
  "=>",
  "=",
  ":=",
  ":",
  ">=",
  "><",
  ">",
  "&&",
  "!=",
  "(",
  ")",
  "{",
  "}",
  "[",
  "]",
  ",",
  "/",
  ".",
  "-",
  "%",
  "+",
  ";",
  "*"
];

export default function tokenizer(src: string): Token[] {
  const tokens: Token[] = [];
  const beestingStack: { curly_count: number }[] = [];
  let buff = ""; // modified by pushTok and addToBuffer
  let peek = "";
  let i = 0;
  let c = src[0];
  let nextIndex = 0;

  function pushTok(value: string, type: TokenType, missingClose?: string) {
    tokens.push({
      type: type,
      src: value,
      loc: { start: nextIndex, end: nextIndex + value.length },
      missingClose
    });
    nextIndex = nextIndex + value.length;
    buff = "";
  }

  function advance(n: number) {
    i += n;
    c = src[i];
  }

  // loop invariant: c = src[i] follows the last character buff contained
  function addToBuffer(stopCond: () => boolean, doEscaping: boolean = false) {
    let escaped = false;
    while (i < src.length && (!stopCond() || escaped)) {
      if (escaped) {
        escaped = false;
      } else if (doEscaping) {
        escaped = c === "\\";
      }

      buff += c;
      advance(1);
    }
  }

  function handleChevronBody() {
    addToBuffer(function() {
      peek = src.substring(i, i + 2);
      return peek === "#{" || peek === ">>";
    }, true);

    if (buff.length > 0) {
      pushTok(buff, "CHEVRON-STRING");
    }

    if (peek === "#{") {
      pushTok("#{", "CHEVRON-BEESTING-OPEN");
      beestingStack.push({ curly_count: 0 });
    } else if (peek === ">>") {
      pushTok(">>", "CHEVRON-CLOSE");
    }

    advance(2);
  }

  while (i < src.length) {
    if (/\s/.test(c)) {
      addToBuffer(function() {
        return !/\s/.test(c);
      });

      pushTok(buff, "WHITESPACE");

      continue;
    }
    if (c === "/") {
      peek = src[i + 1];
      if (peek === "/") {
        addToBuffer(function() {
          return c === "\n" || c === "\r";
        });

        if (i < src.length) {
          pushTok(buff + c, "LINE-COMMENT");
          advance(1);
        } else {
          pushTok(buff, "LINE-COMMENT");
        }

        continue;
      }
      if (peek === "*") {
        addToBuffer(function() {
          return c === "*" && src[i + 1] === "/" && buff.length > 1; // '/*/' isn't valid
        });

        if (i < src.length) {
          pushTok(buff + "*/", "BLOCK-COMMENT");
          advance(2);
        } else {
          pushTok(buff, "MISSING-CLOSE", "*/");
        }

        continue;
      }

      // fallthrough
    }
    if (/[0-9]/.test(c)) {
      addToBuffer(function() {
        return !/[0-9]/.test(c);
      });

      if (c !== "." || !/[0-9]/.test(src[i + 1])) {
        pushTok(buff, "NUMBER");
        continue;
      }

      // fallthrough
    }
    if (c === "." && /[0-9]/.test(src[i + 1])) {
      buff += ".";
      advance(1);

      addToBuffer(function() {
        return !/[0-9]/.test(c);
      });

      pushTok(buff, "NUMBER");
      continue;
    }
    if (c === '"') {
      addToBuffer(function() {
        return c === '"' && buff.length > 0;
      }, true);

      if (i < src.length) {
        pushTok(buff + '"', "STRING");
        advance(1);
      } else {
        pushTok(buff, "MISSING-CLOSE", '"');
      }

      continue;
    }
    if (c === "r" && src.substring(i + 1, i + 3) === "e#") {
      addToBuffer(function() {
        return c === "#" && buff.length > 2;
      }, true);

      peek = src.substring(i + 1, i + 3);
      if (peek === "gi" || peek === "ig") {
        pushTok(buff + "#" + peek, "REGEXP");
        advance(3);
      } else if (peek[0] === "i" || peek[0] === "g") {
        pushTok(buff + "#" + peek[0], "REGEXP");
        advance(2);
      } else if (i < src.length) {
        pushTok(buff + "#", "REGEXP");
        advance(1);
      } else {
        pushTok(buff, "MISSING-CLOSE", "#");
      }

      continue;
    }
    if (c === "<" && src[i + 1] === "<") {
      pushTok("<<", "CHEVRON-OPEN");
      advance(2);

      handleChevronBody();

      continue;
    }
    if (/[a-zA-Z_$]/.test(c)) {
      addToBuffer(function() {
        return !/[a-zA-Z0-9_$]/.test(c);
      });

      pushTok(buff, "SYMBOL");
      continue;
    }

    if (beestingStack.length > 0) {
      if (c === "{") {
        beestingStack[beestingStack.length - 1].curly_count++;
      } else if (c === "}") {
        if (beestingStack[beestingStack.length - 1].curly_count === 0) {
          pushTok("}", "CHEVRON-BEESTING-CLOSE");
          advance(1);
          beestingStack.pop();

          handleChevronBody();

          continue;
        } else {
          beestingStack[beestingStack.length - 1].curly_count--;
        }
      }
    }

    var tok = 0;

    while (tok < rawToks.length) {
      if (rawToks[tok] === src.substring(i, i + rawToks[tok].length)) {
        pushTok(rawToks[tok], "RAW");
        advance(rawToks[tok].length);
        break;
      }
      tok++;
    }

    if (tok === rawToks.length) {
      pushTok(c, "ILLEGAL");
      advance(1);
    }
  }

  return tokens;
}
