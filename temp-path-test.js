const { pathToRegexp } = require('path-to-regexp');
const patterns = ['*', '/*', '/:all*', '/:all(.*)', '/:all(.*)?', '/:all(*)', '/:all(*)?'];
for (const p of patterns) {
  try {
    pathToRegexp(p);
    console.log('OK', p);
  } catch (e) {
    console.log('ERR', p, e.message);
  }
}
