import { beforeAll, afterEach, afterAll, vi } from 'vitest'
import { config } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { server } from './mocks/server'
import './mocks/bootstrap'
import '@testing-library/jest-dom'

// Setup MSW
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

// Setup Pinia for all tests
const pinia = createPinia()
config.global.plugins = [pinia]

// Global test utilities
export function createTestPinia() {
  const testPinia = createPinia()
  setActivePinia(testPinia)
  return testPinia
}

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
}

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
}

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  warn: vi.fn(),
  error: vi.fn(),
}

// Mock fetch
global.fetch = vi.fn()

// Mock window.scrollTo
Object.defineProperty(window, 'scrollTo', {
  value: vi.fn(),
  writable: true
})

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    href: 'http://localhost:3000',
    origin: 'http://localhost:3000',
    protocol: 'http:',
    host: 'localhost:3000',
    hostname: 'localhost',
    port: '3000',
    pathname: '/',
    search: '',
    hash: '',
    assign: vi.fn(),
    replace: vi.fn(),
    reload: vi.fn()
  },
  writable: true
})

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
}

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true
})

// Mock sessionStorage
const mockSessionStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
}

Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage,
  writable: true
})

// Mock URL.createObjectURL
global.URL.createObjectURL = vi.fn(() => 'mock-url')

// Mock URL.revokeObjectURL
global.URL.revokeObjectURL = vi.fn()

// Mock FileReader
global.FileReader = class FileReader {
  constructor() {
    this.readAsDataURL = vi.fn()
    this.readAsText = vi.fn()
    this.readAsArrayBuffer = vi.fn()
    this.abort = vi.fn()
  }
}

// Mock Image
global.Image = class Image {
  constructor() {
    this.src = ''
    this.onload = null
    this.onerror = null
  }
}

// Mock Canvas
global.HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
  fillRect: vi.fn(),
  clearRect: vi.fn(),
  getImageData: vi.fn(() => ({ data: new Array(4) })),
  putImageData: vi.fn(),
  createImageData: vi.fn(() => ({ data: new Array(4) })),
  setTransform: vi.fn(),
  drawImage: vi.fn(),
  save: vi.fn(),
  fillText: vi.fn(),
  restore: vi.fn(),
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  closePath: vi.fn(),
  stroke: vi.fn(),
  translate: vi.fn(),
  scale: vi.fn(),
  rotate: vi.fn(),
  arc: vi.fn(),
  fill: vi.fn(),
  measureText: vi.fn(() => ({ width: 0 })),
  transform: vi.fn(),
  rect: vi.fn(),
  clip: vi.fn(),
}))

// Mock requestAnimationFrame
global.requestAnimationFrame = vi.fn(cb => setTimeout(cb, 0))
global.cancelAnimationFrame = vi.fn()

// Mock performance
global.performance = {
  now: vi.fn(() => Date.now()),
  mark: vi.fn(),
  measure: vi.fn(),
  getEntriesByType: vi.fn(() => []),
  getEntriesByName: vi.fn(() => []),
  clearMarks: vi.fn(),
  clearMeasures: vi.fn(),
}

// Mock crypto
Object.defineProperty(global, 'crypto', {
  value: {
    getRandomValues: vi.fn((arr) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256)
      }
      return arr
    }),
    randomUUID: vi.fn(() => 'mock-uuid'),
  },
  writable: true
})

// Mock WebSocket
global.WebSocket = class WebSocket {
  constructor(url) {
    this.url = url
    this.readyState = 0 // CONNECTING
    this.onopen = null
    this.onclose = null
    this.onmessage = null
    this.onerror = null
    this.send = vi.fn()
    this.close = vi.fn()
  }
}

// Mock BroadcastChannel
global.BroadcastChannel = class BroadcastChannel {
  constructor(name) {
    this.name = name
    this.onmessage = null
    this.postMessage = vi.fn()
    this.close = vi.fn()
  }
}

// Mock Notification
global.Notification = class Notification {
  constructor(title, options = {}) {
    this.title = title
    this.options = options
    this.onclick = null
    this.onshow = null
    this.onclose = null
    this.onerror = null
  }
  
  static requestPermission = vi.fn(() => Promise.resolve('granted'))
  static permission = 'granted'
}

