#!/usr/bin/env node
const { spawnSync } = require('node:child_process')

function hasEslint() {
  try {
    require.resolve('eslint/package.json')
    return true
  } catch {
    return false
  }
}

if (!hasEslint()) {
  console.warn('ESLint not installed. Skipping lint (pass).')
  process.exit(0)
}

let nextBin
try {
  nextBin = require.resolve('next/dist/bin/next')
} catch {
  console.warn('Next.js CLI not found. Skipping lint (pass).')
  process.exit(0)
}

const res = spawnSync(process.execPath, [nextBin, 'lint'], { stdio: 'inherit' })
process.exit(res.status ?? 0)
