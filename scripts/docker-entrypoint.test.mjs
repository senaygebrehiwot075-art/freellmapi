import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { test } from "node:test";
import assert from "node:assert/strict";

const source = readFileSync(new URL("../docker-entrypoint.sh", import.meta.url), "utf8");
test("entrypoint shell syntax", () => {
  const result = spawnSync("sh", ["-n"], { input: source, encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
});

test("ensure_owned refuses filesystem root and working directory, but permits a specific data path", () => {
  const start = source.indexOf("ensure_owned() {");
  const end = source.indexOf("\n\nif [", start);
  assert.ok(start >= 0 && end > start, "ensure_owned function exists");
  const functionSource = source.slice(start, end);
  const script = [
    'NODE_UID=12345; NODE_GID=12345',
    'mkdir() { return 0; }',
    'stat() { printf "0\\n"; }',
    'chown() { printf "CHOWN:%s\\n" "$*" ; }',
    functionSource,
    'ensure_owned "."',
    'ensure_owned "/"',
    'ensure_owned "/tmp"',
  ].join("\n");
  const result = spawnSync("sh", ["-c", script], { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
  assert.doesNotMatch(result.stdout, /CHOWN:.*(?: \.| \/)(?:\n|$)/);
  assert.match(result.stdout, /CHOWN:-R 12345:12345 \/tmp/);
  assert.match(result.stderr, /refusing broad chown target \./);
  assert.match(result.stderr, /refusing broad chown target \//);
});
