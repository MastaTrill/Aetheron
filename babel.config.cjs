const { pathToFileURL } = require('url');

// Jest runs the ESM sources through babel-jest as CommonJS, where any
// import.meta reference is a syntax error. Replace import.meta.url with
// the file's own file:// URL string so modules that derive __filename
// and __dirname from it keep working under Jest. Native ESM execution
// (node server) never goes through Babel and is unaffected.
function importMetaUrlToFileUrl() {
  return {
    name: 'import-meta-url-to-file-url',
    visitor: {
      MemberExpression(path, state) {
        const { node } = path;
        if (
          node.object &&
          node.object.type === 'MetaProperty' &&
          node.object.meta.name === 'import' &&
          node.object.property.name === 'meta' &&
          node.property.name === 'url'
        ) {
          const filename = state.file.opts.filename;
          if (filename) {
            path.replaceWithSourceString(JSON.stringify(pathToFileURL(filename).href));
          }
        }
      }
    }
  };
}

module.exports = {
  presets: [
    ['@babel/preset-env', {
      targets: { node: 'current' }
    }],
    ['@babel/preset-react', { runtime: 'automatic' }]
  ],
  plugins: [importMetaUrlToFileUrl]
};
