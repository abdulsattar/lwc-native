import { Page } from "@nativescript/core";
import NativeViewElementNode from "./NativeViewElementNode";

export default class PageElement extends NativeViewElementNode {
  constructor() {
    super("page", Page);
  }
}
