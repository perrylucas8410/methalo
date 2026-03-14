// ---------------------------------------------------------
// METHALO BROWSER ENGINE (SINGLE-PAGE)
// ---------------------------------------------------------

// ---------- GLOBAL STATE ----------
function createTab(url = "") {
  return {
    id: crypto.randomUUID(),
    title: url ? "Loading..." : "New Tab",
    url,
    favicon: undefined,
    isLoading: false,
    canGoBack: false,
    canGoForward: false,
    history: url ? [url] : [],
    historyIndex: url ? 0 : -1
  };
}

const state = {
  tabs: [createTab()],
  activeTabId: null,
  iframeMap: {}
};

state.activeTabId = state.tabs[0].id;

// ---------- DOM REFERENCES ----------
const tabBarEl = document.getElementById("tab-bar");
const toolbarEl = document.getElementById("toolbar");
const contentEl = document.getElementById("content-area");

// ---------- RAMMERHEAD SESSION URL BUILDER ----------
function buildSessionUrl(url) {
  if (!url) return "about:blank";
  const sessionId = localStorage.getItem("sessionId");
  if (!sessionId) return "about:blank";
  return `/${sessionId}/${encodeURIComponent(url)}`;
}

// ---------- URL RESOLUTION ----------
function resolveUrl(input) {
  const trimmed = input.trim();
  if (!trimmed) return "";

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }

  if (trimmed.includes(".") && !trimmed.includes(" ")) {
    return "https://" + trimmed;
  }

  return `https://www.bing.com/search?q=${encodeURIComponent(trimmed)}`;
}

// ---------- HELPERS ----------
function getActiveTab() {
  return state.tabs.find((t) => t.id === state.activeTabId) || state.tabs[0];
}

function updateTab(id, updates) {
  state.tabs = state.tabs.map((t) => (t.id === id ? { ...t, ...updates } : t));
}

// ---------- TAB OPERATIONS ----------
function addTab(url = "") {
  const tab = createTab(url);
  state.tabs.push(tab);
  state.activeTabId = tab.id;
  renderAll();
}

function closeTab(id) {
  if (state.tabs.length === 1) {
    state.tabs = [createTab()];
    state.activeTabId = state.tabs[0].id;
    renderAll();
    return;
  }

  const idx = state.tabs.findIndex((t) => t.id === id);
  state.tabs = state.tabs.filter((t) => t.id !== id);

  if (state.activeTabId === id) {
    const next = state.tabs[Math.min(idx, state.tabs.length - 1)];
    state.activeTabId = next.id;
  }

  renderAll();
}

function navigate(tabId, inputUrl) {
  const resolved = resolveUrl(inputUrl);
  state.tabs = state.tabs.map((t) => {
    if (t.id !== tabId) return t;
    const newHistory = t.history.slice(0, t.historyIndex + 1);
    newHistory.push(resolved);
    return {
      ...t,
      url: resolved,
      title: "Loading...",
      isLoading: true,
      history: newHistory,
      historyIndex: newHistory.length - 1,
      canGoBack: newHistory.length > 1,
      canGoForward: false
    };
  });
  renderAll();
}

function goBack(tabId) {
  state.tabs = state.tabs.map((t) => {
    if (t.id !== tabId || t.historyIndex <= 0) return t;
    const newIndex = t.historyIndex - 1;
    return {
      ...t,
      url: t.history[newIndex],
      historyIndex: newIndex,
      canGoBack: newIndex > 0,
      canGoForward: true,
      isLoading: true,
      title: "Loading..."
    };
  });
  renderAll();
}

function goForward(tabId) {
  state.tabs = state.tabs.map((t) => {
    if (t.id !== tabId || t.historyIndex >= t.history.length - 1) return t;
    const newIndex = t.historyIndex + 1;
    return {
      ...t,
      url: t.history[newIndex],
      historyIndex: newIndex,
      canGoBack: true,
      canGoForward: newIndex < t.history.length - 1,
      isLoading: true,
      title: "Loading..."
    };
  });
  renderAll();
}

