# KRL AST Specification

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
ruleset io.picolabs.hello {
}
{
  "type": "Ruleset",
  "rid": {
    "type": "RulesetID",
    "value": "io.picolabs.hello"
  },
  "meta": null,
  "global": [  ],
  "rules": [  ]
}

ruleset io.picolabs.hello {
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
  "rid": {
    "type": "RulesetID",
    "value": "io.picolabs.hello"
  },
  "meta": {
    "type": "RulesetMeta",
    "properties": [
      {
        "type": "RulesetMetaProperty",
        "key": {value: "name", type:"Keyword"},
        "value": {value: "Hello World", type:"String"}
      },
      {
        "type": "RulesetMetaProperty",
        "key": {value: "description", type:"Keyword"},
        "value": {
          "type": "Chevron",
          "value": [
            {value: "\nHello parser!\n", type:"String"}
          ]
        }
      }
    ]
  },
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
  "select": null,
  "foreach": [  ],
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
  "select": null,
  "foreach": [  ],
  "prelude": [  ],
  "action_block": null,
  "postlude": null
}

rule hello {
  select when DOMAIN TYPE

  pre {
    a = 1
  }

  choose COND {
    one =>
      action(1)
    two =>
      action(2)
  }

  fired {
    raise event "it:fired"
  }
}
{
  "type": "Rule",
  "name": {value: "hello", type:"Identifier"},
  "rule_state": "active",
  "select": {
    "type": "RuleSelect",
    "kind": "when",
    "event": {
      "type": "EventExpression",
      "event_domain": DOMAIN,
      "event_type": TYPE,
      "event_attrs": [  ],
      "setting": [  ],
      "where": null,
      "aggregator": null
    },
    "within": null
  },
  "foreach": [  ],
  "prelude": [
    {
      "type": "Declaration",
      "op": "=",
      "left": {value: "a", type:"Identifier"},
      "right": {value: 1, type:"Number"}
    }
  ],
  "action_block": {
    "type": "ActionBlock",
    "condition": null,
    "block_type": "choose",
    "discriminant": COND,
    "actions": [
      {
        "type": "Action",
        "label": {value: "one", type:"Identifier"},
        "action": {value: "action", type:"Identifier"},
        "args": {
          "type": "Arguments",
          "args": [
            {value: 1, type:"Number"}
          ]
        },
        "setting": [  ]
      },
      {
        "type": "Action",
        "label": {value: "two", type:"Identifier"},
        "action": {value: "action", type:"Identifier"},
        "args": {
          "type": "Arguments",
          "args": [
            {value: 2, type:"Number"}
          ]
        },
        "setting": [  ]
      }
    ]
  },
  "postlude": {
    "type": "RulePostlude",
    "fired": [
      {
        "type": "RaiseEventStatement",
        "event_attrs": null,
        "for_rid": null,
        "event_domainAndType": {value: "it:fired", type:"String"}
      }
    ],
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
  "event_attrs": [  ],
  "setting": [  ],
  "where": null,
  "aggregator": null
}

select when A B attr re#^(.*)$# setting(val)
{
  "type": "EventExpression",
  "event_domain": A,
  "event_type": B,
  "event_attrs": [
    {
      "type": "AttributeMatch",
      "key": {value: "attr", type:"Identifier"},
      "value": {value: /^(.*)$/, type:"RegExp"}
    }
  ],
  "setting": [
    {value: "val", type:"Identifier"}
  ],
  "where": null,
  "aggregator": null
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
      "event_attrs": [  ],
      "setting": [  ],
      "where": null,
      "aggregator": null
    },
    {
      "type": "EventExpression",
      "event_domain": B,
      "event_type": B,
      "event_attrs": [  ],
      "setting": [  ],
      "where": null,
      "aggregator": null
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
      "event_attrs": [  ],
      "setting": [  ],
      "where": null,
      "aggregator": null
    },
    {
      "type": "EventExpression",
      "event_domain": B,
      "event_type": B,
      "event_attrs": [  ],
      "setting": [  ],
      "where": null,
      "aggregator": null
    },
    {
      "type": "EventExpression",
      "event_domain": C,
      "event_type": C,
      "event_attrs": [  ],
      "setting": [  ],
      "where": null,
      "aggregator": null
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
  "type": "UnaryOperator",
  "op": "-",
  "arg": {value: 12.3, type:"Number"}
}

thing
{
  "type": "Identifier",
  "value": "thing"
}

ent:name
{
  "type": "DomainIdentifier",
  "domain": "ent",
  "value": "name"
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

<< This #{ x{"flip"} } that >>
{
  "type": "Chevron",
  "value": [
    {value: " This ", type:"String"},
    {
      "type": "MemberExpression",
      "object": {value: "x", type:"Identifier"},
      "method": "path",
      "property": {value: "flip", type:"String"}
    },
    {value: " that ", type:"String"}
  ]
}
```

#### Declaration

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
function(A, B = 3){
  C
}
{
  "type": "Function",
  "params": {
    "type": "Parameters",
    "params": [
      {
        "type": "Parameter",
        "id": A,
        "default": null
      },
      {
        "type": "Parameter",
        "id": B,
        "default": {value: 3, type:"Number"}
      }
    ]
  },
  "body": [  ],
  "return": C
}

A(B,C)
{
  "type": "Application",
  "callee": A,
  "args": {
    "type": "Arguments",
    "args": [ B , C ]
  }
}
```

#### Accessing data

```js
matrix[i][j]
{
  "type": "MemberExpression",
  "object": {
    "type": "MemberExpression",
    "object": {value: "matrix", type:"Identifier"},
    "method": "index",
    "property": {value: "i", type:"Identifier"}
  },
  "method": "index",
  "property": {value: "j", type:"Identifier"}
}

some_hash{["some", "path"]}
{
  "type": "MemberExpression",
  "object": {value: "some_hash", type:"Identifier"},
  "method": "path",
  "property": {
    "type": "Array",
    "value": [
      {value: "some", type:"String"},
      {value: "path", type:"String"}
    ]
  }
}
```
