// Mock Bootstrap Modal
class MockModal {
  constructor(element, options = {}) {
    this.element = element
    this.options = options
    this.isShown = false
    this.isHidden = true
  }

  show() {
    this.isShown = true
    this.isHidden = false
    if (this.options.onShow) {
      this.options.onShow()
    }
  }

  hide() {
    this.isShown = false
    this.isHidden = true
    if (this.options.onHide) {
      this.options.onHide()
    }
  }

  dispose() {
    this.isShown = false
    this.isHidden = true
  }

  static getInstance(element) {
    return new MockModal(element)
  }
}

// Mock Bootstrap Tooltip
class MockTooltip {
  constructor(element, options = {}) {
    this.element = element
    this.options = options
  }

  show() {}
  hide() {}
  dispose() {}
  enable() {}
  disable() {}
  toggleEnabled() {}
  update() {}
}

// Mock Bootstrap Popover
class MockPopover {
  constructor(element, options = {}) {
    this.element = element
    this.options = options
  }

  show() {}
  hide() {}
  dispose() {}
  enable() {}
  disable() {}
  toggleEnabled() {}
  update() {}
}

// Mock Bootstrap Collapse
class MockCollapse {
  constructor(element, options = {}) {
    this.element = element
    this.options = options
    this.isShown = false
  }

  show() {
    this.isShown = true
  }

  hide() {
    this.isShown = false
  }

  toggle() {
    this.isShown = !this.isShown
  }

  dispose() {}
}

// Mock Bootstrap Dropdown
class MockDropdown {
  constructor(element, options = {}) {
    this.element = element
    this.options = options
  }

  show() {}
  hide() {}
  toggle() {}
  dispose() {}
  update() {}
}

// Mock Bootstrap Tab
class MockTab {
  constructor(element, options = {}) {
    this.element = element
    this.options = options
  }

  show() {}
  dispose() {}
}

// Mock Bootstrap Alert
class MockAlert {
  constructor(element, options = {}) {
    this.element = element
    this.options = options
  }

  close() {}
  dispose() {}
}

// Mock Bootstrap Button
class MockButton {
  constructor(element, options = {}) {
    this.element = element
    this.options = options
  }

  toggle() {}
  dispose() {}
}

// Mock Bootstrap Carousel
class MockCarousel {
  constructor(element, options = {}) {
    this.element = element
    this.options = options
  }

  cycle() {}
  pause() {}
  prev() {}
  next() {}
  dispose() {}
}

// Mock Bootstrap Offcanvas
class MockOffcanvas {
  constructor(element, options = {}) {
    this.element = element
    this.options = options
    this.isShown = false
  }

  show() {
    this.isShown = true
  }

  hide() {
    this.isShown = false
  }

  toggle() {
    this.isShown = !this.isShown
  }

  dispose() {}
}

// Mock Bootstrap ScrollSpy
class MockScrollSpy {
  constructor(element, options = {}) {
    this.element = element
    this.options = options
  }

  refresh() {}
  dispose() {}
}

// Mock Bootstrap Toast
class MockToast {
  constructor(element, options = {}) {
    this.element = element
    this.options = options
  }

  show() {}
  hide() {}
  dispose() {}
}

// Create global Bootstrap object
global.bootstrap = {
  Modal: MockModal,
  Tooltip: MockTooltip,
  Popover: MockPopover,
  Toast: MockToast,
  Collapse: MockCollapse,
  Dropdown: MockDropdown,
  Tab: MockTab,
  Alert: MockAlert,
  Button: MockButton,
  Carousel: MockCarousel,
  Offcanvas: MockOffcanvas,
  ScrollSpy: MockScrollSpy,
  Toast: MockToast
} 