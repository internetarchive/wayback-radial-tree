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
  for (let i = 0; i < path.length; i++) {
    const name = path[i];
    if (!name) continue;

    if (!currentParent.children) currentParent.children = [];
    if (!currentParent._childByName) {
      // Make it non-enumerable so it doesn't leak into output objects / tests.
      Object.defineProperty(currentParent, '_childByName', {
        value: new Map(),
        enumerable: false
      });
    }

    let nextParent = currentParent._childByName.get(name);
    if (!nextParent) {
      nextParent = { name };
      currentParent.children.push(nextParent);
      currentParent._childByName.set(name, nextParent);
    }
    currentParent = nextParent;
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
    const urlkey = fields.getValueByName(row, targetField);
    if (!urlkey) return res;

    const slashIdx = urlkey.indexOf('/');
    const host = slashIdx === -1 ? urlkey : urlkey.slice(0, slashIdx);
    if (!res.name) res.name = surtToUrl(host);

    const rest = slashIdx === -1 ? '' : urlkey.slice(slashIdx + 1);
    if (!rest) return res;

    buildHierarchInDepth(res, rest.split('/'));
    return res;
  }, {});
}
