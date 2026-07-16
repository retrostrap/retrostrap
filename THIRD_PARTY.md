# Third-party material

Nothing to declare, everything here is original.

Every pixel of art is drawn from a blank grid in `src/assets-src/` (reviewable as JSON,
rendered by our own pipeline). The framework ships zero font files: the nine sanctioned
type stacks are system fonts. The published framework package has no runtime
dependencies; the optional services in `services/` (the Boards, the MCP server, the write
Lambdas) declare theirs honestly in their own package files (hono, argon2, the AWS SDK,
the MCP SDK). Homages to the software of the era (the bevel theme, the DOS box, the
window chrome) are redrawn from scratch and named generically, no trademarked names or
artwork anywhere.

This file is empty by design, and we are quietly proud of that.
