import {
  ViewBase,
  View,
  NavigatedData,
  NavigationTransition,
  Frame,
  BackstackEntry
} from "@nativescript/core";
import FrameElement from "./native/FrameElement";
import { createElement, logger as log } from "./basicdom";
import PageElement from "./native/PageElement";
import NativeViewElementNode from "./native/NativeViewElementNode";

function resolveFrame(frameSpec) {
  let targetFrame;
  if (!frameSpec) targetFrame = Frame.topmost();
  if (frameSpec instanceof FrameElement) targetFrame = frameSpec.nativeView;
  if (frameSpec instanceof Frame) targetFrame = frameSpec;
  if (typeof frameSpec == "string") {
    targetFrame = Frame.getFrameById(frameSpec);
    if (!targetFrame)
      log.error(() => `Navigate could not find frame with id ${frameSpec}`);
  }
  return targetFrame;
}

function resolveComponentElement(tag, props) {
  let dummy = createElement("fragment");
  let elm = document.createElement(tag);
  let element = dummy.firstElement();
  return { element, pageInstance };
}

export function navigate(options) {
  let { frame, tag, props = {}, ...navOptions } = options;

  let targetFrame = resolveFrame(frame);

  if (!targetFrame) {
    throw new Error(
      "navigate requires frame option to be a native Frame, a FrameElement, a frame Id, or null"
    );
  }

  let { element, pageInstance } = resolveComponentElement(tag, props);

  if (!(element instanceof PageElement))
    throw new Error(
      "navigate requires a svelte component with a page element at the root"
    );

  let nativePage = element.nativeView;

  const handler = args => {
    if (args.isBackNavigation) {
      nativePage.off("navigatedFrom", handler);
      pageInstance.$destroy();
    }
  };
  nativePage.on("navigatedFrom", handler);

  targetFrame.navigate({
    ...navOptions,
    create: () => nativePage
  });

  return pageInstance;
}

export function goBack(options) {
  let targetFrame = resolveFrame(options.frame);
  if (!targetFrame) {
    throw new Error(
      "goback requires frame option to be a native Frame, a FrameElement, a frame Id, or null"
    );
  }
  let backStackEntry = null;
  if (options.to) {
    backStackEntry = targetFrame.backStack.find(
      e => e.resolvedPage === options.to.nativeView
    );
    if (!backStackEntry) {
      throw new Error(
        "Couldn't find the destination page in the frames backstack"
      );
    }
  }
  return targetFrame.goBack(backStackEntry);
}

const modalStack = [];

export function showModal(modalOptions) {
  let { page, props = {}, ...options } = modalOptions;

  //Get this before any potential new frames are created by component below
  let modalLauncher = Frame.topmost().currentPage;

  let componentInstanceInfo = resolveComponentElement(page, props);
  let modalView = componentInstanceInfo.element.nativeView;

  return new Promise((resolve, reject) => {
    let resolved = false;
    const closeCallback = result => {
      if (resolved) return;
      modalStack.pop();
      resolved = true;
      try {
        componentInstanceInfo.pageInstance.$destroy(); //don't let an exception in destroy kill the promise callback
      } finally {
        resolve(result);
      }
    };
    modalStack.push(componentInstanceInfo);
    modalLauncher.showModal(modalView, {
      ...options,
      context: {},
      closeCallback
    });
  });
}

export function closeModal(result) {
  let modalPageInstanceInfo = modalStack[modalStack.length - 1];
  modalPageInstanceInfo.element.nativeView.closeModal(result);
}

export function isModalOpened() {
  return modalStack.length > 0;
}
