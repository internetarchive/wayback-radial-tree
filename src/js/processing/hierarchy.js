import {surtToUrl} from './surt';


/**
 * @private
 *
 * traverse in depth from parent by path
 *
 * @param parent is current node
 * @param path is array of names
 * @returns {*}
 */
function buildHierarchInDepth(parent, path) {
  if (!path || path.length === 0) {
    return;
  }

  const [name, ...rest] = path;

  if (!name) {
    return;
  }

  let nextParent;

  if (parent.children) {
    nextParent = parent.children.filter(c => c.name === name)[0];
  } else {
    parent.children = [];
  }

  if (!nextParent) {
    nextParent = {
      name,
    };

    parent.children.push(nextParent);
  }

  buildHierarchInDepth(nextParent, rest);
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
export function buildHierarchy(fields, data, {targetField}) {
  return data.reduce((res, row) => {
    const value = fields.getValueByName(row, targetField);
    const [host, ...path] = value.split('/');
    res.name = surtToUrl(host);
    buildHierarchInDepth(res, path);
    return res;
  }, {});
}
