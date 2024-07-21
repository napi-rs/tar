import {
  instantiateNapiModuleSync as __emnapiInstantiateNapiModuleSync,
  getDefaultContext as __emnapiGetDefaultContext,
  WASI as __WASI,
  createOnMessage as __wasmCreateOnMessageForFsProxy,
} from '@napi-rs/wasm-runtime'

import __wasmUrl from './tar.wasm32-wasi.wasm?url'

const __wasi = new __WASI({
  version: 'preview1',
})

const __emnapiContext = __emnapiGetDefaultContext()

const __sharedMemory = new WebAssembly.Memory({
  initial: 4000,
  maximum: 65536,
  shared: true,
})

const __wasmFile = await fetch(__wasmUrl).then((res) => res.arrayBuffer())

const {
  instance: __napiInstance,
  module: __wasiModule,
  napiModule: __napiModule,
} = __emnapiInstantiateNapiModuleSync(__wasmFile, {
  context: __emnapiContext,
  asyncWorkPoolSize: 4,
  wasi: __wasi,
  onCreateWorker() {
    const worker = new Worker(new URL('./wasi-worker-browser.mjs', import.meta.url), {
      type: 'module',
    })

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
  },
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
export const Archive = __napiModule.exports.Archive
export const Entries = __napiModule.exports.Entries
export const Entry = __napiModule.exports.Entry
export const Header = __napiModule.exports.Header
export const ReadonlyHeader = __napiModule.exports.ReadonlyHeader
export const EntryType = __napiModule.exports.EntryType