function refresh(tabId) {
  const tab = state.tabs.find((t) => t.id === tabId);
  if (!tab) return;
  updateTab(tabId, { isLoading: true });
  const iframe = state.iframeMap[tabId];
  if (iframe) iframe.src = iframe.src;
  renderAll();
}

// ---------- RENDER ROOT ----------
function renderAll() {
  renderTabBar();
  renderToolbar();
  renderContent();
}

// ---------- TAB BAR ----------
function renderTabBar() {
  tabBarEl.innerHTML = "";

  const strip = document.createElement("div");
  strip.className = "tab-strip";

  state.tabs.forEach((tab) => {
    const isActive = tab.id === state.activeTabId;
    const tabEl = document.createElement("div");
    tabEl.className = "tab" + (isActive ? " active" : "");
    tabEl.title = tab.title;

    tabEl.addEventListener("click", () => {
      state.activeTabId = tab.id;
      renderAll();
    });

    const favWrap = document.createElement("div");
    favWrap.className = "tab-favicon";

    if (tab.favicon) {
      const img = document.createElement("img");
      img.src = tab.favicon;
      favWrap.appendChild(img);
    } else {
      const placeholder = document.createElement("div");
      placeholder.className = "tab-favicon-placeholder";
      const inner = document.createElement("div");
      inner.className = "tab-favicon-placeholder-inner";
      placeholder.appendChild(inner);
      favWrap.appendChild(placeholder);
    }

    const titleEl = document.createElement("span");
    titleEl.className = "tab-title";
    titleEl.textContent = tab.title || "New Tab";

    const closeBtn = document.createElement("button");
    closeBtn.className = "tab-close";
    closeBtn.innerHTML = "×";
    closeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      closeTab(tab.id);
    });

    tabEl.appendChild(favWrap);
    tabEl.appendChild(titleEl);
    tabEl.appendChild(closeBtn);

    strip.appendChild(tabEl);
  });

  tabBarEl.appendChild(strip);

  const newTabBtn = document.createElement("button");
  newTabBtn.id = "new-tab-button";
  newTabBtn.textContent = "+";
  newTabBtn.addEventListener("click", () => addTab());
  tabBarEl.appendChild(newTabBtn);

  const profileContainer = document.createElement("div");
  profileContainer.id = "profile-container";

  const avatar = document.createElement("div");
  avatar.id = "profile-avatar";

  const img = document.createElement("img");
  img.src = window.METHALO_USER?.photoURL || "/icons/profile-default.png";
  avatar.appendChild(img);

  profileContainer.appendChild(avatar);

  const menu = document.createElement("div");
  menu.id = "profile-menu";

  const header = document.createElement("div");
  header.className = "profile-menu-header";

  const headerAvatar = document.createElement("div");
  headerAvatar.className = "profile-menu-avatar";
  const headerImg = document.createElement("img");
  headerImg.src =
    window.METHALO_USER?.photoURL || "/icons/profile-default.png";
  headerAvatar.appendChild(headerImg);

  const headerText = document.createElement("div");
  const nameEl = document.createElement("div");
  nameEl.className = "profile-menu-name";
  nameEl.textContent = window.METHALO_USER?.displayName || "Guest";

  const emailEl = document.createElement("div");
  emailEl.className = "profile-menu-email";
  emailEl.textContent = window.METHALO_USER?.email || "Not signed in";

  headerText.appendChild(nameEl);
  headerText.appendChild(emailEl);

  header.appendChild(headerAvatar);
  header.appendChild(headerText);

  const divider = document.createElement("div");
  divider.className = "profile-menu-divider";

  const manageItem = document.createElement("div");
  manageItem.className = "profile-menu-item";
  manageItem.textContent = "Manage Account";

  const signOutItem = document.createElement("div");
  signOutItem.className = "profile-menu-item";
  signOutItem.textContent = "Sign Out";

  signOutItem.addEventListener("click", () => {
    if (window.methaloSignOut) window.methaloSignOut();
    menu.classList.remove("visible");
  });

  menu.appendChild(header);
  menu.appendChild(divider);
  menu.appendChild(manageItem);
  menu.appendChild(signOutItem);

  profileContainer.appendChild(menu);

  avatar.addEventListener("click", (e) => {
    e.stopPropagation();
    const isVisible = menu.classList.contains("visible");
    document
      .querySelectorAll("#profile-menu.visible")
      .forEach((el) => el.classList.remove("visible"));
    if (!isVisible) menu.classList.add("visible");
  });

  document.addEventListener("click", () => {
    menu.classList.remove("visible");
  });

  tabBarEl.appendChild(profileContainer);
}

