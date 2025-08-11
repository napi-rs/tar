import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { writeFileSync, unlinkSync, mkdirSync, rmSync } from 'node:fs'

import test from 'ava'

import { Archive, Builder } from '../index'

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

// =====================================
// Builder API Tests
// =====================================

test('Builder - should create archive with appendData', (t) => {
  const builder = new Builder()
  
  // Add some data to the archive
  builder.appendData('hello.txt', Buffer.from('Hello, world!'))
  builder.appendData('test.txt', Buffer.from('Test content'))
  
  // Finish and get the archive data
  const archiveData = builder.finish()
  t.not(archiveData, null, 'Should return archive data')
  t.true(archiveData instanceof Array, 'Should return an array of bytes')
  t.true(archiveData!.length > 0, 'Archive data should not be empty')
  
  // Verify the archive by reading it back
  const archive = new Archive(Buffer.from(archiveData!))
  const fileNames: string[] = []
  
  for (const entry of archive.entries()) {
    const path = entry.path()
    if (path) {
      fileNames.push(path)
    }
  }
  
  t.true(fileNames.includes('hello.txt'), 'Should contain hello.txt')
  t.true(fileNames.includes('test.txt'), 'Should contain test.txt')
})

test('Builder - should create archive with file output', (t) => {
  const outputPath = join(__dirname, 'test-output.tar')
  const builder = new Builder(outputPath)
  
  // Add some data
  builder.appendData('file1.txt', Buffer.from('Content 1'))
  builder.appendData('file2.txt', Buffer.from('Content 2'))
  
  // Finish (should write to file)
  const result = builder.finish()
  t.is(result, null, 'Should return null for file output')
  
  // Verify the file was created by reading it
  const archive = new Archive(outputPath)
  const fileNames: string[] = []
  
  for (const entry of archive.entries()) {
    const path = entry.path()
    if (path) {
      fileNames.push(path)
    }
  }
  
  t.is(fileNames.length, 2, 'Should contain 2 files')
  t.true(fileNames.includes('file1.txt'), 'Should contain file1.txt')
  t.true(fileNames.includes('file2.txt'), 'Should contain file2.txt')
})

test('Builder - should append files from disk', (t) => {
  if (process.env.NAPI_RS_FORCE_WASI) {
    t.pass('Skipping append files test on WASI')
    return
  }
  // Create temp files to add to archive
  const tempFile1 = join(__dirname, 'temp1.txt')
  const tempFile2 = join(__dirname, 'temp2.txt')
  
  // Write test files
  writeFileSync(tempFile1, 'Temp file 1 content')
  writeFileSync(tempFile2, 'Temp file 2 content')
  
  const builder = new Builder()
  
  // Add files to archive
  builder.appendFile('archived_temp1.txt', tempFile1)
  builder.appendFile('archived_temp2.txt', tempFile2)
  
  // Finish and verify
  const archiveData = builder.finish()
  t.not(archiveData, null, 'Should return archive data')
  
  const archive = new Archive(Buffer.from(archiveData!))
  const fileContents = new Map<string, string>()
  
  for (const entry of archive.entries()) {
    const path = entry.path()
    if (path) {
      const content = entry.asBytes().toString('utf-8')
      fileContents.set(path, content)
    }
  }
  
  t.is(fileContents.get('archived_temp1.txt'), 'Temp file 1 content', 'Should have correct content for temp1')
  t.is(fileContents.get('archived_temp2.txt'), 'Temp file 2 content', 'Should have correct content for temp2')
  
  // Clean up temp files
  unlinkSync(tempFile1)
  unlinkSync(tempFile2)
})

