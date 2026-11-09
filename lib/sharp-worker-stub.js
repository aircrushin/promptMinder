function unsupported(method) {
  const error = new Error(
    `sharp.${method} is unavailable on Cloudflare Workers. The native addon is omitted from the Worker bundle.`,
  );
  error.code = 'SHARP_UNSUPPORTED_ON_WORKERS';
  return error;
}

function sharp() {
  const chain = {
    metadata() {
      return Promise.reject(unsupported('metadata'));
    },
    resize() {
      return chain;
    },
    webp() {
      return chain;
    },
    jpeg() {
      return chain;
    },
    toBuffer() {
      return Promise.reject(unsupported('toBuffer'));
    },
  };
  return chain;
}

export default sharp;
