# Migrations

A machine-readable record of every renamed or removed class and every changed JS
contract, designed so tooling, including anything reading `llms.txt`: can apply it
mechanically. One row per change. `old`/`new` are exact strings; `autofix` is a regex
only where one is genuinely safe.

During `0.x`, minor releases may still break; each break lands here with a deprecation
first wherever possible. From `1.0.0`, this table is the compatibility promise.

| since | kind    | area | old | new | autofix (regex) |
|-------|---------|------|-----|-----|-----------------|
| -     | -       | -    | Nothing has moved yet. | | |

Legend: `kind` ∈ `rename · remove · contract · default-change`. A `contract` change means
the required markup or attributes changed; a `default-change` means a JS default value
changed.
