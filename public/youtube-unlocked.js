function getQueryParam(name) {
  const params = new URLSearchParams(location.search);
  return params.get(name);
}

async function fetchVideoInfo(videoId) {
  const res = await fetch(`/api/youtube/info?id=${encodeURIComponent(videoId)}`);
  if (!res.ok) throw new Error("Failed to fetch video info");
  return res.json();
}

function buildStreamUrl(rawUrl) {
  // Route through our proxy so the browser never hits YouTube directly
  return `/api/youtube/stream?url=${encodeURIComponent(rawUrl)}`;
}

function renderQualityOptions(formats, onSelect) {
  const container = document.getElementById("yu-quality-list");
  container.innerHTML = "";

  formats.forEach((fmt, idx) => {
    const btn = document.createElement("button");
    btn.className = "yu-quality-btn";
    btn.textContent = fmt.qualityLabel || fmt.mimeType || `Stream ${idx + 1}`;
    btn.onclick = () => onSelect(fmt);
    container.appendChild(btn);
  });
}

async function init() {
  const videoId = getQueryParam("v") || getQueryParam("id");
  if (!videoId) {
    alert("Missing video id");
    return;
  }

  const titleEl = document.getElementById("yu-title");
  const authorEl = document.getElementById("yu-author");
  const videoEl = document.getElementById("yu-video");

  try {
    const info = await fetchVideoInfo(videoId);
    titleEl.textContent = info.title || "Unknown title";
    authorEl.textContent = info.author || "";

    const formats = info.formats || [];
    if (!formats.length) {
      titleEl.textContent = "No playable formats found";
      return;
    }

    // Default: first format
    const defaultFmt = formats[0];
    videoEl.src = buildStreamUrl(defaultFmt.url);

    renderQualityOptions(formats, (fmt) => {
      const currentTime = videoEl.currentTime;
      const wasPaused = videoEl.paused;
      videoEl.src = buildStreamUrl(fmt.url);
      videoEl.currentTime = currentTime;
      if (!wasPaused) videoEl.play();
    });
  } catch (e) {
    console.error(e);
    titleEl.textContent = "Failed to load video";
  }
}

document.addEventListener("DOMContentLoaded", init);