// Mock navigator
Object.defineProperty(global.navigator, 'serviceWorker', {
  value: {
    register: vi.fn(() => Promise.resolve()),
    getRegistration: vi.fn(() => Promise.resolve()),
    getRegistrations: vi.fn(() => Promise.resolve([])),
  },
  writable: true,
})

Object.defineProperty(global.navigator, 'permissions', {
  value: {
    query: vi.fn(() => Promise.resolve({ state: 'granted' })),
  },
  writable: true,
})

Object.defineProperty(global.navigator, 'geolocation', {
  value: {
    getCurrentPosition: vi.fn(),
    watchPosition: vi.fn(),
    clearWatch: vi.fn(),
  },
  writable: true,
})

// Mock document.createRange
document.createRange = () => ({
  setStart: () => {},
  setEnd: () => {},
  commonAncestorContainer: {
    nodeName: 'BODY',
    ownerDocument: document,
  },
})

// Mock document.getSelection
document.getSelection = () => ({
  removeAllRanges: () => {},
  addRange: () => {},
})

// Mock window.getComputedStyle
window.getComputedStyle = vi.fn(() => ({
  getPropertyValue: vi.fn(() => ''),
}))

// Mock Element.prototype methods
Element.prototype.scrollIntoView = vi.fn()
Element.prototype.scrollTo = vi.fn()

// Mock HTMLElement.prototype methods
HTMLElement.prototype.focus = vi.fn()
HTMLElement.prototype.blur = vi.fn()
HTMLElement.prototype.click = vi.fn()

// Mock Event constructor
global.Event = class Event {
  constructor(type, options = {}) {
    this.type = type
    this.bubbles = options.bubbles || false
    this.cancelable = options.cancelable || false
    this.defaultPrevented = false
    this.target = null
    this.currentTarget = null
    this.preventDefault = vi.fn(() => {
      this.defaultPrevented = true
    })
    this.stopPropagation = vi.fn()
    this.stopImmediatePropagation = vi.fn()
  }
}

// Mock CustomEvent constructor
global.CustomEvent = class CustomEvent extends Event {
  constructor(type, options = {}) {
    super(type, options)
    this.detail = options.detail || null
  }
}

// Mock MouseEvent constructor
global.MouseEvent = class MouseEvent extends Event {
  constructor(type, options = {}) {
    super(type, options)
    this.clientX = options.clientX || 0
    this.clientY = options.clientY || 0
    this.screenX = options.screenX || 0
    this.screenY = options.screenY || 0
    this.button = options.button || 0
    this.buttons = options.buttons || 0
    this.ctrlKey = options.ctrlKey || false
    this.shiftKey = options.shiftKey || false
    this.altKey = options.altKey || false
    this.metaKey = options.metaKey || false
  }
}

// Mock KeyboardEvent constructor
global.KeyboardEvent = class KeyboardEvent extends Event {
  constructor(type, options = {}) {
    super(type, options)
    this.key = options.key || ''
    this.code = options.code || ''
    this.keyCode = options.keyCode || 0
    this.which = options.which || 0
    this.ctrlKey = options.ctrlKey || false
    this.shiftKey = options.shiftKey || false
    this.altKey = options.altKey || false
    this.metaKey = options.metaKey || false
    this.repeat = options.repeat || false
  }
}

// Mock InputEvent constructor
global.InputEvent = class InputEvent extends Event {
  constructor(type, options = {}) {
    super(type, options)
    this.data = options.data || null
    this.inputType = options.inputType || ''
    this.isComposing = options.isComposing || false
  }
}

// Mock FocusEvent constructor
global.FocusEvent = class FocusEvent extends Event {
  constructor(type, options = {}) {
    super(type, options)
    this.relatedTarget = options.relatedTarget || null
  }
}

// Mock TransitionEvent constructor
global.TransitionEvent = class TransitionEvent extends Event {
  constructor(type, options = {}) {
    super(type, options)
    this.propertyName = options.propertyName || ''
    this.elapsedTime = options.elapsedTime || 0
    this.pseudoElement = options.pseudoElement || ''
  }
}

