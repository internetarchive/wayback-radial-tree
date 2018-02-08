/**
 * drop protocol and tailing slash ('/')
 *
 * @param url
 * @returns {*}
 */
export default function (url) {
  url = url.replace(/(^\w+:|^)\/\//, '');
  if (url[url.length - 1] === '/') {
    url = url.slice(0, url.length - 1);
  }
  return url;
}
