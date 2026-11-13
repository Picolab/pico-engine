# Two picos talking demo

Two picos, Alice and Bob, form a relationship. Bob asks Alice questions by querying her over it.

- Overview: [`docs/cookbook/two_picos/README.md`](../../docs/cookbook/two_picos/README.md) (on the docs site: https://docs.picolabs.io/#/cookbook/two_picos/)
- Instructions: [`docs/cookbook/two_picos/instructions.md`](../../docs/cookbook/two_picos/instructions.md)

| File | Shows |
|------|-------|
| `com.example.two_picos.answerer.krl` | Alice: shares `answer(question)`, accepts relationship requests from askers, and has a page to teach her facts |
| `com.example.two_picos.asker.krl` | Bob: asks for a relationship with Alice, asks her questions with `subscription:queryOnSub`, and keeps the conversation |
| `com.example.two_picos.bootstrap.krl` | Creates Alice and Bob as children of a new pico and introduces them; the **Try It!** tab runs it |