// Mock AnimationEvent constructor
global.AnimationEvent = class AnimationEvent extends Event {
  constructor(type, options = {}) {
    super(type, options)
    this.animationName = options.animationName || ''
    this.elapsedTime = options.elapsedTime || 0
    this.pseudoElement = options.pseudoElement || ''
  }
}

// Mock FormData
global.FormData = class FormData {
  constructor() {
    this.entries = []
  }
  
  append(key, value) {
    this.entries.push([key, value])
  }
  
  get(key) {
    const entry = this.entries.find(([k]) => k === key)
    return entry ? entry[1] : null
  }
  
  getAll(key) {
    return this.entries.filter(([k]) => k === key).map(([, v]) => v)
  }
  
  has(key) {
    return this.entries.some(([k]) => k === key)
  }
  
  delete(key) {
    this.entries = this.entries.filter(([k]) => k !== key)
  }
  
  forEach(callback) {
    this.entries.forEach(([key, value]) => callback(value, key))
  }
  
  keys() {
    return this.entries.map(([key]) => key)[Symbol.iterator]()
  }
  
  values() {
    return this.entries.map(([, value]) => value)[Symbol.iterator]()
  }
  
  entries() {
    return this.entries[Symbol.iterator]()
  }
}

// Mock Headers
global.Headers = class Headers {
  constructor(init = {}) {
    this.headers = new Map()
    
    if (init instanceof Headers) {
      init.forEach((value, key) => this.set(key, value))
    } else if (Array.isArray(init)) {
      init.forEach(([key, value]) => this.set(key, value))
    } else {
      Object.entries(init).forEach(([key, value]) => this.set(key, value))
    }
  }
  
  append(name, value) {
    this.headers.set(name.toLowerCase(), value)
  }
  
  delete(name) {
    this.headers.delete(name.toLowerCase())
  }
  
  get(name) {
    return this.headers.get(name.toLowerCase()) || null
  }
  
  has(name) {
    return this.headers.has(name.toLowerCase())
  }
  
  set(name, value) {
    this.headers.set(name.toLowerCase(), value)
  }
  
  forEach(callback) {
    this.headers.forEach((value, key) => callback(value, key))
  }
  
  keys() {
    return this.headers.keys()[Symbol.iterator]()
  }
  
  values() {
    return this.headers.values()[Symbol.iterator]()
  }
  
  entries() {
    return this.headers.entries()[Symbol.iterator]()
  }
}

// Mock Response
global.Response = class Response {
  constructor(body = null, init = {}) {
    this.body = body
    this.status = init.status || 200
    this.statusText = init.statusText || 'OK'
    this.headers = new Headers(init.headers)
    this.ok = this.status >= 200 && this.status < 300
    this.redirected = false
    this.type = 'default'
    this.url = ''
  }
  
  json() {
    return Promise.resolve(this.body)
  }
  
  text() {
    return Promise.resolve(String(this.body))
  }
  
  blob() {
    return Promise.resolve(new Blob([this.body]))
  }
  
  arrayBuffer() {
    return Promise.resolve(new ArrayBuffer(0))
  }
  
  formData() {
    return Promise.resolve(new FormData())
  }
  
  clone() {
    return new Response(this.body, {
      status: this.status,
      statusText: this.statusText,
      headers: this.headers,
    })
  }
}

// Mock Request
global.Request = class Request {
  constructor(input, init = {}) {
    this.url = typeof input === 'string' ? input : input.url
    this.method = init.method || 'GET'
    this.headers = new Headers(init.headers)
    this.body = init.body || null
    this.mode = init.mode || 'cors'
    this.credentials = init.credentials || 'same-origin'
    this.cache = init.cache || 'default'
    this.redirect = init.redirect || 'follow'
    this.referrer = init.referrer || 'about:client'
    this.integrity = init.integrity || ''
  }
  
  clone() {
    return new Request(this.url, {
      method: this.method,
      headers: this.headers,
      body: this.body,
      mode: this.mode,
      credentials: this.credentials,
      cache: this.cache,
      redirect: this.redirect,
      referrer: this.referrer,
      integrity: this.integrity,
    })
  }
}

// Export mock objects for use in tests
export {
  mockLocalStorage,
  mockSessionStorage
} 