import window from "globals/window";

import pinExpressions from "moduleOverrides/pinExpressions";

/* This script is loaded at document_start, before the page's scripts, to give it 
time to set ALMOND_OVERRIDES and replace module definitions */

/* As an example, we inject the above worker code and replace "A" with "B" in the settings view*/
const defineOverrides = {
  ...pinExpressions,
} as {
  [key: string]: (definition: any, dependencies: string[]) => Function;
};

// assumes `oldDefine` is defined before `newDefine` is needed
let oldDefine!: typeof window["define"];

function newDefine(
  moduleName: string,
  dependencies: string[],
  definition: Function
) {
  if (moduleName in defineOverrides) {
    // override should either be `{dependencies, definition}` or just `definition`
    console.debug("transforming", moduleName);
    const override = defineOverrides[moduleName](definition, dependencies);
    definition = override;
  }
  return oldDefine(moduleName, dependencies, definition);
}

// without this, you get Error: touchtracking missing jquery
newDefine.amd = {
  jQuery: true,
};

if (window.ALMOND_OVERRIDES !== undefined) {
  window.alert(
    "Warning: you have a script installed that overrides modules definitions. " +
      "This is incompatible with some features of DesModder, " +
      "so try disabling Tampermonkey scripts."
  );
}
// trick to override `define`s
window.ALMOND_OVERRIDES = new Proxy(
  {},
  {
    get(target, prop, receiver) {
      if (prop === "define") {
        oldDefine = window.define;
        return newDefine;
      } else {
        return Reflect.get(target, prop, receiver);
      }
    },
  }
);