// ---------- TOOLBAR ----------
function renderToolbar() {
  toolbarEl.innerHTML = "";
  const tab = getActiveTab();

  const backBtn = document.createElement("button");
  backBtn.className =
    "toolbar-button" + (tab.canGoBack ? "" : " disabled");
  backBtn.innerHTML = "⟨";
  if (tab.canGoBack) backBtn.addEventListener("click", () => goBack(tab.id));

  const forwardBtn = document.createElement("button");
  forwardBtn.className =
    "toolbar-button" + (tab.canGoForward ? "" : " disabled");
  forwardBtn.innerHTML = "⟩";
  if (tab.canGoForward)
    forwardBtn.addEventListener("click", () => goForward(tab.id));

  const refreshBtn = document.createElement("button");
  refreshBtn.className = "toolbar-button";
  refreshBtn.innerHTML = tab.isLoading ? "✕" : "⟳";
  refreshBtn.addEventListener("click", () => refresh(tab.id));

  const homeBtn = document.createElement("button");
  homeBtn.className = "toolbar-button";
  homeBtn.innerHTML = "⌂";
  homeBtn.addEventListener("click", () => {
    updateTab(tab.id, {
      url: "",
      title: "New Tab",
      history: [],
      historyIndex: -1,
      canGoBack: false,
      canGoForward: false
    });
    renderAll();
  });

  const form = document.createElement("form");
  form.id = "address-form";

  const container = document.createElement("div");
  container.id = "address-container";

  const securityIcon = document.createElement("div");
  securityIcon.id = "address-security-icon";

  const input = document.createElement("input");
  input.id = "address-input";
  input.type = "text";
  input.placeholder = "Search or enter address";

  const displayUrl = tab.url
    ? tab.url.replace(/^https?:\/\//, "").replace(/\/$/, "")
    : "";
  input.value = displayUrl;

  input.addEventListener("focus", () => {
    container.classList.add("focused");
    input.select();
  });

  input.addEventListener("blur", () => {
    container.classList.remove("focused");
    const t = getActiveTab();
    const dUrl = t.url
      ? t.url.replace(/^https?:\/\//, "").replace(/\/$/, "")
      : "";
    input.value = dUrl;
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    navigate(tab.id, input.value);
  });

  container.appendChild(securityIcon);
  container.appendChild(input);

  if (tab.isLoading) {
    const spinner = document.createElement("div");
    spinner.id = "address-spinner";
    container.appendChild(spinner);
  }

  form.appendChild(container);

  toolbarEl.appendChild(backBtn);
  toolbarEl.appendChild(forwardBtn);
  toolbarEl.appendChild(refreshBtn);
  toolbarEl.appendChild(homeBtn);
  toolbarEl.appendChild(form);
}

// ---------- CONTENT ----------
function renderContent() {
  contentEl.innerHTML = "";

  state.tabs.forEach((tab) => {
    const wrapper = document.createElement("div");
    wrapper.style.position = "absolute";
    wrapper.style.inset = "0";
    wrapper.style.display =
      tab.id === state.activeTabId ? "block" : "none";

    if (tab.url) {
      const iframe = document.createElement("iframe");
      iframe.className = "browser-tab-content";
      iframe.src = buildSessionUrl(tab.url);
      iframe.title = tab.title;
      iframe.sandbox =
        "allow-forms allow-modals allow-pointer-lock allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts allow-downloads";
      iframe.allow =
        "accelerometer; autoplay; clipboard-read; clipboard-write; encrypted-media; fullscreen; geolocation; gyroscope; microphone; picture-in-picture";

      state.iframeMap[tab.id] = iframe;

      iframe.addEventListener("load", () => {
        handleIframeLoad(tab.id, iframe);
      });

      iframe.addEventListener("error", () => {
        updateTab(tab.id, {
          title: "Error",
          isLoading: false
        });
        renderTabBar();
        renderToolbar();
      });

      wrapper.appendChild(iframe);
    } else {
      wrapper.appendChild(createNewTabPage(tab.id));
    }

    contentEl.appendChild(wrapper);
  });
}

// ---------- IFRAME LOAD HANDLER ----------
function handleIframeLoad(tabId, iframe) {
  const tab = state.tabs.find((t) => t.id === tabId);
  if (!tab) return;

  let title = tab.url;
  let favicon;

  try {
    const doc = iframe.contentDocument || iframe.contentWindow.document;
    if (doc) {
      title = doc.title || tab.url;
      const iconEl = doc.querySelector("link[rel~='icon']");
      if (iconEl && iconEl.href) {
        favicon = iconEl.href;
      } else {
        const origin = new URL(tab.url).origin;
        favicon = origin + "/favicon.ico";
      }
    }
  } catch {
    try {
      title = new URL(tab.url).hostname;
    } catch {
      title = tab.url;
    }
  }

  updateTab(tabId, { title, favicon, isLoading: false });
  renderTabBar();
  renderToolbar();
}

// ---------- NEW TAB PAGE (B3 + G2 + L2) ----------
function createNewTabPage(tabId) {
  const root = document.createElement("div");
  root.className = "new-tab-page";

  const gradientOverlay = document.createElement("div");
  gradientOverlay.className = "new-tab-gradient-overlay";

  const particles = document.createElement("div");
  particles.className = "new-tab-particles";

  const content = document.createElement("div");
  content.className = "new-tab-content";

  const logoWrap = document.createElement("div");
  logoWrap.className = "new-tab-logo";

  const logoImg = document.createElement("img");
  logoImg.src = "/logos/methalo-logo.svg";
  logoImg.alt = "Methalo";
  logoWrap.appendChild(logoImg);

  const title = document.createElement("div");
  title.className = "new-tab-title";
  title.textContent = "Methalo Browser";

  const subtitle = document.createElement("div");
  subtitle.className = "new-tab-subtitle";
  subtitle.textContent = "A focused, modern browsing experience.";

  const searchContainer = document.createElement("div");
  searchContainer.className = "new-tab-search-container";

  const search = document.createElement("div");
  search.className = "new-tab-search";

  const searchIcon = document.createElement("div");
  searchIcon.className = "new-tab-search-icon";

  const input = document.createElement("input");
  input.className = "new-tab-search-input";
  input.type = "text";
  input.placeholder = "Search the web or enter a URL";

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      navigate(tabId, input.value);
    }
  });

  search.appendChild(searchIcon);
  search.appendChild(input);
  searchContainer.appendChild(search);

  content.appendChild(logoWrap);
  content.appendChild(title);
  content.appendChild(subtitle);
  content.appendChild(searchContainer);

  root.appendChild(gradientOverlay);
  root.appendChild(particles);
  root.appendChild(content);

  return root;
}

// ---------- INIT ----------
function init() {
  renderAll();
}

// ---------- WAIT FOR FIREBASE USER BEFORE RUNNING UI ----------
if (!window.METHALO_USER) {
  const waitForUser = setInterval(() => {
    if (window.METHALO_USER) {
      clearInterval(waitForUser);
      init(); // start browser AFTER user is ready
    }
  }, 50);
} else {
  init();
}