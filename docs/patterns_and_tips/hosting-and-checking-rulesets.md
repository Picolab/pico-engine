# Hosting and checking rulesets

## Install from a URL

The engine installs a ruleset from a URL and remembers it. A few kinds work well:

- **Your own files**, while you work: `file:///path/to/my.ruleset.krl`. The engine must be on the same machine.
- **GitHub**: use the *raw* URL, `https://raw.githubusercontent.com/<owner>/<repo>/<branch>/<path>.krl`, not the page that displays the file.
- **The engine's own**: `http://<engine>/krl/<rid>.krl` for the rulesets that ship with it, and `/krl/demos/...` for the demos.

## Flush after you change it

The engine compiles a ruleset once and keeps it. After you change the source, click **Flush** next to the ruleset on the pico's **Rulesets** tab, and the engine fetches the URL again. Every pico with that ruleset gets the new version.

Flushing doesn't raise `wrangler:ruleset_installed` again, so rules that run on install don't run. If you change what such a rule sets up, such as a channel's policy, run that rule again yourself. The [Bootstrap and channels](/cookbook/bootstrap/) demo shows how.

## Check before you commit

`krl-check` parses and compiles KRL, and lints doc comments and views. It ships with `krl-compiler`:

```sh
npm install -g krl-compiler
krl-check my.ruleset.krl
```

It exits with status 1 on an error and prints warnings to stderr. With no file, it reads standard input. That makes a Git pre-commit hook that checks exactly what you're about to commit. Save this as `.git/hooks/pre-commit` and make it executable:

```sh
#!/bin/sh
status=0
for f in $(git diff --cached --name-only --diff-filter=ACM -- '*.krl'); do
  if ! git show ":$f" | krl-check >/dev/null; then
    echo "krl-check failed: $f"
    status=1
  fi
done
exit $status
```

`git show ":$f"` is the staged version of the file, so a fix you haven't staged yet doesn't hide an error.

*From the Pico Labs KRL Cookbook pages "Hosting Code on GitHub" and "Setting Up a Git Pre-Commit Hook to Parse KRL".*
