# Grammar

This page uses [BNF notation](https://en.wikipedia.org/wiki/Backus%E2%80%93Naur_form). Non-terminal names are enclosed in angle brackets. Meta symbols are `::=` indicating the definition, square brackets indicating that what is within is optional, and the vertical bar indicating options or possible definitions of the non-terminal to the left of `::=`. Uppercase non-terminal names indicate something that is not yet defined, or which is left undefined, or defined by hand-waving and/or verbiage. The grammar is presented in pieces, hierarchically, with each piece as self-contained as possible, and further refined in subsequent sections.

The grammar used in the node pico engine can be perused at [https://github.com/Picolab/pico-engine/tree/master/packages/krl-parser](https://github.com/Picolab/pico-engine/blob/master/packages/krl-parser/src/grammar.ne), and is authoritative where it differs from the presentation here.

This page concentrates on the syntax of KRL, with numerous links to other pages which give examples and/or discuss run-time behavior.

# Ruleset

In KRL, the ruleset is the unit of compilation, and also the smallest piece of functionality that can be installed in a pico.

```
<ruleset>      ::= ruleset <RID> { [<meta block>] [<global block>] [<rules>] }
<meta block>   ::= meta { [<meta entries>] }
<meta entries> ::= <META ENTRY> | <meta entries> <META ENTRY>
<global block> ::= global { [<bindings>] }
<bindings>     ::= <binding> | <bindings> ; <binding> [;]
<binding>      ::= <ID> = <EXPR>
<rules>        ::= <rule> | <rules> <rule>
```

## Ruleset identifier (RID)

Rulesets are identified by RID, and must be unique within each pico engine. A RID, like an identifier, can be made up of alphanumeric characters and the underscore character, but in addition can contain periods and dashes. We recommend using the Java convention of reversing the name of a domain that you control, followed by a name that is unique within your organization. For example, we use the RID `io.picolabs.wrangler` for one of our internal rulesets. Anyone in the world following this convention will never choose a RID that exactly matches this one. Someone at IBM, for example, might want to define a "wrangler" ruleset, but they would name it `com.ibm.wrangler`. Thus the convention makes globally unique RID choice easier.

## Meta block

This block is optional, but is generally present. The `meta` block is described informally in the [Meta Section](/krl/rulesets/meta-section) page.

## Global block

This block is optional, but is generally present. The `global` block is a sequence of expressions which are evaluated as the ruleset is installed into a pico. The value of each expression is then bound to a name (the identifier on the left hand side of the equal sign). Names defined in the global block are in scope from their point of definition throughout the ruleset. There is no syntax (nor is there run-time support) for modification of the value bound to these names. This is similar to [final in Java](https://en.wikipedia.org/wiki/Final_(Java)).

Besides use in the remainder of this ruleset, names can be shared with the outside world (by being named in the meta block `shares` entry). Names can also be provided to another ruleset which is using this ruleset as a [module](/krl/user-defined-modules) (by being named in the meta block `provides` entry).

# Rules

Finally a ruleset may contain a sequence of rule definitions. Each rule definition follows this grammar:

```
<rule>         ::= rule <ID> {
                    select when <eventex> [within <time expr>]
                    [foreach <EXPR> setting(<ID>[,<ID>])]
                    [pre { [<bindings>] }]
                    [[if <BOOL EXPR> then ]<action>]
                    [<postlude>]
                  }
<time expr>   ::= <POS INT> <period>
<period>      ::= seconds | minutes | hours | days |weeks
```

A rule is identified by a simple identifier, which must be unique within the ruleset, and whose only use is to refer to the rule within the pico engine log files.

Each rule may react to incoming events. Which rules *actually* do is determined by the rule selector, which consists of an [event expression](/krl/event-expressions/) (either simple or complex), subject to an optional time limit for all of the needed events to come in. The syntax of event expressions is described later on.

Notice that a rule follows a definite sequence of evaluation. Assuming a rule is selected for evaluation, within each ruleset the evaluation will occur in the order in which rules are defined within the ruleset. Different rulesets may contain rules which are selected for an event. The order of evaluation within each ruleset is guaranteed, but it is not defined across different rulesets.

## Looping

If a `foreach` is present, it will apply to the remainder of the rule, which will be evaluated once per item in the map or array computed by the `<EXPR>`. Each time through the loop, the first identifier in the `setting` clause will have a value from the map or array, and the second identifier (if named) will have the corresponding key or index value.

## Prelude

If a [prelude](/krl/rulesets/rules/prelude/) is present, it binds names to computed values. These names are in scope from where they are bound for the remainder of the rule.

## Conditional action

The [action](/krl/rulesets/rules/actions/) is the heart of a rule. An action has effects on things *outside* of the pico: other picos on this engine, other picos on other engines, other systems, and whatever system sent the original event.

An [action may be conditional](/krl/rulesets/rules/rules-are-simply-conditional-actions) on the result of a Boolean expression. For the (fairly common) case where we want a condition but have no action in mind, there is a special `noop()` action.

When the rule has a condition, and when the Boolean expression evaluates to `true` (or a truthy value), the rule is said to have *fired*. If there is no condition mentioned, the rule will also be said to have fired.

## Postlude

The [postlude](/krl/rulesets/rules/postlude/) is where effects *inside* this same pico are specified.

# Event expression

An [event expression](/krl/event-expressions/) is a declarative way of expressing *when* the developer wishes the rule to be selected for evaluation.

```
<eventex>     ::= <ID 1> [:] <ID 2> [ <matches> [ setting( <id list> ) ] ] [where <BOOL EXPR>]
                | ( <eventex> )
                | <eventex> <eventop> <eventex>
                | <eventop> ( <eventexes> )
                | <eventex> [not] between ( <eventex> , <eventex> )
                | any <POS INT> ( <eventexes> )
                | <groupop> <POS INT> ( <eventex> ) [ <aggregateop>(<ID>) ]
<matches>     ::= <match> | <matches> <match>
<match>       ::= <ID> <REGEXP>
<id list>     ::= <ID> | <id list> , <ID>
<eventop>     ::= or | and | before | then | after
<eventexes>   ::= <eventex> | <eventexes> , <eventex>
<groupop>     ::= count | repeat
<aggregateop> ::= max | min | sum | avg | push
```

The simplest form is simply two identifers, the event domain &lt;ID 1> and the event type &lt;ID 2>. Event *attributes* can be matched against [regular expressions](/krl/krl-expression-language/literals/regular-expressions). All of the matches must succeed for the rule to be selected for evaluation. Portions of each attribute thus matched can be captured and named using the `setting` clause. The number of identifiers given should match the total number of captures in all of the regular expressions for the simple event expression. If fewer are given, extra capture groups will *not* be retained. If more are given, the extra names will be bound to the `null` value.

A simple event expression can also use an escape into imperative programming, through the use of the optional `where` clause which will evaluate a Boolean expression.

# Actions

The action taken by a rule is something which affects the world outside of the pico in which the rule is being evaluated. [Actions](/krl/rulesets/rules/actions/) can be [simple](/krl/rulesets/rules/actions/taking-action/) or [compound](/krl/rulesets/rules/actions/compound-actions). The grammar is:

```
<action>          ::= <simple action> | <compound action>
<compound action> ::= every { <action list> }
                    | choose <ID> { <choice list> }
                    | choose ( <STRING EXPR> ) { <choice list> }
                    | sample { <choice list> }
<actions list>    ::= <action> | <action list> ; <action> [;]
<choice list>     ::= <choice> | <choice list> ; <choice> [;]
<choice>          ::= <ID> => <action>
<simple action>   ::= noop()
                    | <SEND DIRECTIVE>
                    | <HTTP POST>
                    | <DEFINED ACTION>
                    | <BUILT-IN ACTION>
```

## `every` compound action

The actions in the action list will be taken in the order specified in the list.

## `choose` compound action

The expression in the choose compound action must evaluate to a string which follows the rules for a KRL identifier. The id in a choice is given as a bare word, and the choices are considered in the order in which they appear in the choice list. The first choice for which the id equals the string computed by the expression has its action taken and the choose compound action is complete. No further choices will be considered.

## `sample` compound action

One of the actions will be chosen at random. See also the [Compound Actions](/krl/rulesets/rules/actions/compound-actions) page.

## `noop()` action

The grammar for the conditional action portion of a rule (repeated here for convenience>

```
[[if <BOOL EXPR> then ]<action>]
```

allows, in the syntax, three of the four possibilities that a KRL programmer might need: (0) *neither condition nor action*, (1) *unconditional action*, and (3) *conditional action*. But the syntax itself has no way of allowing (2) *conditional but no action*. The programmer can use the simple action `noop()` when this fourth possibility is needed.

The rule is considered to have "fired" if and only if the condition is missing (cases 0 and 1) *or* the condition expression evaluates to true (in cases 2 and 3).

# Grammar for postlude

While the action has effects on things *outside* of the pico, the postlude can change the state of the pico or select additional rules for the event evaluation currently in progress (see the [Event Loop Introduction](/developing/event-loop) for more information).

## Overall structure of postlude

The postlude, if present in a rule, comes in one of three forms. The choice is based on whichever provides the clearest and easiest-to-understand code.

```
<postlude>           ::= <postlude form> [ finally { <postlude item list> } ]
<postlude form>      ::= fired { <postlude item list> } [ else { <postlude item list> } ]
                       | notfired { <postlude item list> } [ else { <postlude item list> } ]
                       | always { <postlude item list> }
<postlude item list> ::= <postlude item> | <postlude item list> ; <postlude item> [;]
```

The postlude specifies internal effects on the pico. These can be conditional, based on the conditional action, i.e. whether or not the rule is said to have "fired". The KRL developer can choose *one* of the `fired` (line 2), `notfired` (line 3), or `always` (line 4) postlude forms. In any case, the developer can also indicate postlude items to be executed *after* the conditional postlude form, by using a `finally` block.

When the rule "fires" postlude items in the `fired` clause will be executed. So also will postlude items in the `else` clause for the `notfired` clause. Conversely, when the rule doesn't "fire", the postlude items in the `notfired` clause will be executed as will postlude items in the `else` clause of the `fired` clause. Regardless of whether the rule "fires" any postlude items in the `always` clause will be executed.

After the chosen postlude form has executed, if there is a `finally` clause, postlude items in it will be executed.

## Postlude items

A postlude item is either an assignment to an entity variable, or effects on the schedule of rules involved in this event execution. Raised events result in additional rules being added to the end of the schedule of rules to be evaluated for the event. The special keyword `last` aborts the schedule of rules and the event execution finishes without evaluating any rules which might remain on the schedule.

```
<postlude item>          ::= <postlude operation> [ <guard> ]
<guard>                  ::= if <BOOL EXPR>
                           | on final
<postlude operation>     ::= <postlude assignment>
                           | <postlude raise event>
                           | <binding>
<postlude assignment>    ::= ent:<ID> := <EXPR>
                           | clear ent:<ID>
<postlude raise event>   ::= raise <postlude event spec> [ for <STRING EXPR> ] [ attributes <MAP EXPR> ]
                           | last
<postlude event spec>    ::= <ID> event <STRING EXPR>
                           | event <STRING EXPR>
```

For more information about ~~conditional~~ guarded postlude items, see the [Guard Conditions](/krl/rulesets/rules/postlude/guard-conditions) page. Guards either check for a Boolean expression (line 2) or for the very last iteration of a `foreach` loop (line 3).

### Entity variable assignment

A pico is provided with entity variables by its installed rulesets. Entity variables can be assigned values *only* inside of rule postludes. An entity variable can be assigned a value (computed by an expression), or it can be cleared (line 7).

When an entity variable is mentioned in an expression (which can happen anywhere an expression can appear in a ruleset), and it does not exist in the pico/ruleset then the value is `null`.

### Raised events

As with all events, raised events are identified by a pair of identifiers for its "domain" and "type". These are specified in one of two ways.

In the first version of the syntax (line 10), the domain is given as a bare word between the keywords `raise` and `event`, and the type is usually a String constant (but can be computed by an expression computing a String which is a valid identifier.)

In the second (and newer) version of the syntax (line 11), the event is identified by a String expression which consists of a valid identifier for the domain followed by a colon followed by a valid identifier for the type.

In both cases, the selecting of rules to be added to the schedule can be limited to a single ruleset by including the `for` clause followed by a String expression which computes a valid ruleset identifier. When the `for` clause is absent, the rules in all rulesets installed in the pico will be considered.

Finally attributes for the raised event are given by a Map after the keyword `attributes`. If these are not given, the compiler will provide an empty Map.

---

<small>Ported from the [Pico Labs wiki](https://picolabs.atlassian.net/wiki/spaces/docs/pages/223117313) (last edited there 2020-11-30).</small>
