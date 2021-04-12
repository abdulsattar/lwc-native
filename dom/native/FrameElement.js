import { createElement, logger as log } from "../basicdom";
import { Frame } from "@nativescript/core";
import PageElement from "./PageElement";
import NativeViewElementNode from "./NativeViewElementNode";

export default class FrameElement extends NativeViewElementNode {
  constructor() {
    super("frame", Frame);
  }

  setAttribute(key, value) {
    if (key.toLowerCase() == "defaultpage") {
      log.debug(() => `loading page ${value}`);
      let dummy = createElement("fragment");
      let page = new value({ target: dummy, props: {} });
      this.nativeView.navigate({
        create: () => dummy.firstElement().nativeView
      });
      return;
    }
    super.setAttribute(key, value);
  }

  //In regular native script, Frame elements aren't meant to have children, we instead allow it to have one.. a page.. as a convenience
  // and set the instance as the default page by navigating to it.
  onInsertedChild(childNode, index) {
    //only handle page nodes
    if (!(childNode instanceof PageElement)) return;

    this.nativeView.navigate({
      create: () => childNode.nativeView,
      clearHistory: true
    });
  }
}
