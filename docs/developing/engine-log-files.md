# Reading the engine's log files

The **Logging** tab shows recent events and queries for a pico, from the engine's memory. To look further back, or across every pico, read the log files.

## Where they are

The engine writes one JSON object per line to `pico-engine.log` in its home directory (`PICO_ENGINE_HOME`, `~/.pico-engine` by default). When the file reaches 100 MB it rotates: the older entries move to `pico-engine.log.1`, `pico-engine.log.2`, and so on, and the engine keeps up to twelve files. `PICO_ENGINE_LOG_FILE` writes somewhere else instead (`stdout` to write to standard output). See [the operator guide](/pico-engine) for the settings.

Each line has `level`, `time`, and `msg`, and lines about a pico's work have `picoId` and `txnId`. A transaction is one event or query and everything it caused.

```json
{"level":50,"time":"2026-11-13T18:46:16.317Z","picoId":"cmwfbv2y1001e4jysd0cn9w05","txnId":"cmwfbvcvx00244jysd16w7grz","txnKind":"query","error":"This is a family channel and only the owner can use it.","msg":"..."}
```

## One pico's history

Find the pico's id on its **About** tab, then:

```sh
cd ~/.pico-engine
grep -h '"picoId":"<pico id>"' pico-engine.log* | jq -s -c 'sort_by(.time)[]' > my_pico.log
```

`grep` collects the lines from every file, and [`jq`](https://jqlang.org/) sorts them by time, since rotated files aren't in order relative to each other. To follow one event through everything it caused, filter on its `txnId` instead.

## What to look for

- `"msg":"txnQueued"` lines show each event or query as it arrived, with its attributes.
- `"error"` fields show what failed: a channel policy refusal, a KRL runtime error, a family channel used from outside.
- `klog` output from your own rules is in the log, with the message you gave it.

The logs hold every event's attributes. Anything secret that arrives in an event is in them. See the [Configuration and secrets](/cookbook/secrets/) demo.

*From the Pico Labs KRL Cookbook page "Examining pico-engine log files". The log format and rotation have changed since that page was written.*
