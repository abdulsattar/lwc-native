import { ListView } from "@nativescript/core";
import TemplateElement from "../svelte/TemplateElement";
import { createElement, logger as log } from "../basicdom";
import NativeViewElementNode from "./NativeViewElementNode";

export class SvelteKeyedTemplate {
  constructor(key, templateEl) {
    this._key = key;
    this._templateEl = templateEl;
  }

  get component() {
    return this._templateEl.component;
  }

  get key() {
    return this._key;
  }

  createView() {
    //create a proxy element to eventually contain our item (once we have one to render)
    //TODO is StackLayout the best choice here?
    log.debug(() => `creating view for key ${this.key}`);
    let wrapper = createElement("StackLayout");
    wrapper.setStyle("padding", 0);
    wrapper.setStyle("margin", 0);
    let nativeEl = wrapper.nativeView;
    nativeEl.__SvelteComponentBuilder__ = props => {
      let instance = new this.component({
        target: wrapper,
        props: props
      });
      nativeEl.__SvelteComponent__ = instance;
    };
    return nativeEl;
  }
}

export default class ListViewElement extends NativeViewElementNode {
  constructor() {
    super("listview", ListView);
    this.nativeView.on(ListView.itemLoadingEvent, args => {
      this.updateListItem(args);
    });
  }

  updateListItem(args) {
    let item;
    let listView = this.nativeView;
    let items = listView.items;

    if (args.index >= items.length) {
      log.error(
        () => `Got request for item at index that didn't exist ${args.index}`
      );
      return;
    }

    if (items.getItem) {
      item = items.getItem(args.index);
    } else {
      item = items[args.index];
    }

    if (!args.view || !args.view.__SvelteComponent__) {
      let component;

      if (args.view && args.view.__SvelteComponentBuilder__) {
        log.debug(
          () => `instantiating component in keyed view item at ${args.index}`
        );
        //now we have an item, we can create and mount this component
        args.view.__SvelteComponentBuilder__({ item });
        args.view.__SvelteComponentBuilder__ = null; //free the memory
        return;
      }

      log.debug(() => `creating default view for item at ${args.index}`);
      if (typeof listView.itemTemplates == "object") {
        component = listView.itemTemplates
          .filter(x => x.key == "default")
          .map(x => x.component)[0];
      }

      if (!component) {
        log.error(
          () => `Couldn't determine component to use for item at ${args.index}`
        );
        return;
      }
      let wrapper = createElement("ProxyViewContainer");
      let componentInstance = new component({
        target: wrapper,
        props: {
          item
        }
      });

      let nativeEl = wrapper.nativeView;
      nativeEl.__SvelteComponent__ = componentInstance;
      args.view = nativeEl;
    } else {
      let componentInstance = args.view.__SvelteComponent__;
      log.debug(
        () => `updating view for ${args.index} which is a ${args.view}`
      );
      componentInstance.$set({ item });
    }
  }

  onInsertedChild(childNode, index) {
    super.onInsertedChild(childNode, index);
    if (childNode instanceof TemplateElement) {
      let key = childNode.getAttribute("key") || "default";
      log.debug(() => `Adding template for key ${key}`);
      if (
        !this.nativeView.itemTemplates ||
        typeof this.nativeView.itemTemplates == "string"
      ) {
        this.nativeView.itemTemplates = [];
      }
      this.nativeView.itemTemplates.push(
        new SvelteKeyedTemplate(key, childNode)
      );
    }
  }

  onRemovedChild(childNode) {
    super.onRemovedChild(childNode);
    if (childNode instanceof TemplateElement) {
      let key = childNode.getAttribute("key") || "default";
      if (
        this.nativeView.itemTemplates &&
        typeof this.nativeView.itemTemplates != "string"
      ) {
        this.nativeView.itemTemplates = this.nativeView.itemTemplates.filter(
          t => t.key != key
        );
      }
    }
  }
}
