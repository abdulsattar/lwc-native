import { StackLayout } from "@nativescript/core";
import NativeViewElementNode from "./NativeViewElementNode";

export default class DivElement extends NativeViewElementNode {
  constructor() {
    super("div", StackLayout);
  }
}
