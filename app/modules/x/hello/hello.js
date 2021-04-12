import { LightningElement } from "@lwc/engine-core";
import tmpl from "./hello.mobile.html";
import { Utils } from "@nativescript/core";

export default class Hello extends LightningElement {
  get greeting() {
    return `Hello ${
      global.isAndroid ? "Android" : "iOS"
    }, from LWC. Your battery is ${this.getBattery()}%`;
  }

  getBattery() {
    if (global.isIOS) {
      UIDevice.currentDevice.isBatteryMonitoringEnabled = true;
      return UIDevice.currentDevice.batteryLevel;
    }
    const bm = Utils.android
      .getApplicationContext()
      .getSystemService(android.content.Context.BATTERY_SERVICE);
    const batLevel = bm.getIntProperty(
      android.os.BatteryManager.BATTERY_PROPERTY_CAPACITY
    );
    return batLevel;
  }
  render() {
    return tmpl;
  }
}
