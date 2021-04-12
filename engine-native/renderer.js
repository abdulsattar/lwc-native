/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */
import {
  isUndefined,
  isNull,
  isBooleanAttribute,
  isGlobalHtmlAttribute,
  isAriaAttribute,
  create,
  StringToLowerCase,
  htmlPropertyToAttribute
} from "@lwc/shared";

function unsupportedMethod(name) {
  return function() {
    throw new TypeError(`"${name}" is not supported in this environment`);
  };
}

function createElement(name, namespace) {
  return document.createElement(name);
}

const registry = create(null);
const reverseRegistry = new WeakMap();

function registerCustomElement(name, ctor) {
  if (name !== StringToLowerCase.call(name) || registry[name]) {
    throw new TypeError(`Invalid Registration`);
  }
  registry[name] = ctor;
  reverseRegistry.set(ctor, name);
}

export const renderer = {
  ssr: false,
  syntheticShadow: false,
  native: true,

  insert(node, parent, anchor) {
    parent.appendChild(node);
  },

  remove(node, parent) {
    parent.remove(node);
  },

  createElement,

  createText(content) {
    return document.createTextNode(content);
  },

  nextSibling(node) {
    return node.nextSibling();
  },

  attachShadow(element, config) {
    return element;
  },

  getProperty(node, key) {
    if (key in node) {
      return node[key];
    }

    if (node.type === HostNodeType.Element) {
      const attrName = htmlPropertyToAttribute(key);

      // Handle all the boolean properties.
      if (isBooleanAttribute(attrName, node.name)) {
        return this.getAttribute(node, attrName) ?? false;
      }

      // Handle global html attributes and AOM.
      if (isGlobalHtmlAttribute(attrName) || isAriaAttribute(attrName)) {
        return this.getAttribute(node, attrName);
      }

      // Handle special elements live bindings. The checked property is already handled above
      // in the boolean case.
      if (node.name === "input" && key === "value") {
        return this.getAttribute(node, "value") ?? "";
      }
    }

    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.error(`Unexpected "${key}" property access from the renderer`);
    }
  },

  setProperty(node, key, value) {
    if (key in node) {
      return (node[key] = value);
    }

    if (node.type === HostNodeType.Element) {
      const attrName = htmlPropertyToAttribute(key);

      // Handle all the boolean properties.
      if (isBooleanAttribute(attrName, node.name)) {
        return value === true
          ? this.setAttribute(node, attrName, "")
          : this.removeAttribute(node, attrName);
      }

      // Handle global html attributes and AOM.
      if (isGlobalHtmlAttribute(attrName) || isAriaAttribute(attrName)) {
        return this.setAttribute(node, attrName, value);
      }

      // Handle special elements live bindings. The checked property is already handled above
      // in the boolean case.
      if (node.name === "input" && attrName === "value") {
        return isNull(value) || isUndefined(value)
          ? this.removeAttribute(node, "value")
          : this.setAttribute(node, "value", value);
      }
    }

    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.error(
        `Unexpected attempt to set "${key}=${value}" property from the renderer`
      );
    }
  },

  setText(node, content) {
    node.setText(content);
    // if (node.type === HostNodeType.Text) {
    //     node.value = content;
    // } else if (node.type === HostNodeType.Element) {
    //     node.children = [
    //         {
    //             type: HostNodeType.Text,
    //             parent: node,
    //             value: content,
    //         },
    //     ];
    // }
  },

  getAttribute(element, name, namespace = null) {
    return element.getAttribute(name);
    const attribute = element.attributes.find(
      attr => attr.name === name && attr.namespace === namespace
    );
    return attribute ? attribute.value : null;
  },

  setAttribute(element, name, value, namespace = null) {
    return element.setAttribute(name, value);
    const attribute = element.attributes.find(
      attr => attr.name === name && attr.namespace === namespace
    );

    if (isUndefined(attribute)) {
      element.attributes.push({
        name,
        namespace,
        value: String(value)
      });
    } else {
      attribute.value = value;
    }
  },

  removeAttribute(element, name, namespace) {
    return element.removeAttribute(name);
    element.attributes = element.attributes.filter(
      attr => attr.name !== name && attr.namespace !== namespace
    );
  },

  getClassList(element) {
    return element.classList;
  },

  setCSSStyleProperty(element, name, value) {
    return;
  },

  isConnected(node) {
    return !isNull(node.parent);
  },

  insertGlobalStylesheet() {
    // Noop on SSR (for now). This need to be reevaluated whenever we will implement support for
    // synthetic shadow.
  },

  addEventListener() {
    // Noop on SSR.
  },
  removeEventListener() {
    // Noop on SSR.
  },

  dispatchEvent: unsupportedMethod("dispatchEvent"),
  getBoundingClientRect: unsupportedMethod("getBoundingClientRect"),
  querySelector: unsupportedMethod("querySelector"),
  querySelectorAll: unsupportedMethod("querySelectorAll"),
  getElementsByTagName: unsupportedMethod("getElementsByTagName"),
  getElementsByClassName: unsupportedMethod("getElementsByClassName"),

  defineCustomElement(name, constructor, _options) {
    registerCustomElement(name, constructor);
  },
  getCustomElement(name) {
    return registry[name];
  },
  HTMLElement: global.HTMLElement
};
