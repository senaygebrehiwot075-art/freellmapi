import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';

const ignore = readFileSync(new URL('../.dockerignore', import.meta.url), 'utf8')
  .split(/\r?\n/)
  .map((line) => line.trim())
  .filter((line) => line && !line.startsWith('#'));

test('Docker build context excludes credentials and persisted database files', () => {
  for (const pattern of ['.env', '.env.*', '.encryption-key', 'server/data', '*.db', '*.db-wal', '*.db-shm']) {
    assert.ok(ignore.includes(pattern), `Missing Docker exclusion: ${pattern}`);
  }
});

test('Docker build context excludes dependency and VCS directories', () => {
  for (const pattern of ['.git', 'node_modules', 'client/node_modules', 'server/node_modules']) {
    assert.ok(ignore.includes(pattern), `Missing Docker exclusion: ${pattern}`);
  }
});

test('Docker build context does not exclude build instructions', () => {
  for (const pattern of ['Dockerfile', 'docker-entrypoint.sh', 'package.json', 'package-lock.json']) {
    assert.ok(!ignore.includes(pattern), `Required build input excluded: ${pattern}`);
  }
});
