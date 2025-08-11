import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import test from 'ava'

import { Archive } from '../index'

const __dirname = join(fileURLToPath(import.meta.url), '..')

test('should be able to read archive', (t) => {
  const archive = new Archive(join(__dirname, 'src.tar'))
  for (const entry of archive.entries()) {
    t.is(typeof entry.path(), 'string')
  }
})

test('should be able to unpack archive', (t) => {
  if (process.env.NAPI_RS_FORCE_WASI) {
    t.pass('Skipping unpack test on WASI')
    return
  }
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

test('should be able to extract single file with asBytes', (t) => {
  const archive = new Archive(join(__dirname, 'src.tar'))
  for (const entry of archive.entries()) {
    const path = entry.path()
    if (path === 'src/lib.rs') {
      const content = entry.asBytes()
      t.true(content instanceof Buffer, 'asBytes should return a Buffer')
      t.true(content.length > 0, 'Content should not be empty')

      // The content should be valid Rust code, so let's check for some expected content
      const contentStr = content.toString('utf-8')
      t.true(contentStr.includes('use'), 'Should contain Rust use statements')
      t.true(contentStr.includes('napi'), 'Should contain napi imports')
      return
    }
  }
  t.fail('Could not find src/lib.rs in the archive')
})

test('should be able to extract multiple files with asBytes', (t) => {
  const archive = new Archive(join(__dirname, 'src.tar'))
  const extractedFiles = new Map<string, Buffer>()

  for (const entry of archive.entries()) {
    const path = entry.path()
    if (path && path.endsWith('.rs')) {
      const content = entry.asBytes()
      extractedFiles.set(path, content)
    }
  }

  t.true(extractedFiles.size >= 2, 'Should extract at least 2 .rs files')
  t.true(extractedFiles.has('src/lib.rs'), 'Should have extracted src/lib.rs')
  t.true(extractedFiles.has('src/entry.rs'), 'Should have extracted src/entry.rs')

  // Verify all extracted content is non-empty and valid
  for (const [path, content] of extractedFiles) {
    t.true(content instanceof Buffer, `Content of ${path} should be a Buffer`)
    t.true(content.length > 0, `Content of ${path} should not be empty`)
    t.true(content.toString('utf-8').includes('use'), `${path} should contain Rust use statements`)
  }
})

test('should work with asBytes on compressed archives', async (t) => {
  const formats = ['src.tar.gz', 'src.tar.bz2', 'src.tar.xz']

  for (const format of formats) {
    const archive = new Archive(join(__dirname, format))
    let foundFile = false

    for (const entry of archive.entries()) {
      const path = entry.path()
      if (path === 'src/lib.rs') {
        const content = entry.asBytes()
        t.true(content instanceof Buffer, `asBytes should return Buffer for ${format}`)
        t.true(content.length > 0, `Content should not be empty for ${format}`)
        foundFile = true
        break
      }
    }

    t.true(foundFile, `Should find src/lib.rs in ${format}`)
  }
})

test('should work with asBytes from buffer-based archive', async (t) => {
  const archiveBuffer = await readFile(join(__dirname, 'src.tar'))
  const archive = new Archive(archiveBuffer)

  for (const entry of archive.entries()) {
    const path = entry.path()
    if (path === 'src/lib.rs') {
      const content = entry.asBytes()
      t.true(content instanceof Buffer, 'asBytes should return a Buffer')
      t.true(content.length > 0, 'Content should not be empty')

      const contentStr = content.toString('utf-8')
      t.true(contentStr.includes('napi'), 'Should contain napi imports')
      return
    }
  }
  t.fail('Could not find src/lib.rs in buffer-based archive')
})

test('Docker OCI use case - extract specific file like index.json', (t) => {
  // This test demonstrates the exact use case mentioned in issue #58
  // where you want to extract a specific file from a tarball (like Docker OCI images)

  // Function to extract a specific file by name, similar to: tar -x -O -f something.tar index.json
  function extractFile(archivePath: string, targetPath: string): Buffer | null {
    const archive = new Archive(archivePath)
    for (const entry of archive.entries()) {
      const path = entry.path()
      if (path === targetPath) {
        return entry.asBytes()
      }
    }
    return null
  }

  const archivePath = join(__dirname, 'src.tar')

  // Extract src/lib.rs (simulating extracting index.json from a Docker image)
  const libRsContent = extractFile(archivePath, 'src/lib.rs')
  t.not(libRsContent, null, 'Should be able to extract src/lib.rs')
  t.true(libRsContent instanceof Buffer, 'Extracted content should be a Buffer')
  t.true(libRsContent!.length > 0, 'Extracted content should not be empty')

  // Verify the content is correct
  const contentStr = libRsContent!.toString('utf-8')
  t.true(contentStr.includes('#![deny(clippy::all)]'), 'Should contain expected Rust code')

  // Try to extract a non-existent file
  const nonExistentContent = extractFile(archivePath, 'non-existent.json')
  t.is(nonExistentContent, null, 'Should return null for non-existent files')
})
