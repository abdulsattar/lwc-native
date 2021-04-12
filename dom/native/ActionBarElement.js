import { ActionBar } from "@nativescript/core";
import NativeViewElementNode from "./NativeViewElementNode";
import NativeElementNode from "./NativeElementNode";

export default class ActionBarElement extends NativeViewElementNode {
  constructor() {
    super("ActionBar", ActionBar);
  }

  onInsertedChild(childNode, index) {
    //ActionItems isn't an array or ObservableArray, it is a special ActionItems type, so we handle it here
    if (childNode instanceof NativeElementNode) {
      let propName = childNode.propAttribute;
      if (propName) {
        propName = this._normalizedKeys.get(propName) || propName;
        if (propName.toLowerCase() == "actionitems") {
          this.nativeView.actionItems.addItem(childNode.nativeElement);
          return; //skip rest of the processing.
        }
      }
    }

    super.onInsertedChild(childNode, index);
  }

  onRemovedChild(childNode) {
    if (childNode instanceof NativeElementNode) {
      let propName = childNode.propAttribute;
      if (propName) {
        propName = this._normalizedKeys.get(propName) || propName;
        if (propName.toLowerCase() == "actionitems") {
          this.nativeView.actionItems.removeItem(childNode.nativeElement);
          return; //skip rest of the processing.
        }
      }
    }

    super.onRemovedChild(childNode);
  }
}
