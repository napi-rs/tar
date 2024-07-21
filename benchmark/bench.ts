import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { Bench } from 'tinybench'
import { list } from 'tar'

import { Archive } from '../index'
import { fileURLToPath } from 'node:url'

const __dirname = join(fileURLToPath(import.meta.url), '..')

const ARCHIVE_PATH = join(__dirname, '..', '__test__', 'src.tar.gz')

list({
  file: join(__dirname, '..', '__test__', 'src.tar.gz'),
  onentry: (entry) => {
    console.info('list from node-tar', entry.path)
  },
  sync: true,
})

const archiveBuffer = readFileSync(ARCHIVE_PATH)
const archive = new Archive(archiveBuffer)
for (const entry of archive.entries()) {
  console.info('list from @napi-rs/tar', entry.path())
}

const b = new Bench()

b.add('@napi-rs/tar', () => {
  const archiveBuffer = readFileSync(ARCHIVE_PATH)
  const archive = new Archive(archiveBuffer)
  for (const entry of archive.entries()) {
    entry.path()
  }
})

b.add('node-tar', () => {
  list({
    file: join(__dirname, '..', '__test__', 'src.tar.gz'),
    onentry: (entry) => {
      entry.path
    },
    sync: true,
  })
})

await b.run()

console.table(b.table())
