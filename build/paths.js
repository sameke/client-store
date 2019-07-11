var appRoot = 'src/';
var outputRoot = 'dist/';
var exporSrvRoot = 'export/'

module.exports = {
  root: appRoot,
  source: appRoot + '**/*.ts',
  move: [
    appRoot + '**/*.json'
  ],
  moveWeb: [
    './config.js'
  ],
  style: 'styles/**/*.css',
  output: outputRoot,
  outputCommonjs: outputRoot + 'commonjs/',
  outputWeb: outputRoot + 'amd/',
  exportSrv: exporSrvRoot
}
