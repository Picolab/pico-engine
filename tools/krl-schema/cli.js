#!/usr/bin/env node

/**
 * Print ruleset discovery schema JSON for a .krl file (compile-time; annotated rules + shares only).
 * @see docs/design/pico-schemas.md
 */

const fs = require('fs')
const path = require('path')
const minimist = require('minimist')

const schemaFromSource = require('../../packages/krl-compiler/src/schemaFromSource')
const { renderMarkdown } = require('./markdown')

const USAGE = `Usage: krl-schema [options] <file.krl>

Print ruleset schema JSON for a KRL ruleset file. Only /** … */ annotated rules and
meta.shares functions appear in the output (see docs/design/pico-schemas.md).

Options:
  -o, --output <path>   Write output to a file instead of stdout
  -f, --format <fmt>    json (default) or markdown: a human-readable reference page
  -q, --quiet           Suppress compiler warnings on stderr
  -h, --help            Show this help

Examples:
  node tools/krl-schema/cli.js path/to/io.picolabs.manifold_pico.krl
  npm run krl-schema -- packages/pico-engine/krl/io.picolabs.wrangler.krl
  npm run -s krl-schema -- -q path/to/ruleset.krl 2>/dev/null | jq '.rid'
  node tools/krl-schema/cli.js -q -f markdown -o wrangler.md packages/pico-engine/krl/io.picolabs.wrangler.krl
`

function main () {
  const argv = minimist(process.argv.slice(2), {
    alias: { o: 'output', q: 'quiet', h: 'help', f: 'format' },
    boolean: ['quiet', 'help'],
    string: ['output', 'format'],
    default: { format: 'json' }
  })

  if (argv.help) {
    process.stdout.write(USAGE)
    process.exit(0)
  }

  const file = argv._[0]
  if (!file) {
    process.stderr.write('Error: missing path to a .krl file\n\n')
    process.stderr.write(USAGE)
    process.exit(1)
  }

  const abs = path.resolve(file)
  let src
  try {
    src = fs.readFileSync(abs, 'utf8').replace(/\r\n?/g, '\n')
  } catch (err) {
    process.stderr.write(err.message + '\n')
    process.exit(1)
  }

  let out
  try {
    out = schemaFromSource(src, { filepath: abs })
  } catch (err) {
    process.stderr.write(String(err) + '\n')
    if (err && err.where && err.where.excerpt) {
      process.stderr.write(err.where.excerpt + '\n')
    }
    process.exit(1)
  }

  if (!out.rulesetSchema) {
    process.stderr.write(
      'No ruleset schema: no /** */ annotations on rules or shared functions.\n'
    )
    process.exit(1)
  }

  if (!argv.quiet && out.warnings && out.warnings.length) {
    for (const w of out.warnings) {
      const l = w.loc && w.loc.start && w.loc.start.line
      const c = w.loc && w.loc.start && w.loc.start.column
      process.stderr.write(w.message + (l != null ? ' ' + l + ':' + c : '') + '\n')
    }
  }

  let text
  if (argv.format === 'markdown' || argv.format === 'md') {
    text = renderMarkdown(out.rulesetSchema)
  } else if (argv.format === 'json') {
    text = JSON.stringify(out.rulesetSchema, null, 2) + '\n'
  } else {
    process.stderr.write('Error: unknown --format ' + argv.format + ' (json or markdown)\n')
    process.exit(1)
  }
  if (argv.output) {
    fs.writeFileSync(path.resolve(argv.output), text, 'utf8')
  } else {
    process.stdout.write(text)
  }
}

main()
