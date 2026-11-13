# Score tracker demo

One pico per contest. Contestants register, send points, and see a leaderboard. The app channel's policy lets them play without being able to change the pico.

- Overview: [`docs/cookbook/score_tracker/README.md`](../../docs/cookbook/score_tracker/README.md) (on the docs site: https://docs.picolabs.io/#/cookbook/score_tracker/)
- Instructions: [`docs/cookbook/score_tracker/instructions.md`](../../docs/cookbook/score_tracker/instructions.md)

| File | Shows |
|------|-------|
| `com.example.score_tracker.krl` | Registration and points rules, the `currentRanks` query, a leaderboard page, and a narrow app channel |
| `com.example.score_tracker.bootstrap.krl` | Sets up the demo on a new pico with three contestants; the **Try It!** tab runs it |
