# Compound Actions

A rule can take more than one action using a compound action.

## Every

The most frequently used kind of compound action is the `every` compound action. The `every` compound action takes every action listed in order. The actions are listed inside curly braces with semicolon separators:

```javascript
if x > 5 then
  every {
    send_directive("Hello World!" + "This is my first message!");
    send_directive("Hello Again!" + "This is my second message!");
  }
```

This would send two directives from a single rule.

There is no limit to the number of actions that can be placed inside a compound action. While there is no linguistic restriction on mixing actions that send JavaScript and those that send directives, no current event generator understands both directives and JavaScript, so that is not typically done.

## Sample

Another kind of compound action is the `sample` compound action. A `sample` action takes a list of actions like `every`, but instead of executing them all, it randomly picks one to execute. So, for example, the following would either send "This is one message!" or "This is another message!" randomly. The key reason for taking random action is to easily accommodate A/B behavior testing.

```javascript
if x > 5 then
  sample {
    send_directive("Hello World!" + "This is one message!");
    send_directive("Hello World!" + "This is another message!");
  }
```

## Choose

The last kind of compound action can be used to choose a specific action, like a case statement:

```javascript
pre {
    some_var = "A"
}

choose some_var {
    A => send_directive("Hello World!" + "This is one message!");
    B => send_directive("Hello World!" + "This is another message!");
}
```

Notice that a binding, `some_var`, has been inserted after `choose`. An identifier or any valid KRL expression enclosed in parentheses can follow `choose`. The expression will be evaluated and its value will be compared to the action labels (`A` or `B`) in the action list, and the actions associated with labels that match exactly will be taken. Action labels are [identifiers](/krl/krl-expression-language/identifiers) for specific actions. If the value does not match any label, then no action is taken--as if the action statement were missing. Even though no action is taken, the rule will be considered to have fired.

---

<small>Ported from the [Pico Labs wiki](https://picolabs.atlassian.net/wiki/spaces/docs/pages/1189833) (last edited there 2020-12-28).</small>
