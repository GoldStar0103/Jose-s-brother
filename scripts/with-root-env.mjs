#!/usr/bin/env node
/**
 * Loads the monorepo's root `.env` (see load-root-env.mjs) into the real
 * process environment, then execs the given command as a child so it
 * inherits those variables.
 *
 * Needed because only the Next apps read `.env` on their own (via
 * next.config.mjs, evaluated in-process before the app runs). Everything
 * else here — drizzle-kit, the worker's own scripts — is a separate process
 * started from package.json, which only ever sees real OS environment
 * variables. This is the same loader wired in front of those.
 *
 *   node scripts/with-root-env.mjs pnpm --filter @monkei/db migrate
 */

import { spawn } from 'node:child_process';
import { loadRootEnv } from './load-root-env.mjs';

loadRootEnv();

const [command, ...args] = process.argv.slice(2);
if (!command) {
  console.error('Usage: node scripts/with-root-env.mjs <command> [args...]');
  process.exit(2);
}

// A shell is needed to resolve npm/pnpm's own .cmd shims on Windows, but
// passing argv straight through to a shell is a Node deprecation
// (DEP0190) — join into one string instead, which is safe here since every
// caller is a static command in this repo's own package.json scripts.
const child = spawn([command, ...args].join(' '), {
  stdio: 'inherit',
  env: process.env,
  shell: true,
});

child.on('exit', (code, signal) => {
  process.exit(code ?? (signal ? 1 : 0));
});
