import CommentNode from "./CommentNode";
import ElementNode from "./ElementNode";
import ViewNode, { elementIterator } from "./ViewNode";
import TextNode from "./TextNode";
import PropertyNode from "./PropertyNode";
import { createElement } from "./element-registry";

export default class DocumentNode extends ViewNode {
  constructor() {
    super();
    this.tagName = "docNode";
    this.nodeType = 9;
  }

  createComment(text) {
    return new CommentNode(text);
  }

  createPropertyNode(tagName, propertyName) {
    return new PropertyNode(tagName, propertyName);
  }

  createElement(tagName) {
    if (tagName.indexOf(".") >= 0) {
      let bits = tagName.split(".", 2);
      return this.createPropertyNode(bits[0], bits[1]);
    }
    return createElement(tagName);
  }

  createElementNS(namespace, tagName) {
    return this.createElement(tagName);
  }

  createTextNode(text) {
    return new TextNode(text);
  }

  getElementById(id) {
    for (let el of elementIterator(this)) {
      if (el.nodeType === 1 && el.id === id) return el;
    }
  }

  dispatchEvent(event) {
    //Svelte dev fires these for tool support
  }
}
