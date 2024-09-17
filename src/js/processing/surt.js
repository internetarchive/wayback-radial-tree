/**
 * get SURT (Sort-friendly URI Reordering Transform)
 * https://github.com/internetarchive/surt
 * and convert it back to URL
 *
 * [!] current implementation works only with host part of SURT
 *
 * @param surt
 * @returns {String}
 */
export function surtToUrl (surt) {
  if (!surt) {
    return surt;
  }
  // drop last ')'
  return surt.slice(0, surt.length - 1).split(',').reverse().join('.');
}
