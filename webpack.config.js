const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');
module.exports = {
  entry: [
    'webpack-dev-server/client?http://localhost:3001',
    './src/index.js',
  ],
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
    clean: true,
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/, // Include both .js and .jsx files
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              ['@babel/preset-env', { targets: { ie: '11' }, useBuiltIns: 'usage', corejs: 3 }],
              '@babel/preset-react',
            ],
          },
        },
      },
      {
        test: /\.css$/,
        use: [
          'style-loader',
          'css-loader',
          {
            loader: 'postcss-loader',
            options: {
              postcssOptions: {
                plugins: [
                  require('tailwindcss'),
                  require('autoprefixer'),
                ],
              },
            },
          },
        ],
      },
      {
        test: /\.(csl|xml)$/i,
        type: "asset/source",
      },
    ],
  },
  resolve: {
    fallback: {
      querystring: require.resolve('querystring-es3'),
      process: require.resolve('process/browser.js'),
      buffer: require.resolve('buffer/'),
      util: require.resolve('util/'),
    },
    extensions: ['.js', '.jsx'], // Ensure .jsx files are resolved
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html',
    }),
    new webpack.ProvidePlugin({
      process: 'process/browser.js',
    }),
  ],
  ignoreWarnings: [
    {
      message: /Should not import the named export/,
    },
  ],
  devServer: {
    historyApiFallback: {
      index: '/index.html',
    },
    port: 3001,
    hot: false,
    liveReload: true,
    open: true,
    allowedHosts: 'all',
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
    client: {
      webSocketTransport: 'ws',
      overlay: true,
      logging: 'info',
    },
  },
};