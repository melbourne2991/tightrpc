module.exports = function(fileInfo, api) {
  if (!fileInfo.path.endsWith('.js')) {
    return fileInfo.source; // Do nothing if it's not a JS file
  }

  const j = api.jscodeshift;

  const root = j(fileInfo.source);

  // Process ImportDeclaration
  root.find(j.ImportDeclaration).forEach(updatePath);

  // Process ExportNamedDeclaration and ExportAllDeclaration with a source
  root.find(j.ExportNamedDeclaration).filter(path => !!path.node.source).forEach(updatePath);
  root.find(j.ExportAllDeclaration).filter(path => !!path.node.source).forEach(updatePath);

  return root.toSource();

  function updatePath(path) {
    const value = path.node.source.value;
    if (value && value.endsWith('.ts')) {
      path.node.source.value = value.replace('.ts', '.js');
    }
  }
};
