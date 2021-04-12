import { logger as log, registerElement, logger } from "../basicdom";
import { isAndroid, isIOS, ObservableArray } from "@nativescript/core";
import ElementNode from "../basicdom/ElementNode";

export const NativeElementPropType = {
  Value: "value",
  Array: "array",
  ObservableArray: "observable-array"
};

function setOnArrayProp(parent, value, propName, index, build = null) {
  logger.debug(() => `setOnArrayProp ${propName} index: ${index}`);
  let current = parent[propName];
  if (!current || !current.push) {
    parent[propName] = build ? build(value) : [value];
  } else {
    if (current instanceof ObservableArray) {
      if (index > -1) {
        current.splice(index, 0, value);
      } else {
        current.push(value);
      }
    } else {
      if (index > -1) {
        const newArr = current.slice();
        newArr.splice(index, 0, value);
        parent[propName] = newArr;
      } else {
        parent[propName] = [...current, value];
      }
    }
  }
}

function removeFromArrayProp(parent, value, propName) {
  let current = parent[propName];
  if (!current || !current.splice) {
    return;
  }

  let idx = current.indexOf(value);
  if (idx < 0) return;

  if (current instanceof ObservableArray) {
    current.splice(idx, 1);
  } else {
    const newArr = current.slice();
    newArr.splice(idx, 1);
    parent[propName] = newArr;
  }
}

const _normalizedKeys = new Map();

function getNormalizedKeysForObject(obj, knownPropNames) {
  let proto = Object.getPrototypeOf(obj);
  let m = _normalizedKeys.get(proto);

  if (m) return m;

  //calculate our prop names
  let props = new Map();
  _normalizedKeys.set(proto, props);

  //include known props
  knownPropNames.forEach(p => props.set(p.toLowerCase(), p));

  //infer the rest from the passed object (including updating any incorrect known prop names if found)
  let item = obj;
  while (item) {
    Object.getOwnPropertyNames(item)
      .filter(
        p =>
          !p.startsWith("_") && !p.startsWith("css:") && p.indexOf("-") === -1
      )
      .map(p => props.set(p.toLowerCase(), p));
    item = Object.getPrototypeOf(item);
  }

  return props;
}

function normalizeKeyFromObject(obj, key) {
  let lowerkey = key.toLowerCase();
  for (let p in obj) {
    if (p.toLowerCase() == lowerkey) {
      return p;
    }
  }
  return key;
}

// Implements an ElementNode that wraps a NativeScript object. It uses the object as the source of truth for its attributes
export default class NativeElementNode extends ElementNode {
  constructor(tagName, elementClass, setsParentProp = null, propConfig = {}) {
    super(tagName);
    this.propConfig = propConfig;
    this.propAttribute = setsParentProp;
    try {
      this._nativeElement = new elementClass();
    } catch (err) {
      throw new Error(
        `[NativeElementNode] failed to created native element for tag ${tagName}: ${err}`
      );
    }
    this._normalizedKeys = getNormalizedKeysForObject(
      this._nativeElement,
      Object.keys(this.propConfig)
    );

    this._nativeElement.__SvelteNativeElement__ = this;
    log.debug(() => `created ${this} ${this._nativeElement}`);
  }

  get nativeElement() {
    return this._nativeElement;
  }

  set nativeElement(el) {
    if (this._nativeElement) {
      throw new Error(`Can't overwrite native element.`);
    }

    this._nativeElement = el;
  }

  getAttribute(fullkey) {
    let getTarget = this.nativeElement;

    let keypath = fullkey.split(".");
    let resolvedKeys = [];

    while (keypath.length > 0) {
      if (!getTarget) return null;

      let key = keypath.shift();

      if (resolvedKeys.length == 0) {
        key = this._normalizedKeys.get(key) || key;
      } else {
        key = normalizeKeyFromObject(getTarget, key);
      }

      resolvedKeys.push(key);

      if (keypath.length > 0) {
        getTarget = getTarget[key];
      } else {
        return getTarget[key];
      }
    }

    return null;
  }

  onInsertedChild(childNode, index) {
    super.onInsertedChild(childNode, index);
    // support for the prop: shorthand for setting parent property to native element
    if (!(childNode instanceof NativeElementNode)) return;
    let propName = childNode.propAttribute;
    if (!propName) return;

    //Special case Array and Observable Array keys
    propName = this._normalizedKeys.get(propName) || propName;

    if (
      !this.propConfig[propName] ||
      this.propConfig[propName] == NativeElementPropType.Value
    ) {
      this.setAttribute(propName, childNode);
      return;
    }

    //our array index is based on how many items with the same prop attribute come before us
    const allPropSetters = this.childNodes.filter(
      n =>
        n instanceof NativeElementNode &&
        n.propAttribute &&
        n.propAttribute.toLowerCase() == propName.toLowerCase()
    );
    const myIndex = allPropSetters.indexOf(childNode);

    switch (this.propConfig[propName]) {
      case NativeElementPropType.Array:
        setOnArrayProp(
          this.nativeElement,
          childNode.nativeElement,
          propName,
          myIndex
        );
        return;
      case NativeElementPropType.ObservableArray:
        setOnArrayProp(
          this.nativeElement,
          childNode.nativeElement,
          propName,
          myIndex,
          v => new ObservableArray(v)
        );
        return;
    }
  }

  onRemovedChild(childNode) {
    if (!(childNode instanceof NativeElementNode)) return;
    let propName = childNode.propAttribute;
    if (!propName) return;
    //Special case Array and Observable Array keys
    propName = this._normalizedKeys.get(propName) || propName;

    switch (this.propConfig[propName]) {
      case NativeElementPropType.Array:
      case NativeElementPropType.ObservableArray:
        removeFromArrayProp(
          this.nativeElement,
          childNode.nativeElement,
          propName
        );
        return;
      default:
        this.setAttribute(propName, null);
    }

    super.onRemovedChild(childNode);
  }

  setAttribute(fullkey, value) {
    const nv = this.nativeElement;
    let setTarget = nv;

    // normalize key
    if (isAndroid && fullkey.startsWith("android:")) {
      fullkey = fullkey.substr(8);
    }
    if (isIOS && fullkey.startsWith("ios:")) {
      fullkey = fullkey.substr(4);
    }

    if (fullkey.startsWith("prop:")) {
      this.propAttribute = fullkey.substr(5);
      return;
    }

    //we might be getting an element from a propertyNode eg page.actionBar, unwrap
    if (value instanceof NativeElementNode) {
      value = value.nativeElement;
    }

    let keypath = fullkey.split(".");
    let resolvedKeys = [];

    while (keypath.length > 0) {
      if (!setTarget) return;
      let key = keypath.shift();

      // normalize to correct case
      if (resolvedKeys.length == 0) {
        key = this._normalizedKeys.get(key) || key;
      } else {
        key = normalizeKeyFromObject(setTarget, key);
      }

      resolvedKeys.push(key);

      if (keypath.length > 0) {
        setTarget = setTarget[key];
      } else {
        try {
          log.debug(
            () => `setAttr value ${this} ${resolvedKeys.join(".")} ${value}`
          );
          setTarget[key] = value;
        } catch (e) {
          // ignore but log
          log.error(
            () =>
              `set attribute threw an error, attr:${key} on ${this._tagName}: ${e.message}`
          );
        }
      }
    }
  }
}

export function registerNativeConfigElement(
  elementName,
  resolver,
  parentProp = null,
  propConfig = {}
) {
  registerElement(
    elementName,
    () => new NativeElementNode(elementName, resolver(), parentProp, propConfig)
  );
}
