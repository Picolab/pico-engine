# Release reports

One report per minor release line, starting with 1.4, where the current run of work on the engine began after a three-year pause. Release notes ([`../release/`](../release/)) say what to do when upgrading; these reports say what a release added up to: its theme, the numbers, what changed in exposure or capability, what was verified, and what is still carried forward.

| Line | Window | Theme | Releases | Code (+/−) | Tests | Breaking |
|---|---|---|---|---|---|---|
| [1.10](1.10.md) | Nov 13 – Nov 17, 2026 | Secure remote access for agents | 2 | +7.5k / −1.0k | 438 → 484 | 5 |
| [1.9](1.9.md) | Oct 26 – Nov 13, 2026 | See what a pico just did; XMLUI views | 6 | +7.9k / −0.3k | 375 → 438 | 0 |
| [1.8](1.8.md) | Oct 10 – Oct 26, 2026 | Pico schemas, channel policy fix, MCP | 1 | +12.4k / −0.6k | 302 → 375 | 1 |
| [1.7](1.7.md) | Sep 15 – Oct 10, 2026 | Identity portability, pico move | 1 | +7.3k / −0.5k | 222 → 302 | 1 |
| [1.6](1.6.md) | Jul 16 – Sep 15, 2026 | did:webvh and DID-based relationships | 5 | +10.4k / −1.2k | 132 → 222 | 2 |
| [1.5](1.5.md) | Jun 19 – Jul 16, 2026 | Passkeys and OAuth | 3 | +7.1k / −0.2k | 97 → 132 | 2 |
| [1.4](1.4.md) | Jul 2023 – Jun 19, 2026 | Revival: stability fixes, PDS by default | 1 | +1.2k / −0.5k | 91 → 97 | 0 |

Across 1.4–1.10: tests went from 91 to 484, and 19 releases shipped in five months.

## Report shape

Each report has the same sections, so they can be read side by side:

1. **Headline figures**: releases, commits, code, tests, docs, breaking changes.
2. **Highlights** and **Why it matters**.
3. **A before → after table.** For security releases it's exposure by surface; for others it's whatever the release changed (identity, visibility).
4. **Upgrade** steps and **patch releases**.
5. **Verified vs. not verified.**
6. **Carried forward**: deferred items, with the release they were first deferred in, so stalled work stays visible.

## How the numbers are made

All figures come from git between the last tag of the previous line and the last tag of this one.

- **Commits** are `git rev-list --first-parent --count`. The pico-framework import in 1.10 brings in its own history back to 2019; first-parent keeps it out.
- **Code** is `git diff --shortstat` over `packages/`, excluding `packages/pico-framework`, `package-lock.json`, `packages/pico-engine/public` (built bundle), `**/node-compile-cache/**`, and `packages/pico-engine/test/logs/**`.
- **Tests** are counts of ava `test(` / `test.serial(` calls in `packages/` (excluding pico-framework) at each tag. They're a trend, not an exact test count.
- **Docs** is `git diff --shortstat` over `docs/`.
- Several releases landed most of their work in one commit, so per-feature line counts aren't possible from git alone.

## Repo housekeeping found while building these

| Item | Detail |
|---|---|
| Node compile cache committed | 372 files under `packages/*/node-compile-cache/`, added July 10, 2026 (`598870f5`). Removed from git; `node-compile-cache/` is gitignored. |
| Test logs committed | 884 files under `packages/pico-engine/test/logs/`, added during 1.6. The path was already in `.gitignore`. Removed from git. |
| CHANGELOG gaps | 1.8.0 and 1.9.0 are in the changelog. 1.4.0 is dated June 19, the tag date. |
| Untagged version | 1.8.1 was versioned in git (October 28) but never tagged or published. The changelog says so under that version. |
| No release-notes files | 1.4 and 1.5 have only CHANGELOG entries |
