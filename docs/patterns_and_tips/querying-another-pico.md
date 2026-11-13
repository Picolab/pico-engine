# Querying another pico

To call a function another pico's ruleset shares, use `wrangler:picoQuery`. Two things are needed: a channel to the other pico whose query policy allows that function, and `io.picolabs.wrangler` as a module.

```krl
meta {
  use module io.picolabs.wrangler alias wrangler
}
```

```krl
rule ask_the_other_pico {
  select when example question_asked
  pre {
    answer = wrangler:picoQuery(other_eci, "my.ruleset.id", "myFunction", {"arg1": "a", "arg2": "b"})
  }
  if answer{"error"}.isnull() then noop()
  fired {
    ent:last_answer := answer
  }
}
```

On the same engine, `picoQuery` calls the other pico directly. On another engine, or for a `did:` identifier, it goes over HTTP or DIDComm. Either way it returns the function's value, or a map with an `error` key if something went wrong.

## Which channel

- **Your children.** `wrangler:children()` gives each child's family channel (`eci`). `picoQuery` can use it, because the parent owns it.
- **Picos you have a relationship with.** Use the relationship: `subscription:queryOnSub(Id, rid, name, args)` (see the [Two picos talking](/cookbook/two_picos/) demo), or `picoQuery` on the relationship's `Tx` channel.
- **Anyone else.** A channel they give you, made for the purpose, with a policy that allows the functions you need.

## Don't query yourself

A pico handles one thing at a time. A query from a pico to itself would wait behind the work that's making it. `picoQuery` refuses: it returns `{"status_code": 400, ...}` with the error "Pico should not query itself". To use a function in another ruleset on the same pico, use that ruleset as a module instead.

## With `http:get`

A pico has a URL, so `http:get` works too:

```krl
response = http:get(meta:host + "/sky/cloud/" + other_eci + "/my.ruleset.id/myFunction", {"arg1": "a"})
answer = response{"content"}.decode()
```

It's slower than `picoQuery` on the same engine, and it can't use family channels: the answer is an error, "This is a family channel and only the owner can use it". The HTTP status is still 200 in that case, so check the content for `error`, not just `status_code`.

*From the Pico Labs KRL Cookbook page "Accessing a Function Shared by Another Pico".*
