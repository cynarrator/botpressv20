// Polyfill initialization - must run first
import { Buffer } from 'buffer/'
import process from 'process/browser'

// Set as globals
if (typeof window !== 'undefined') {
  window.Buffer = Buffer
  window.process = process
  window.global = window
}

if (typeof global !== 'undefined') {
  global.Buffer = Buffer
  global.process = process
}

// Also set on globalThis
if (typeof globalThis !== 'undefined') {
  globalThis.Buffer = Buffer
  globalThis.process = process
  globalThis.global = globalThis
}
