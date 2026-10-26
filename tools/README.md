# Tools

Developer utilities for the pico-engine monorepo. These are **not** published npm packages; they live here so schema work, agent workflows, and local scripts can share the same compiler as the engine.

## Setup

From the **repo root**:

```bash
npm run setup          # link krl-parser, krl-compiler, krl-generator, …
cd tools/krl-schema && npm install   # once: minimist for the CLI
```

The schema tool loads `packages/krl-compiler` from the tree (plain `src/` JS; no separate compile step). After parser or stdlib TypeScript changes, run `npm run build` from the repo root.

---

## krl-schema

Print **ruleset discovery schema** as JSON for a `.krl` file — doc annotations plus compiler-derived `select`, `condition`, `entry`, `attrs`, `emits`, `prechecks`, and `alsoSelectedBy`.

Design: [`docs/design/pico-schemas.md`](../docs/design/pico-schemas.md)

### Install / invoke

| How | When |
|-----|------|
| `npm run krl-schema -- <file>` | Quick run from repo root |
| `npm run -s krl-schema -- …` | **Piping to `jq`** (see below) |
| `node tools/krl-schema/cli.js …` | Scripts and CI (cleanest stdout) |
| `node tools/krl-schema/cli.js -h` | Help |

Root `package.json` defines `"krl-schema": "node tools/krl-schema/cli.js"`.

### Options

| Flag | Meaning |
|------|---------|
| `-q`, `--quiet` | Compiler warnings on **stderr** only (stdout stays pure JSON) |
| `-o`, `--output <path>` | Write output to a file instead of stdout |
| `-f`, `--format <fmt>` | `json` (default) or `markdown`: a human-readable reference page (see below) |
| `-h`, `--help` | Usage |

### What appears in the JSON

- **`operations`** — rules with a `/** … */` comment **immediately before** the rule.
- **`queries`** — `meta.shares` functions that have a doc comment.
- Unannotated rules/functions are **omitted** (opt-in discovery).

Field cheat sheet:

| Field | Meaning |
|-------|---------|
| `version` | Schema **document** format (always `1` today) |
| `rid` | Ruleset id |
| `rid_version` | `meta { version "…" }` or legacy top-level version; default **`draft`** if omitted |
| `description` | `meta.description` (chevron `<< … >>` strings are unwrapped to plain text) |

### Stdout vs stderr

- **Stdout** — JSON only (when compile succeeds and there is at least one annotated rule or share).
- **Stderr** — compiler warnings (e.g. deprecated `ruleset{version}`); redirect `2>/dev/null` when piping if you want quiet output.

Exit code **1** if the file does not compile, or if there is **no** annotated surface (empty schema).

### Examples

**Pretty-print full schema to a file** (Manifold ruleset in a sibling repo):

```bash
node tools/krl-schema/cli.js -q -o /tmp/manifold-schema.json \
  ../manifold-api/tmp/io.picolabs.manifold_pico.krl
```

**Inspect one annotated operation** (recommended: `node` + `jq`):

```bash
node tools/krl-schema/cli.js -q \
  ../manifold-api/tmp/io.picolabs.manifold_pico.krl 2>/dev/null \
  | jq '.operations[] | select(.rule == "createThing") | {description, prechecks, emits, attrs}'
```

**Count discoverable queries and operations**:

```bash
node tools/krl-schema/cli.js -q path/to/ruleset.krl 2>/dev/null \
  | jq '{rid, rid_version, queries: (.queries | length), operations: (.operations | length)}'
```

**List shared query names and return types**:

```bash
node tools/krl-schema/cli.js -q path/to/ruleset.krl 2>/dev/null \
  | jq '.queries[] | {name, returns, args: [.args[]?.name]}'
```

**Wrangler in-tree**:

```bash
node tools/krl-schema/cli.js -q packages/pico-engine/krl/io.picolabs.wrangler.krl 2>/dev/null | jq '.rid'
```

### Piping through `jq` and `npm run`

Plain `npm run krl-schema` prints **npm lifecycle lines on stdout** (`> krl-schema`, `> node …`), which breaks `jq`:

```text
parse error: Invalid numeric literal at line 2, column 2
```

Use either:

```bash
# silent npm
npm run -s krl-schema -- -q path/to/ruleset.krl 2>/dev/null | jq '.rid'

# or node (preferred for pipes)
node tools/krl-schema/cli.js -q path/to/ruleset.krl 2>/dev/null | jq '.rid'
```

### Related

- Compile to JavaScript: `krl-compiler < file.krl` (package bin; stdin/stdout).
- Same schema is embedded at compile time as `__rulesetSchema1` when annotations exist (engine integration is separate; see 1.8 plan).

---

## Adding tools

New CLIs should live in `tools/<name>/`, depend on monorepo packages via relative `require`, and get a one-line script in the root `package.json` when useful. Document flags, stdout/stderr behavior, and `jq`/pipe examples here.

### Markdown reference pages

`--format markdown` renders the same schema as a reference page: the ruleset description, then each annotated operation (the events to send, an attribute table, the condition it acts under, what it may emit) and each annotated query (signature, parameter table, how to call it). Prose comes only from the `/** */` annotations; select expressions and conditions are shown as code, never paraphrased.

```bash
node tools/krl-schema/cli.js -q -f markdown -o wrangler.md packages/pico-engine/krl/io.picolabs.wrangler.krl
```

Samples: [`krl-schema/samples/`](krl-schema/samples/).

