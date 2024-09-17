import { surtToUrl } from './surt';

/**
 * @private
 *
 * traverse in depth from parent by path
 *
 * @param parent is current node
 * @param path is array of names
 * @returns {*}
 */
function buildHierarchInDepth (parent, path) {
  if (!path || path.length === 0) {
    return;
  }

  let currentParent = parent;
  let currentPath = path;

  while (currentPath.length > 0) {
    const [name, ...rest] = currentPath;

    if (!name) {
      return;
    }

    // Cache the children reference to avoid repeated lookups
    if (!currentParent.children) {
      currentParent.children = [];
    }

    // Find the child node or create a new one
    let nextParent = currentParent.children.find(child => child.name === name);

    if (!nextParent) {
      nextParent = { name };
      currentParent.children.push(nextParent);
    }

    // Move down the hierarchy
    currentParent = nextParent;
    currentPath = rest;
  }
}

/**
 * build hierarchical structure:
 *
 * {name: '{name}': children: [...]}
 *
 * which is valid for d3.hierarchy
 * from timemap site data
 *
 * @param fields -
 * @param data - source
 * @param targetField - which field we use to create hierarchy
 *
 * @returns {Object}
 */
export function buildHierarchy (fields, data, { targetField }) {
  return data.reduce((res, row) => {
    const value = fields.getValueByName(row, targetField);
    const [host, ...path] = value.split('/');
    res.name = surtToUrl(host);
    buildHierarchInDepth(res, path);
    return res;
  }, {});
}
