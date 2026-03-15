// This script runs inside the proxied page
(function() {
  const PROXY_PREFIX = "/proxy?url=";

  function encode(u) {
    return encodeURIComponent(u);
  }

  function proxify(url) {
    try {
      const abs = new URL(url, window.location.href).toString();
      return PROXY_PREFIX + encode(abs);
    } catch {
      return url;
    }
  }

  // Override window.location.assign
  const originalAssign = window.location.assign.bind(window.location);
  window.location.assign = function(url) {
    originalAssign(proxify(url));
  };

  // Override window.location.replace
  const originalReplace = window.location.replace.bind(window.location);
  window.location.replace = function(url) {
    originalReplace(proxify(url));
  };

  // Override pushState
  const originalPush = history.pushState.bind(history);
  history.pushState = function(state, title, url) {
    if (url) url = proxify(url);
    return originalPush(state, title, url);
  };

  // Override replaceState
  const originalReplaceState = history.replaceState.bind(history);
  history.replaceState = function(state, title, url) {
    if (url) url = proxify(url);
    return originalReplaceState(state, title, url);
  };

  // Override fetch
  const originalFetch = window.fetch;
  window.fetch = function(resource, init) {
    if (typeof resource === "string") {
      resource = proxify(resource);
    } else if (resource instanceof Request) {
      resource = new Request(proxify(resource.url), resource);
    }
    return originalFetch(resource, init);
  };

  // Override XHR
  const OriginalXHR = window.XMLHttpRequest;
  function ProxiedXHR() {
    const xhr = new OriginalXHR();

    const originalOpen = xhr.open;
    xhr.open = function(method, url, ...rest) {
      url = proxify(url);
      return originalOpen.call(xhr, method, url, ...rest);
    };

    return xhr;
  }
  window.XMLHttpRequest = ProxiedXHR;

})();
