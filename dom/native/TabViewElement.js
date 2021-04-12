import { logger as log } from "../basicdom";
import { TabView, TabViewItem } from "@nativescript/core";
import NativeViewElementNode from "./NativeViewElementNode";

export default class TabViewElement extends NativeViewElementNode {
  constructor() {
    super("TabView", TabView);
    this.needs_update = false;
  }

  doUpdate() {
    let items = this.childNodes
      .filter(
        x =>
          x instanceof NativeViewElementNode &&
          x.nativeView instanceof TabViewItem
      )
      .map(x => x.nativeView);
    log.debug(() => `updating tab items. now has ${items.length} items`);
    this.nativeView.items = items;
  }

  onInsertedChild(childNode, index) {
    try {
      //We only want to handle TabViewItem and only if it is the last item!
      if (
        !(
          childNode instanceof NativeViewElementNode &&
          childNode.nativeView instanceof TabViewItem
        )
      )
        return super.onInsertedChild(childNode, index);

      this.needs_update = true;

      //resolve after this event loop to catch all added tabviewitems in one update, and to handle the fact that svelte adds the
      //tabviewitem to tabview while it is still empty which causes problems.
      Promise.resolve()
        .then(() => {
          if (this.needs_update) {
            this.doUpdate();
            this.needs_update = false;
          }
        })
        .catch(e => console.error(e));
    } catch (e) {
      console.error(e);
    }
  }

  onRemovedChild(childNode) {
    if (
      !(
        childNode instanceof NativeViewElementNode &&
        childNode.nativeView instanceof TabViewItem
      )
    )
      return super.onRemovedChild(childNode);
    console.error(
      "Removing a TabViewItem is not supported atm see:  https://github.com/NativeScript/nativescript-angular/issues/621"
    );
  }
}
