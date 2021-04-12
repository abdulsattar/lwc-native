import { logger as log } from "../basicdom";
import { TabContentItem } from "@nativescript/core";
import NativeViewElementNode from "./NativeViewElementNode";

export default class BaseTabNavigationElement extends NativeViewElementNode {
  constructor(tagName, viewClass) {
    super(tagName, viewClass);
    this.pendingInserts = [];
  }

  onInsertedChild(childNode, index) {
    try {
      if (
        childNode instanceof NativeViewElementNode &&
        childNode.nativeView instanceof TabContentItem
      ) {
        log.debug(() => `adding tab content to nav`);
        this.pendingInserts.push(childNode.nativeView);
        //wait for next turn so that any content for our tab is attached to the dom
        Promise.resolve().then(() => {
          if (this.pendingInserts.length == 0) return;
          let items = (this.nativeView.items || []).concat(this.pendingInserts);
          this.pendingInserts = [];
          this.nativeView.items = [];
          this.nativeView.items = items;
        });
        return;
      }
    } catch (e) {
      console.error(e);
    }
    super.onInsertedChild(childNode, index);
  }

  onRemovedChild(childNode) {
    try {
      if (
        childNode instanceof NativeViewElementNode &&
        childNode.nativeView instanceof TabContentItem
      ) {
        log.debug(() => `removing content item from nav`);
        let items = (this.nativeView.items || []).filter(
          i => i != childNode.nativeView
        );
        this.nativeView.items = [];
        this.nativeView.items = items;
        return;
      }
    } catch (e) {
      console.error(e);
    }
    super.onRemovedChild(childNode);
  }
}
