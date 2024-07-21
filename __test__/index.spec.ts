import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

import test from 'ava'

import { Archive } from '../index'
import { fileURLToPath } from 'node:url'

const __dirname = join(fileURLToPath(import.meta.url), '..')

test('should be able to read archive', (t) => {
  const archive = new Archive(join(__dirname, 'src.tar'))
  for (const entry of archive.entries()) {
    t.is(typeof entry.path(), 'string')
  }
})

test('should be able to unpack archive', (t) => {
  const archive = new Archive(join(__dirname, 'src.tar'))
  archive.unpack(__dirname)
  t.pass()
})

test('should be able to create archive from Buffer', async (t) => {
  const archiveBuffer = await readFile(join(__dirname, 'src.tar'))
  const archive = new Archive(archiveBuffer)
  for (const entry of archive.entries()) {
    t.is(typeof entry.path(), 'string')
  }
})

test('should be able to handle tar.gz', (t) => {
  const archive = new Archive(join(__dirname, 'src.tar.gz'))
  for (const entry of archive.entries()) {
    t.is(typeof entry.path(), 'string')
  }
})

test('should be able to handle tar.bz2', (t) => {
  const archive = new Archive(join(__dirname, 'src.tar.bz2'))
  for (const entry of archive.entries()) {
    t.is(typeof entry.path(), 'string')
  }
})

test('should be able to handle tar.xz', (t) => {
  const archive = new Archive(join(__dirname, 'src.tar.xz'))
  for (const entry of archive.entries()) {
    t.is(typeof entry.path(), 'string')
  }
})
