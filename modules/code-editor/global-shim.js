// Global shim for browser environment
export default typeof globalThis !== 'undefined'
  ? globalThis
  : typeof window !== 'undefined'
  ? window
  : typeof global !== 'undefined'
  ? global
  : typeof self !== 'undefined'
  ? self
  : {}
