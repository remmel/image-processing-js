const path = require('path')

module.exports = {
  mode: 'production',
  entry: './pose-viewer/main.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.pose-viewer.js',
  },
  performance: {
    maxEntrypointSize: 1024000,
    maxAssetSize: 1024000,
  },
  devServer: {
    contentBase: path.join(__dirname, 'dist'),
    compress: true,
    port: 9000,
    hot: true,
  },
}
