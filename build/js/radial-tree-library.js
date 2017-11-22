/*!
 * =============================================================
 * radial-tree-library v1.0.0 - Radial Tree Library for Wayback Machine
 * https://github.com/internetarchive/wayback-radial-tree#readme
 *
 * (c) 2017 - Eagle19243
 * =============================================================
 */

;(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['jquery'], factory);
  } else if (typeof exports === 'object') {
    module.exports = factory(require('jquery'));
  } else {
    root.Radial-tree = factory(root.jQuery);
  }
}(this, function($) {

return Radial-tree;
}));
