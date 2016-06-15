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

### Literals

```js
"hello world"
{
  "type": "String"
  "value": "hello world"
}

-12.3
{
  "type": "Number"
  "value": -12.3
}

thing
{
  "type": "Identifier"
  "value": "thing"
}

true
{
  "type": "Boolean"
  "value": true
}

re#^My name is (.*)#i
{
  "type": "RegExp"
  "value": /^My name is (.*)/i
}

[a, b, c]
{
  "type": "Array"
  "value": [ a , b , c ]
}

{"one": a}
{
  "type": "Object"
  "value": [
    {
      "type": "ObjectProperty"
      "key": {
        "type": "String"
        "value": "one"
      }
      "value": a
    }
  ]
}

<<
  hello #{name}!
  >>
{
  "type": "DoubleQuote"
  "value": [
    {
      "type": "String"
      "value": "\n  hello "
    },
    name,
    {
      "type": "String"
      "value": "!\n  "
    }
  ]
}
```

### Assignment

```js
a = b
{
  "type": "AssignmentExpression"
  "op": "="
  "left": a
  "right": b
}
```

### Infix Operators

```js
a && b
{
  "type": "InfixOperator"
  "op": "&&"
  "left": a
  "right": b
}

a + b + c
{
  "type": "InfixOperator"
  "op": "+"
  "left": {
    "type": "InfixOperator"
    "op": "+"
    "left": a
    "right": b
  }
  "right": c
}

a + b * c
{
  "type": "InfixOperator"
  "op": "+"
  "left": a
  "right": {
    "type": "InfixOperator"
    "op": "*"
    "left": b
    "right": c
  }
}

a < b
{
  "type": "InfixOperator"
  "op": "<"
  "left": a
  "right": b
}

a cmp b
{
  "type": "InfixOperator"
  "op": "cmp"
  "left": a
  "right": b
}

a <=> b
{
  "type": "InfixOperator"
  "op": "<=>"
  "left": a
  "right": b
}
```

### Conditionals

```js
a => b | c
{
  "type": "ConditionalExpression"
  "test": a
  "consequent": b
  "alternate": c
}

a => b |
c => d |
     e
{
  "type": "ConditionalExpression"
  "test": a
  "consequent": b
  "alternate": {
    "type": "ConditionalExpression"
    "test": c
    "consequent": d
    "alternate": e
  }
}
```

### Functions

```js
function(a){
  b
}
{
  "type": "Function"
  "params": [ a ]
  "body": [ b ]
}

a(b,c)
{
  "type": "CallExpression"
  "callee": a
  "args": [ b , c ]
}
```

## License
MIT
