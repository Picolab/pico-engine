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

### Ruleset

```js
ruleset NAME {
}
{
  "type": "Ruleset",
  "name": NAME,
  "meta": [  ],
  "global": [  ],
  "rules": [  ]
}
```

### Rule

```js
rule NAME {
}
{
  "type": "Rule",
  "name": NAME,
  "rule_state": "active",
  "select_when": null,
  "prelude": [  ],
  "action_block": null,
  "postlude": null
}
```

### EventExpression

```js
select when A B
{
  "type": "Rule",
  "name": {
    "type": "Identifier",
    "value": "r0"
  },
  "rule_state": "active",
  "select_when": {
    "type": "EventExpression",
    "event_domain": A,
    "event_type": B,
    "attributes": [  ],
    "where": null,
    "setting": [  ]
  },
  "prelude": [  ],
  "action_block": null,
  "postlude": null
}
```

### KRL Expression language

#### Literals

```js
"hello world"
{
  "type": "String",
  "value": "hello world"
}

-12.3
{
  "type": "Number",
  "value": -12.3
}

thing
{
  "type": "Identifier",
  "value": "thing"
}

true
{
  "type": "Boolean",
  "value": true
}

re#^My name is (.*)#i
{
  "type": "RegExp",
  "value": /^My name is (.*)/i
}

[A, B, C]
{
  "type": "Array",
  "value": [ A , B , C ]
}

{"one": A}
{
  "type": "Object",
  "value": [
    {
      "type": "ObjectProperty",
      "key": {
        "type": "String",
        "value": "one"
      },
      "value": A
    }
  ]
}

<<
  hello #{name}!
  >>
{
  "type": "DoubleQuote",
  "value": [
    {
      "type": "String",
      "value": "\n  hello "
    },
    {
      "type": "Identifier",
      "value": "name"
    },
    {
      "type": "String",
      "value": "!\n  "
    }
  ]
}
```

#### Assignment

```js
A = B
{
  "type": "Assignment",
  "op": "=",
  "left": A,
  "right": B
}
```

#### Infix Operators

```js
A && B
{
  "type": "InfixOperator",
  "op": "&&",
  "left": A,
  "right": B
}

A + B + C
{
  "type": "InfixOperator",
  "op": "+",
  "left": {
    "type": "InfixOperator",
    "op": "+",
    "left": A,
    "right": B
  },
  "right": C
}

A + B * C
{
  "type": "InfixOperator",
  "op": "+",
  "left": A,
  "right": {
    "type": "InfixOperator",
    "op": "*",
    "left": B,
    "right": C
  }
}

A < B
{
  "type": "InfixOperator",
  "op": "<",
  "left": A,
  "right": B
}

A cmp B
{
  "type": "InfixOperator",
  "op": "cmp",
  "left": A,
  "right": B
}

A <=> B
{
  "type": "InfixOperator",
  "op": "<=>",
  "left": A,
  "right": B
}
```

#### Conditionals

```js
A => B | C
{
  "type": "ConditionalExpression",
  "test": A,
  "consequent": B,
  "alternate": C
}

A => B |
C => D |
     E
{
  "type": "ConditionalExpression",
  "test": A,
  "consequent": B,
  "alternate": {
    "type": "ConditionalExpression",
    "test": C,
    "consequent": D,
    "alternate": E
  }
}
```

#### Functions

```js
function(A){
  B
}
{
  "type": "Function",
  "params": [ A ],
  "body": [ B ]
}

A(B,C)
{
  "type": "CallExpression",
  "callee": A,
  "args": [ B , C ]
}
```

## License
MIT
