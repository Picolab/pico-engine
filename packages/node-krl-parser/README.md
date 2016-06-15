# krl-parser

[![build status](https://secure.travis-ci.org/farskipper/node-krl-parser.svg)](https://travis-ci.org/farskipper/node-krl-parser)

Parse KRL source code into an AST

## AST Specification

### Node
All AST nodes implement `Node`
```js
interface Node {
  type: string;
  loc: SourceLocation | null;
}
```
```js
interface SourceLocation {
  start: integer;
  end: integer;
}
```
`start` and `end` are character indexes (starting at 0) from the source string.

## License
MIT
