export function debounce(func, wait) {
  if (typeof func !== 'function') {
    throw new TypeError('Expected a function');
  }

  let timeout = null;

  function debounced(...args) {
    if (timeout !== null) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(() => {
      timeout = null;
      func.apply(this, args);
    }, wait);
  }

  debounced.cancel = () => {
    if (timeout !== null) {
      clearTimeout(timeout);
      timeout = null;
    }
  };

  return debounced;
}
