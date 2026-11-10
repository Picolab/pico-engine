# Mutating Persistents in the Postlude

To be useful, persistent variables must be mutated. Persistents can only be mutated in the [postlude](/krl/rulesets/rules/postlude/).

The following statements mutate persistent variables:

- **`clear <pvar>`.** This deletes the persistent variable `<pvar>`.
- **`<pvar> := <expr>`**. This assigns the value of &lt;expr> to the persistent variable &lt;pvar>.

If the persistent variable is bound to a complex data structure (i.e. maps and arrays), `<pvar>` can contain a [hash path](/krl/krl-expression-language/literals/maps) referencing part of the structure (see example below).

### Example

```
always {
  ent:a := 1; 										// sets entity variable "a" to 1
  app:b{"foo"} := 1 + my_var.defaultsTo(0); 		// sets top-level key "foo" in the map inside of app variable "b"
  ent:b{["flip", "flop"]} := "this is a string"; 	// hash path into map inside of entity variable "b" (sets the value keyed to "flop" which is keyed to "flip")
  ent:c := null;									// sets entity variable to null
  clear ent:a										// clears the entity variable so it does not exist
}
```

---

<small>Ported from the [Pico Labs wiki](https://picolabs.atlassian.net/wiki/spaces/docs/pages/1189852) (last edited there 2019-07-08).</small>
