const React = require('react');

function createIcon(name) {
  return function Icon(props) {
    return React.createElement('span', {
      'data-testid': `${name.toLowerCase()}-icon`,
      ...props,
    }, name);
  };
}

module.exports = new Proxy({}, {
  get(target, prop) {
    if (prop === '__esModule') {
      return true;
    }

    if (!target[prop]) {
      target[prop] = createIcon(String(prop));
    }

    return target[prop];
  },
});
