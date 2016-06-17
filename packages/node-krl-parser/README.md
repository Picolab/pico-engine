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

The following examples omit the `loc` property for brevity.

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

ruleset hello {
  meta {
    name "Hello World"
    description <<
Hello parser!
>>
  }
  global {
    a = 1
  }
}
{
  "type": "Ruleset",
  "name": {value: "hello", type:"Identifier"},
  "meta": [
    {
      "type": "RulesetMetaProperty",
      "key": {value: "name", type:"Identifier"},
      "value": {value: "Hello World", type:"String"}
    },
    {
      "type": "RulesetMetaProperty",
      "key": {value: "description", type:"Identifier"},
      "value": {
        "type": "Chevron",
        "value": [
          {value: "\nHello parser!\n", type:"String"}
        ]
      }
    }
  ],
  "global": [
    {
      "type": "Declaration",
      "op": "=",
      "left": {value: "a", type:"Identifier"},
      "right": {value: 1, type:"Number"}
    }
  ],
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

rule NAME is inactive {
}
{
  "type": "Rule",
  "name": NAME,
  "rule_state": "inactive",
  "select_when": null,
  "prelude": [  ],
  "action_block": null,
  "postlude": null
}

rule hello {
  select when DOMAIN TYPE

  pre {
    a = 1
  }

  if COND then
    choose
      one =>
         action(1)
      two =>
         action(2)

  fired {
    FIRED
  }
}
{
  "type": "Rule",
  "name": {value: "hello", type:"Identifier"},
  "rule_state": "active",
  "select_when": {
    "type": "EventExpression",
    "event_domain": DOMAIN,
    "event_type": TYPE,
    "attributes": [  ],
    "where": null,
    "setting": [  ]
  },
  "prelude": [
    {
      "type": "Declaration",
      "op": "=",
      "left": {value: "a", type:"Identifier"},
      "right": {value: 1, type:"Number"}
    }
  ],
  "action_block": {
    "type": "RuleActionBlock",
    "condition": COND,
    "block_type": "choose",
    "actions": [
      {
        "type": "RuleAction",
        "label": {value: "one", type:"Identifier"},
        "callee": {value: "action", type:"Identifier"},
        "args": [
          {value: 1, type:"Number"}
        ],
        "with": [  ]
      },
      {
        "type": "RuleAction",
        "label": {value: "two", type:"Identifier"},
        "callee": {value: "action", type:"Identifier"},
        "args": [
          {value: 2, type:"Number"}
        ],
        "with": [  ]
      }
    ]
  },
  "postlude": {
    "type": "RulePostlude",
    "fired": [ FIRED ],
    "notfired": null,
    "always": null
  }
}
```

### EventExpression

```js
select when A B
{
  "type": "EventExpression",
  "event_domain": A,
  "event_type": B,
  "attributes": [  ],
  "where": null,
  "setting": [  ]
}

select when A B attr re#^(.*)$# setting(val)
{
  "type": "EventExpression",
  "event_domain": A,
  "event_type": B,
  "attributes": [
    {
      "type": "AttributeMatch",
      "key": {value: "attr", type:"Identifier"},
      "value": {value: /^(.*)$/, type:"RegExp"}
    }
  ],
  "where": null,
  "setting": [  ]
}

select when A A or B B
{
  "type": "EventOperator",
  "op": "or",
  "args": [
    {
      "type": "EventExpression",
      "event_domain": A,
      "event_type": A,
      "attributes": [  ],
      "where": null,
      "setting": [  ]
    },
    {
      "type": "EventExpression",
      "event_domain": B,
      "event_type": B,
      "attributes": [  ],
      "where": null,
      "setting": [  ]
    }
  ]
}

select when any 2 (A A, B B, C C)
{
  "type": "EventOperator",
  "op": "any",
  "args": [
    {value: 2, type:"Number"},
    {
      "type": "EventExpression",
      "event_domain": A,
      "event_type": A,
      "attributes": [  ],
      "where": null,
      "setting": [  ]
    },
    {
      "type": "EventExpression",
      "event_domain": B,
      "event_type": B,
      "attributes": [  ],
      "where": null,
      "setting": [  ]
    },
    {
      "type": "EventExpression",
      "event_domain": C,
      "event_type": C,
      "attributes": [  ],
      "where": null,
      "setting": [  ]
    }
  ]
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
  "type": "Map",
  "value": [
    {
      "type": "MapKeyValuePair",
      "key": {value: "one", type:"String"},
      "value": A
    }
  ]
}

<<
  hello #{name}!
  >>
{
  "type": "Chevron",
  "value": [
    {value: "\n  hello ", type:"String"},
    {value: "name", type:"Identifier"},
    {value: "!\n  ", type:"String"}
  ]
}
```

#### Assignment

```js
A = B
{
  "type": "Declaration",
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
  "type": "Application",
  "callee": A,
  "args": [ B , C ]
}
```

## License
MIT
