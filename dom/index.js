import { registerSvelteElements } from "./svelte-elements";
import { registerNativeElements } from "./nativescript-elements";
import SvelteNativeDocument from "./svelte/SvelteNativeDocument";
import NativeViewElementNode from "./native/NativeViewElementNode";
import { Trace, View } from "@nativescript/core";
import { logger, LogLevel } from "./basicdom";

export { default as HeadElement } from "./svelte/HeadElement";
export { default as TemplateElement } from "./svelte/TemplateElement";
export { default as SvelteNativeDocument } from "./svelte/SvelteNativeDocument";
export { default as StyleElement } from "./svelte/StyleElement";

export {
  default as NativeElementNode,
  NativeElementPropConfig,
  NativeElementPropType,
  registerNativeConfigElement
} from "./native/NativeElementNode";
export {
  default as NativeViewElementNode,
  registerNativeViewElement
} from "./native/NativeViewElementNode";
export { default as ActionBarElement } from "./native/ActionBarElement";
export { default as FrameElement } from "./native/FrameElement";
export { default as PageElement } from "./native/PageElement";
export {
  default as ListViewElement,
  SvelteKeyedTemplate
} from "./native/ListViewElement";
export { default as BottomNavigationElement } from "./native/BottomNavigationElement";

export {
  registerElement,
  createElement,
  ViewNode,
  ElementNode,
  logger,
  LogLevel
} from "./basicdom";
import { ElementNode, ViewNode } from "./basicdom";
export {
  navigate,
  goBack,
  showModal,
  closeModal,
  isModalOpened,
  ShowModalOptions,
  NavigationOptions,
  BackNavigationOptions
} from "./navigation";

function installGlobalShims() {
  //expose our fake dom as global document for svelte components
  let window = global;

  window.window = global;
  window.document = new SvelteNativeDocument();

  // As of NS 6.3, the NS provided requestAnimationFrame breaks svelte by invoking the callback immediately
  // instead of next event loop, We force ours instead.
  Object.defineProperty(global, "requestAnimationFrame", {
    value: action => {
      setTimeout(() => action(window.performance.now()), 33); //about 30 fps
    },
    configurable: true,
    writable: true
  });

  window.getComputedStyle = node => {
    return node.nativeView.style;
  };

  window.performance = {
    now() {
      return Date.now();
    }
  };

  window.CustomEvent = class {
    constructor(name, detail = null) {
      this.eventName = name; //event name for nativescript
      this.type = name; // type for svelte
      this.detail = detail;
    }
  };

  window.HTMLElement = NativeViewElementNode;
  window.Element = ElementNode;
  window.Node = ViewNode;

  return window.document;
}

export const DomTraceCategory = "SvelteNativeDom";

function initializeLogger() {
  logger.setHandler((message, level) => {
    let traceLevel = Trace.messageType.log;
    switch (level) {
      case LogLevel.Debug:
        traceLevel = Trace.messageType.log;
        break;
      case LogLevel.Info:
        traceLevel = Trace.messageType.info;
        break;
      case LogLevel.Warn:
        traceLevel = Trace.messageType.warn;
        break;
      case LogLevel.Error:
        traceLevel = Trace.messageType.error;
        break;
    }
    if (Trace.isEnabled() || traceLevel == Trace.messageType.error) {
      Trace.write(message(), DomTraceCategory, traceLevel);
    }
  });
}

export function initializeDom() {
  initializeLogger();
  registerSvelteElements();
  registerNativeElements();
  return installGlobalShims();
}
initializeDom();
