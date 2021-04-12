import {
  DocumentNode,
  createElement,
  TextNode,
  logger as log
} from "../basicdom";

export default class SvelteNativeDocument extends DocumentNode {
  constructor() {
    super();

    this.head = createElement("head");
    this.appendChild(this.head);

    log.debug(() => `created ${this}`);
  }

  createTextNode(text) {
    const el = new TextNode(text);
    log.debug(() => `created ${el}`);
    return el;
  }

  createElementNS(namespace, tagName) {
    return this.createElement(tagName);
  }

  createEvent(type) {
    let e = {};
    e.initCustomEvent = (type, ignored1, ignored2, detail) => {
      e.type = type;
      e.detail = detail;
      e.eventName = type;
    };
    return e;
  }
}
