import { readFile } from 'node:fs/promises'

import { x64TargetX86_64 } from '@napi-rs/cross-toolchain'
import { decompress } from '@napi-rs/lzma/xz'

import { Archive } from './index.js'

const xz = await readFile(x64TargetX86_64)

const archive = new Archive(await decompress(xz))

archive.unpack('x86_64-unknown-linux-gnu')
