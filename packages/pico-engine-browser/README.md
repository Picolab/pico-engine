# pico-engine-browser

[![Build Status](https://travis-ci.org/Picolab/pico-engine.svg?branch=master)](https://travis-ci.org/Picolab/pico-engine)
[![Node version](https://img.shields.io/node/v/pico-engine.svg)](https://nodejs.org/en/download/)

An implementation of the pico-engine targeting web browsers

## How it works

This project bundles pico-engine into a single .js file that can be run inside a web browser.

`src/index.js` is the main entry point.

To build it

```
npm run build
```

The output is `dist/pico-engine.js` and  `dist/pico-engine.min.js`

## How to use it

```html
<script src="pico-engine.min.js"></script>
<script>
async function main(){
  // start it up
  var pe = await PicoEngine();
  window.pe = pe;// make it global so we can use it in the devtools console

  console.log('started');

  // now you can use pe (instance of pico-engine-core)
  // i.e.
  var res = await pe.registerRulesetURL('https://raw.githubusercontent.com/Picolab/pico-engine/master/test-rulesets/hello-world.krl');
  console.log(res);


  var rootECI = await pe.getRootECI()

  var myself = await pe.runQuery({
    eci: rootECI,
    rid: 'io.picolabs.wrangler',
    name: 'myself'
  })

  console.log('myself:', myself);
}
main().catch(console.error)
</script>
```

## Multiple engine instances

If you want to run more than one instance of pico-engine inside the same browser, you need to provide a browser-unique name.

For example:
```js
var pe1 = await PicoEngine('engine1');
var pe2 = await PicoEngine('engine2');
```

## License

MIT
