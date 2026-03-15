// public/browser/engines/engine-croxy.js

export const Engine = {
  buildUrl(input) {
    // Your existing URL resolver (from browser.js)
    const url = resolveUrl(input);

    // Croxy-style UV endpoint
    return `https://methalo.online/service/?url=${encodeURIComponent(url)}`;
  }
};