test('Builder - should append directories', (t) => {
  if (process.env.NAPI_RS_FORCE_WASI) {
    t.pass('Skipping append directories test on WASI')
    return
  }
  // Create a test directory structure
  const testDir = join(__dirname, 'test-dir')
  const subDir = join(testDir, 'subdir')
  
  mkdirSync(testDir, { recursive: true })
  mkdirSync(subDir, { recursive: true })
  writeFileSync(join(testDir, 'file1.txt'), 'Root file content')
  writeFileSync(join(subDir, 'file2.txt'), 'Sub file content')
  
  const builder = new Builder()
  
  // Add directory to archive
  builder.appendDirAll('my-dir', testDir)
  
  // Finish and verify
  const archiveData = builder.finish()
  t.not(archiveData, null, 'Should return archive data')
  
  const archive = new Archive(Buffer.from(archiveData!))
  const filePaths: string[] = []
  
  for (const entry of archive.entries()) {
    const path = entry.path()
    if (path) {
      filePaths.push(path)
    }
  }
  
  // Should contain the directory and its files
  t.true(filePaths.some(p => p.includes('my-dir')), 'Should contain my-dir entries')
  t.true(filePaths.some(p => p.includes('file1.txt')), 'Should contain file1.txt')
  t.true(filePaths.some(p => p.includes('file2.txt')), 'Should contain file2.txt')
  
  // Clean up test directory
  rmSync(testDir, { recursive: true, force: true })
})

test('Builder - should handle mixed content types', (t) => {
  if (process.env.NAPI_RS_FORCE_WASI) {
    t.pass('Skipping mixed content types test on WASI')
    return
  }
  // Create a temp file for testing
  const tempFile = join(__dirname, 'mixed-test.txt')
  writeFileSync(tempFile, 'File from disk')
  
  // Create a temp directory
  const tempDir = join(__dirname, 'mixed-dir')
  mkdirSync(tempDir, { recursive: true })
  writeFileSync(join(tempDir, 'dir-file.txt'), 'File in directory')
  
  const builder = new Builder()
  
  // Mix different append methods
  builder.appendData('data-file.txt', Buffer.from('Data from memory'))
  builder.appendFile('disk-file.txt', tempFile)
  builder.appendDirAll('my-directory', tempDir)
  
  // Finish and verify
  const archiveData = builder.finish()
  t.not(archiveData, null, 'Should return archive data')
  
  const archive = new Archive(Buffer.from(archiveData!))
  const fileContents = new Map<string, string>()
  
  for (const entry of archive.entries()) {
    const path = entry.path()
    if (path && !path.endsWith('/')) { // Skip directories
      const content = entry.asBytes().toString('utf-8')
      fileContents.set(path, content)
    }
  }
  
  t.is(fileContents.get('data-file.txt'), 'Data from memory', 'Should have data file content')
  t.is(fileContents.get('disk-file.txt'), 'File from disk', 'Should have disk file content')
  t.true(Array.from(fileContents.keys()).some(k => k.includes('dir-file.txt')), 'Should have directory file')
  
  // Clean up
  unlinkSync(tempFile)
  rmSync(tempDir, { recursive: true, force: true })
})

test('Builder - should handle empty archive', (t) => {
  const builder = new Builder()
  
  // Create empty archive
  const archiveData = builder.finish()
  t.not(archiveData, null, 'Should return archive data even when empty')
  t.true(archiveData instanceof Array, 'Should return an array')
  t.true(archiveData!.length > 0, 'Empty archive should still have tar headers')
  
  // For empty archives, we can verify that it's at least a valid tar structure
  // by checking that it contains the expected tar end blocks (512 zero bytes x 2)
  const buffer = Buffer.from(archiveData!)
  t.true(buffer.length >= 1024, 'Empty tar should be at least 1024 bytes (2 zero blocks)')
})

test('Builder - should create archive compatible with existing Archive reader', (t) => {
  const builder = new Builder()
  
  // Create archive with known content
  const testData = {
    'readme.txt': 'This is a readme file',
    'config.json': JSON.stringify({ version: '1.0.0', name: 'test' }),
    'data.bin': Buffer.from([0x00, 0x01, 0x02, 0x03, 0x04])
  }
  
  for (const [filename, content] of Object.entries(testData)) {
    const data = content instanceof Buffer ? content : Buffer.from(content)
    builder.appendData(filename, data)
  }
  
  const archiveData = builder.finish()
  t.not(archiveData, null, 'Should create archive data')
  
  // Test that Archive can read the created archive
  const archive = new Archive(Buffer.from(archiveData!))
  const extractedFiles = new Map<string, Buffer>()
  
  for (const entry of archive.entries()) {
    const path = entry.path()
    if (path) {
      extractedFiles.set(path, entry.asBytes())
    }
  }
  
  // Verify all files were extracted correctly
  t.is(extractedFiles.size, 3, 'Should extract all 3 files')
  t.is(extractedFiles.get('readme.txt')?.toString('utf-8'), testData['readme.txt'], 'Readme content should match')
  t.is(extractedFiles.get('config.json')?.toString('utf-8'), testData['config.json'], 'Config content should match')
  t.deepEqual(Array.from(extractedFiles.get('data.bin')!), Array.from(testData['data.bin']), 'Binary data should match')
})

