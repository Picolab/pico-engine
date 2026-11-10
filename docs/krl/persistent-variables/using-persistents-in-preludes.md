# Using Persistents in Preludes

Persistent variables can be used inside prelude expressions like any other variable.

Persistent variables cannot appear on the left-hand side of a declaration in the prelude.

### Examples

The following declaration would add 3 to the value stored in the entity counter `ent:fizz`, storing the result in `x`:

```javascript
pre {
  x = ent:fizz + 3
}
```

---

<small>Ported from the [Pico Labs wiki](https://picolabs.atlassian.net/wiki/spaces/docs/pages/1189854) (last edited there 2017-05-30).</small>
