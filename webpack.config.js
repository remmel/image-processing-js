const path = require('path')

module.exports = {
  mode: 'production',
  entry: {
    'pose-viewer': './src/pose-viewer/PoseViewerElt.js',
    'rgbd-viewer': './src/rgbd-viewer/entry.js',
    'raymarching': './src/raymarching/main.js',
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.[name].js',
  },
  performance: {
    maxEntrypointSize: 1024000,
    maxAssetSize: 1024000,
  },
  devServer: {
    contentBase: path.join(__dirname, 'dist'),
    compress: true,
    https: true,
    port: 9000,
    hot: true,
    host: '0.0.0.0'
  },
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  }
}
