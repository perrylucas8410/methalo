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

  // -----------------------------
  // NAVIGATION OVERRIDES
  // -----------------------------

  const originalAssign = window.location.assign.bind(window.location);
  window.location.assign = function(url) {
    originalAssign(proxify(url));
  };

  const originalReplace = window.location.replace.bind(window.location);
  window.location.replace = function(url) {
    originalReplace(proxify(url));
  };

  const originalPush = history.pushState.bind(history);
  history.pushState = function(state, title, url) {
    if (url) url = proxify(url);
    return originalPush(state, title, url);
  };

  const originalReplaceState = history.replaceState.bind(history);
  history.replaceState = function(state, title, url) {
    if (url) url = proxify(url);
    return originalReplaceState(state, title, url);
  };

  // window.location.href = "..."
  Object.defineProperty(window.location, "href", {
    configurable: true,
    enumerable: true,
    get() {
      return originalAssign.name && window.location.toString();
    },
    set(url) {
      window.location.assign(url);
    }
  });

  // window.location = "..."
  Object.defineProperty(window, "location", {
    configurable: true,
    enumerable: true,
    get() {
      return window.document.location;
    },
    set(url) {
      window.location.assign(url);
    }
  });

  // document.location = "..."
  Object.defineProperty(document, "location", {
    configurable: true,
    enumerable: true,
    get() {
      return window.location;
    },
    set(url) {
      window.location.assign(url);
    }
  });

  // -----------------------------
  // FORM OVERRIDES
  // -----------------------------

  function rewriteFormAction(form) {
    const action = form.getAttribute("action");
    if (!action) return;

    try {
      const abs = new URL(action, window.location.href).toString();
      const proxied = PROXY_PREFIX + encode(abs);
      form.setAttribute("action", proxied);
    } catch {
      // ignore
    }
  }

  const originalSubmit = HTMLFormElement.prototype.submit;
  HTMLFormElement.prototype.submit = function() {
    rewriteFormAction(this);
    return originalSubmit.call(this);
  };

  if (HTMLFormElement.prototype.requestSubmit) {
    const originalRequestSubmit = HTMLFormElement.prototype.requestSubmit;
    HTMLFormElement.prototype.requestSubmit = function() {
      rewriteFormAction(this);
      return originalRequestSubmit.apply(this, arguments);
    };
  }

  // Intercept clicks on <a> to ensure proxified navigation
  document.addEventListener("click", function(e) {
    const target = e.target.closest && e.target.closest("a[href]");
    if (!target) return;

    const href = target.getAttribute("href");
    if (!href) return;
    if (href.startsWith("#")) return;
    if (href.startsWith("javascript:")) return;
    if (href.startsWith("mailto:")) return;

    e.preventDefault();
    const abs = new URL(href, window.location.href).toString();
    window.location.assign(abs);
  }, true);

  // -----------------------------
  // NETWORK OVERRIDES
  // -----------------------------

  const originalFetch = window.fetch;
  window.fetch = function(resource, init) {
    if (typeof resource === "string") {
      resource = proxify(resource);
    } else if (resource instanceof Request) {
      resource = new Request(proxify(resource.url), resource);
    }
    return originalFetch(resource, init);
  };

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

  // Minimal WebSocket proxification (optional, safe)
  const OriginalWS = window.WebSocket;
  if (OriginalWS) {
    window.WebSocket = function(url, protocols) {
      const abs = proxify(url);
      return new OriginalWS(abs, protocols);
    };
  }

  console.log("JS SHIM LOADED");
})();
