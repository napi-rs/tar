# `@napi-rs/tar`

![https://github.com/napi-rs/tar/actions](https://github.com/napi-rs/tar/workflows/CI/badge.svg)
[![install size](https://packagephobia.com/badge?p=@napi-rs/tar)](https://packagephobia.com/result?p=@napi-rs/tar)
[![Downloads](https://img.shields.io/npm/dm/@napi-rs/tar.svg?sanitize=true)](https://npmcharts.com/compare/@napi-rs/tar?minimal=true)

> Node.js tar binding https://docs.rs/tar/latest/tar/

## Usage

```ts
export class Entries {
  [Symbol.iterator](): Iterator<Entry, void, void>
}
export class Entry {
  path(): string | null
  asBytes(): Buffer
}
export class Archive {
  /** Create a new archive with the underlying path. */
  constructor(path: string)
  entries(): Entries
  /**
   * Unpacks the contents tarball into the specified `dst`.
   *
   * This function will iterate over the entire contents of this tarball,
   * extracting each file in turn to the location specified by the entry's
   * path name.
   *
   * This operation is relatively sensitive in that it will not write files
   * outside of the path specified by `dst`. Files in the archive which have
   * a '..' in their path are skipped during the unpacking process.
   */
  unpack(to: string): void
}
```

## Extract Single File

You can extract a specific file from a tar archive without extracting the entire archive. This is useful for inspecting Docker OCI images or extracting specific configuration files:

```ts
import { Archive } from '@napi-rs/tar'

// Extract a single file (similar to: tar -x -O -f archive.tar filename)
function extractFile(archivePath: string, targetPath: string): Buffer | null {
  const archive = new Archive(archivePath)
  for (const entry of archive.entries()) {
    if (entry.path() === targetPath) {
      return entry.asBytes()
    }
  }
  return null
}

// Usage example
const indexContent = extractFile('./docker-image.tar', 'index.json')
if (indexContent) {
  const manifest = JSON.parse(indexContent.toString('utf-8'))
  console.log(manifest)
}
```

## Install this test package

```
yarn add @napi-rs/tar
pnpm install @napi-rs/tar
npm install @napi-rs/tar
```
