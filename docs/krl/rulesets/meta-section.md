# Meta Section

The `meta` section stores information about a ruleset. Meta sections are optional and may be empty.

The following are allowed in a `meta` section:

- `name` - a string giving a human readable name for the ruleset.
- `author` - a string giving the name of the author of the ruleset.
- `description` - a string (specified in standard or extended quotes) that describes the ruleset's purpose.
- `version` - rulesets are versioned. Version strings follow [Semantic Versioning](https://semver.org/). i.e `1.2.3` where `<major>.<minor>.<patch>`. During development you can set the version to `"draft"` or omit it completely. This way you can make frequent changes and see them reflected immediately on the picos that use the "draft" version.
- `use` - use another ruleset as a [module](/krl/user-defined-modules)
- `configure` - declare the default configuration for this ruleset when used as a [module](/krl/user-defined-modules).
- `provides` - declare the values this ruleset provides when used as a [module](/krl/user-defined-modules).
- `shares` - a list of names available to Sky queries (`/sky/query`)

Some of these have more detailed documentation available:

- [User Defined Modules](/krl/user-defined-modules)
- [Meta Information Library](/krl/libraries/meta)

---

<small>Ported from the [Pico Labs wiki](https://picolabs.atlassian.net/wiki/spaces/docs/pages/1189908) (last edited there 2021-01-28).</small>