test('Builder - should handle large data', (t) => {
  const builder = new Builder()
  
  // Create a large file (1MB)
  const largeData = Buffer.alloc(1024 * 1024, 'A')
  builder.appendData('large-file.txt', largeData)
  
  const archiveData = builder.finish()
  t.not(archiveData, null, 'Should handle large files')
  
  const archive = new Archive(Buffer.from(archiveData!))
  let foundFile = false
  
  for (const entry of archive.entries()) {
    if (entry.path() === 'large-file.txt') {
      const extractedData = entry.asBytes()
      t.is(extractedData.length, largeData.length, 'Extracted file should have same size')
      t.is(extractedData[0], 65, 'First byte should be "A"') // ASCII 'A' = 65
      t.is(extractedData[extractedData.length - 1], 65, 'Last byte should be "A"')
      foundFile = true
      break
    }
  }
  
  t.true(foundFile, 'Should find the large file in archive')
})

test('Builder - should handle unicode filenames', (t) => {
  const builder = new Builder()
  
  // Test various unicode filenames
  const unicodeFiles = {
    'файл.txt': 'Russian filename',
    '文件.txt': 'Chinese filename',
    '🚀rocket.txt': 'Emoji filename',
    'café.txt': 'Accented filename',
  }
  
  for (const [filename, content] of Object.entries(unicodeFiles)) {
    builder.appendData(filename, Buffer.from(content))
  }
  
  const archiveData = builder.finish()
  const archive = new Archive(Buffer.from(archiveData!))
  const extractedFiles = new Map<string, string>()
  
  for (const entry of archive.entries()) {
    const path = entry.path()
    if (path) {
      extractedFiles.set(path, entry.asBytes().toString('utf-8'))
    }
  }
  
  // Verify all unicode filenames are preserved
  for (const [filename, expectedContent] of Object.entries(unicodeFiles)) {
    t.is(extractedFiles.get(filename), expectedContent, `Should preserve unicode filename: ${filename}`)
  }
})

test('Builder - should handle paths with subdirectories', (t) => {
  const builder = new Builder()
  
  // Add files with directory structure
  builder.appendData('root.txt', Buffer.from('Root file'))
  builder.appendData('dir1/file1.txt', Buffer.from('File in dir1'))
  builder.appendData('dir1/subdir/file2.txt', Buffer.from('File in subdir'))
  builder.appendData('dir2/file3.txt', Buffer.from('File in dir2'))
  
  const archiveData = builder.finish()
  const archive = new Archive(Buffer.from(archiveData!))
  const filePaths: string[] = []
  
  for (const entry of archive.entries()) {
    const path = entry.path()
    if (path) {
      filePaths.push(path)
    }
  }
  
  t.true(filePaths.includes('root.txt'), 'Should have root file')
  t.true(filePaths.includes('dir1/file1.txt'), 'Should have file in dir1')
  t.true(filePaths.includes('dir1/subdir/file2.txt'), 'Should have file in subdir')
  t.true(filePaths.includes('dir2/file3.txt'), 'Should have file in dir2')
})

test('Builder - should work with file output and then read back', (t) => {
  const outputPath = join(__dirname, 'builder-test-output.tar')
  
  // Create archive with file output
  const builder = new Builder(outputPath)
  builder.appendData('test-file.txt', Buffer.from('Test content for file output'))
  const result = builder.finish()
  
  t.is(result, null, 'File output should return null')
  
  // Read back the created file
  const archive = new Archive(outputPath)
  let foundContent = ''
  
  for (const entry of archive.entries()) {
    if (entry.path() === 'test-file.txt') {
      foundContent = entry.asBytes().toString('utf-8')
      break
    }
  }
  
  t.is(foundContent, 'Test content for file output', 'Should be able to read back file output')
  
  // Clean up
  unlinkSync(outputPath)
})
