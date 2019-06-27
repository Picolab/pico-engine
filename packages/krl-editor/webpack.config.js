var path = require('path')
var webpack = require('webpack')

var isProd = process.env.NODE_ENV === 'production'

var conf = {
  mode: isProd ? 'production' : 'development',
  entry: {
    main: './src/index.js'
  },

  output: {
    path: path.resolve(__dirname, 'dist'),
    publicPath: '/',
    filename: isProd
      ? 'krl-editor.min.js'
      : 'krl-editor.js'
  },

  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          { loader: 'style-loader' },
          { loader: 'css-loader' }
        ]
      }
    ]
  },

  plugins: [],

  resolveLoader: {
    alias: {
      'ace-webworker-loader': path.join(__dirname, 'ace-webworker-loader.js')
    }
  },

  devServer: {
    hot: true,
    port: 9090,
    inline: true,
    stats: 'minimal',
    contentBase: path.join(__dirname, 'dist')
  }
}

if (isProd) {
} else {
  conf.plugins.push(new webpack.HotModuleReplacementPlugin())
}

module.exports = conf
