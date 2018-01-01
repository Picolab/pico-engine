var path = require("path");
var webpack = require("webpack");
var MemoryFS = require("memory-fs");


var base_worker = require("brace/worker/json").src;

module.exports = function(content, map, meta){
    var callback = this.async();

    var memFS = new MemoryFS();

    var compiler = webpack({
        entry: this.resourcePath,
        output: {
            path: "/",
            filename: "bundle.js",
        },
        plugins: [
            new webpack.LoaderOptionsPlugin({
                minimize: true
            }),
            new webpack.optimize.UglifyJsPlugin({
                sourceMap: true
            }),
        ],
    });

    compiler.outputFileSystem = memFS;
    compiler.run(function(err, stats){
        if(err){
            callback(err);
            return;
        }
        var worker_src = "";
        worker_src += base_worker + "\n\n";
        worker_src += memFS.readFileSync("/bundle.js", "utf8");

        var src = "";
        src += "module.exports=" + JSON.stringify(worker_src);
        callback(null, src);
    });
};
