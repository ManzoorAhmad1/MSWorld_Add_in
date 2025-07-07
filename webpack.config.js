const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
// Polyfill for citation-js v0.5.0 (requires querystring in browser)
const webpack = require('webpack');

module.exports = {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
    clean: true,
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', '@babel/preset-react']
          }
        }
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  },
  resolve: {
  fallback: {
    "querystring": require.resolve("querystring-es3"),
    "process": require.resolve("process/browser")
  }
},
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html'
    }),
    // Polyfill for querystring (citation-js v0.5.0)
    new webpack.ProvidePlugin({
      process: 'process/browser',
    })
  ],
  devServer: {
    port: 3001,
    hot: true,
    open: true
  }
};
