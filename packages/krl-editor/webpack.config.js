var path = require("path");
var webpack = require("webpack");

var is_build_mode = process.env.NODE_ENV === "production";

var conf = {
    devtool: "eval",
    entry: {
        main: "./src/index.js",
    },

    output: {
        path: path.resolve(__dirname, "dist"),
        publicPath: "/",
        filename: "krl-editor.js"
    },

    module: {
        rules: [
            {
                test: /\.css$/,
                use: [
                    {loader: "style-loader"},
                    {loader: "css-loader"},
                ]
            },
        ],
    },

    plugins: [],

    resolveLoader: {
        alias: {
            "ace-webworker-loader": path.join(__dirname, "ace-webworker-loader.js"),
        }
    },

    devServer: {
        hot: true,
        port: 9090,
        inline: true,
        stats: "minimal",
        contentBase: path.join(__dirname, "dist"),
    }
};

if(is_build_mode){
    conf.devtool = "source-map";

    conf.plugins = conf.plugins.concat([
        new webpack.LoaderOptionsPlugin({
            minimize: true
        }),
        new webpack.optimize.UglifyJsPlugin({
            sourceMap: true
        })
    ]);
}else{
    conf.plugins.push(new webpack.HotModuleReplacementPlugin());
}

module.exports = conf;
