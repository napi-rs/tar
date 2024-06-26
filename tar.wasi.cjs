/* eslint-disable */
/* prettier-ignore */

/* auto-generated by NAPI-RS */

const __nodeFs = require('node:fs')
const __nodePath = require('node:path')
const { WASI: __nodeWASI } = require('node:wasi')
const { Worker } = require('node:worker_threads')

const {
  instantiateNapiModuleSync: __emnapiInstantiateNapiModuleSync,
  getDefaultContext: __emnapiGetDefaultContext,
  createOnMessage: __wasmCreateOnMessageForFsProxy,
} = require('@napi-rs/wasm-runtime')

const __rootDir = __nodePath.parse(process.cwd()).root

const __wasi = new __nodeWASI({
  version: 'preview1',
  env: process.env,
  preopens: {
    [__rootDir]: __rootDir,
  }
})

const __emnapiContext = __emnapiGetDefaultContext()

const __sharedMemory = new WebAssembly.Memory({
  initial: 4000,
  maximum: 65536,
  shared: true,
})

let __wasmFilePath = __nodePath.join(__dirname, 'tar.wasm32-wasi.wasm')
const __wasmDebugFilePath = __nodePath.join(__dirname, 'tar.wasm32-wasi.debug.wasm')

if (__nodeFs.existsSync(__wasmDebugFilePath)) {
  __wasmFilePath = __wasmDebugFilePath
} else if (!__nodeFs.existsSync(__wasmFilePath)) {
  try {
    __wasmFilePath = __nodePath.resolve('@napi-rs/tar-wasm32-wasi')
  } catch {
    throw new Error('Cannot find tar.wasm32-wasi.wasm file, and @napi-rs/tar-wasm32-wasi package is not installed.')
  }
}

const { instance: __napiInstance, module: __wasiModule, napiModule: __napiModule } = __emnapiInstantiateNapiModuleSync(__nodeFs.readFileSync(__wasmFilePath), {
  context: __emnapiContext,
  asyncWorkPoolSize: (function() {
    const threadsSizeFromEnv = Number(process.env.NAPI_RS_ASYNC_WORK_POOL_SIZE ?? process.env.UV_THREADPOOL_SIZE)
    // NaN > 0 is false
    if (threadsSizeFromEnv > 0) {
      return threadsSizeFromEnv
    } else {
      return 4
    }
  })(),
  wasi: __wasi,
  onCreateWorker() {
    const worker = new Worker(__nodePath.join(__dirname, 'wasi-worker.mjs'), {
      env: process.env,
      execArgv: ['--experimental-wasi-unstable-preview1'],
    })
    worker.onmessage = ({ data }) => {
      __wasmCreateOnMessageForFsProxy(__nodeFs)(data)
    }
    return worker
  },
  overwriteImports(importObject) {
    importObject.env = {
      ...importObject.env,
      ...importObject.napi,
      ...importObject.emnapi,
      memory: __sharedMemory,
    }
    return importObject
  },
  beforeInit({ instance }) {
    __napi_rs_initialize_modules(instance)
  }
})

function __napi_rs_initialize_modules(__napiInstance) {
  __napiInstance.exports['__napi_register__Entries_struct_0']?.()
  __napiInstance.exports['__napi_register__Entries_impl_1']?.()
  __napiInstance.exports['__napi_register__Entry_struct_2']?.()
  __napiInstance.exports['__napi_register__Entry_impl_5']?.()
  __napiInstance.exports['__napi_register__EntryType_6']?.()
  __napiInstance.exports['__napi_register__Header_struct_7']?.()
  __napiInstance.exports['__napi_register__Header_impl_37']?.()
  __napiInstance.exports['__napi_register__ReadonlyHeader_struct_38']?.()
  __napiInstance.exports['__napi_register__ReadonlyHeader_impl_54']?.()
  __napiInstance.exports['__napi_register__Archive_struct_55']?.()
  __napiInstance.exports['__napi_register__Archive_impl_66']?.()
}
module.exports.Archive = __napiModule.exports.Archive
module.exports.Entries = __napiModule.exports.Entries
module.exports.Entry = __napiModule.exports.Entry
module.exports.Header = __napiModule.exports.Header
module.exports.ReadonlyHeader = __napiModule.exports.ReadonlyHeader
module.exports.EntryType = __napiModule.exports.EntryType
