/*
In NativeScript, the app.js file is the entry point to your application.
You can use this file to perform app-level initialization, but the primary
purpose of the file is to pass control to the app’s first module.
*/

import { run, on, launchEvent } from "@nativescript/core/application";
import { Button, Frame, Page, StackLayout } from "@nativescript/core";
import { navigate, PageElement, registerElement } from "../dom";
import {
  createVM,
  connectRootElement,
  getComponentInternalDef
} from "@lwc/engine-core";
import Hello from "x/hello";
import { renderer } from "../engine-native/renderer";

try {
  run({
    create: () => {
      const tagName = "div";
      const rootFrame = document.createElement("frame");
      rootFrame.setAttribute("id", "app-root-frame");
      const page = new Page();
      page.style.backgroundColor = "#e4f2f8";
      const element = document.createElement("div");
      page.content = element.nativeView;

      console.log("ELEMENT", element.nativeView);
      const def = getComponentInternalDef(Hello);

      createVM(element, def, {
        mode: "open",
        owner: null,
        renderer,
        tagName
      });
      console.log("ELEMENT2", element.nativeElement);

      connectRootElement(element);

      /**
       * @type {Frame}
       */
      const nativeFrame = rootFrame.nativeView;

      nativeFrame.navigate({
        create: () => {
          // const button = document.createElement("button");
          // button.setAttribute("text", "Hello");
          // element.nativeView.addChild(button.nativeView);

          page.content = element.nativeView;
          return page;
        }
      });

      return rootFrame.nativeView;
    }
  });
} catch (e) {
  console.error(e);
}

/*
Do not place any code after the application has been started as it will not
be executed on iOS.
*/
