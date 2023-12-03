import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import b from 'benny'
import { list } from 'tar'

import { Archive } from '../index'

const ARCHIVE_PATH = join(__dirname, '..', '__test__', 'src.tar')

async function run() {
  await b.suite(
    'Read all entries',

    b.add('@napi-rs/tar', () => {
      const archiveBuffer = readFileSync(ARCHIVE_PATH)
      const archive = new Archive(archiveBuffer)
      for (const entry of archive.entries()) {
        entry.path()
      }
    }),

    b.add('node-tar', () => {
      list({
        file: join(__dirname, '..', '__test__', 'src.tar'),
        onentry: (entry) => {
          entry.path
        },
        sync: true,
      })
    }),

    b.cycle(),
    b.complete(),
  )
}

run().catch((e) => {
  console.error(e)
})
