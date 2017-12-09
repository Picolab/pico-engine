# krl-editor

In browser editor for KRL

## How to help

```
$ npm start
```
Then open your browser to [http://localhost:9090/](http://localhost:9090/) It will hot-reload when you make changes.

`src/mode.js` - the syntax highlighter and indenter.

`src/worker.js` - the watcher that constantly re-compiles src and reports errors.

`dist/index.html` - this is the sample html file that the dev server uses


To build krl-editor.js and copy it over to pico-engine:
```
$ npm run build
```
