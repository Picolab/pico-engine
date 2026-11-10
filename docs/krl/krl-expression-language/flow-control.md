# Flow Control

logic control

Rules in KRL can be thought of as the body of an if statement, with the "select when" being the condition.

Rules are used to;

1. modify Picos states by setting entity variables and app variables.
2. raise and send events with updated attributes.

KRL rule structure;

- "Select when"
  - First control of logic, when this event assures do ....
- "pre block"
  - used to make calculations for the if then conditions
- "action block"
  - This block can include an if then statement.
  - if this condition is met do some combination of actions.
  - actions can include sending directives or events, things that have to happen as a result of this event.
- "post block"

  - This block can be, always, fired, notfired, else.
  - this is where you set entity variables

-switch

-defaults

-||, ->

-guards

---

<small>Ported from the [Pico Labs wiki](https://picolabs.atlassian.net/wiki/spaces/docs/pages/1190192) (last edited there 2017-07-17).</small>
