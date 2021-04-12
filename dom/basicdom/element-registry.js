import { normalizeElementName } from "./ViewNode";

const elementMap = {};

function registerElementResolver(elementName, entry, options) {
  const normalizedName = normalizeElementName(elementName);
  if (elementMap[normalizedName] && (!options || options.override !== true)) {
    console.error(`Element for ${normalizedName} already registered.`);
    return;
  }
  elementMap[normalizedName] = entry;
}

export function registerElement(elementName, resolver, options) {
  registerElementResolver(elementName, { resolver: resolver }, options);
}

export function createElement(elementName) {
  const normalizedName = normalizeElementName(elementName);
  const elementDefinition = elementMap[normalizedName];
  if (!elementDefinition) {
    throw new TypeError(`No known component for element ${elementName}.`);
  }
  return elementDefinition.resolver();
}
