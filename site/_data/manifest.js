// Global data: the generated component catalog. dist/ is the source of truth,
// run `npm run build` first if this file is missing.
import { readFileSync } from "node:fs";

const manifest = JSON.parse(
  readFileSync(new URL("../../dist/manifest.json", import.meta.url), "utf8")
);

export default manifest;
