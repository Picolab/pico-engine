const fs = require("fs");
const webpack = require("webpack");
const MemoryFS = require("memory-fs");
const loaderUtils = require("loader-utils");

const base_worker = fs
  .readFileSync(require.resolve("ace-builds/src-min-noconflict/worker-json.js"))
  .toString();

module.exports = function(content, map, meta) {
  const callback = this.async();

  const memFS = new MemoryFS();

  const compiler = webpack({
    mode: "production",
    output: {
      path: "/",
      filename: "bundle.js"
    },
    entry: this.resourcePath,

    plugins: [
      new webpack.LoaderOptionsPlugin({
        options: {
          strictModuleExceptionHandling: true
        }
      })
    ]
  });

  compiler.outputFileSystem = memFS;
  compiler.run((err, stats) => {
    if (err) {
      callback(err);
      return;
    }
    if (stats.hasErrors()) {
      callback(stats.toJson().errors);
      return;
    }

    let worker_src = "";
    worker_src += base_worker + "\n\n";
    worker_src += memFS.readFileSync("/bundle.js", "utf8");

    const outputPath = loaderUtils.interpolateName(this, undefined, {
      context: this.rootContext,
      content: worker_src
    });

    this.emitFile(outputPath, worker_src);

    const publicPath = `__webpack_public_path__ + ${JSON.stringify(
      outputPath
    )}`;
    const src = `module.exports = ${publicPath};`;
    callback(null, src);
  });
};
