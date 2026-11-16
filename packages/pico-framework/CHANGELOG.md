# Changelog

## 0.8.2 - October 23, 2026

* **Policy ceiling** — optional `policyCeiling` on each pico (`eventPolicy` / `queryPolicy` caps). Enforced on `newChannel` and `putChannel` for non-exempt tags; children inherit parent ceiling or receive a narrower ceiling via `NewPicoConfig.policyCeiling`.
* **`PicoFramework` options** — `defaultRootPolicyCeiling` for new roots; `globalEventDeny` / `globalQueryDeny` merged into every channel’s effective deny list.
* **Platform channel exemptions** — tags `system`, `engine`+`ui`, `didcomm`, `ingress`, and `discovery` skip ceiling checks (family channels unchanged).
* **Exports** — `PolicyCeiling`, `normalizePolicyCeiling`, `policyCeilingSubsetOf`, `channelPolicyWithinCeiling`, `isCeilingExemptChannelTags` from `policyCeiling.ts`.

## 0.8.1 - August 11, 2026

* **Custom channel id at creation** — optional `ChannelConfig.id` on `Pico.newChannel` for operator-chosen ECIs (validated: min 12 chars, `[a-zA-Z0-9_-]` only, engine-wide uniqueness including pico ids). Family/system channels still auto-generate ids.
* **`PicoFramework.eciIsTaken(eci)`** — engine-wide check for channel or pico id collision.
* **`validateCustomChannelId`**, **`CUSTOM_CHANNEL_ID_MIN_LENGTH`**, **`CUSTOM_CHANNEL_ID_PATTERN`** exported from `pico-framework`.

## 0.8.0

* Multi-root picos: `rootPicos()`, `createRootPico()`, `autoCreateRootPico` option.
* Channel policy denormalized per channel (`allowsEventPolicy`, `allowsQueryPolicy`).
