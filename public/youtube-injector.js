(function () {
    // Only run on YouTube watch pages
    if (!location.search.includes("v=")) return;
    if (!location.pathname.includes("watch")) return;

    // Wait for YouTube + Rammerhead to finish loading
    document.addEventListener("DOMContentLoaded", tryInject, true);

    function tryInject() {
        const params = new URLSearchParams(location.search);
        const videoId = params.get("v");
        if (!videoId) return;

        // Modern YouTube player container
        const playerContainer =
            document.querySelector("ytd-watch-flexy #player") ||
            document.querySelector("#player") ||
            document.querySelector("video");

        if (!playerContainer) {
            setTimeout(tryInject, 300);
            return;
        }

        // Replace the entire player area
        playerContainer.replaceWith(createUnlockedButton(videoId));
    }

    function createUnlockedButton(id) {
        const wrapper = document.createElement("div");
        wrapper.style.padding = "40px";
        wrapper.style.textAlign = "center";
        wrapper.style.background = "#111";
        wrapper.style.color = "white";
        wrapper.style.borderRadius = "12px";
        wrapper.style.marginTop = "20px";

        const title = document.createElement("h2");
        title.textContent = "YouTube playback is blocked.";
        wrapper.appendChild(title);

        const btn = document.createElement("button");
        btn.textContent = "Play in Unlocked Mode";
        btn.style.padding = "12px 20px";
        btn.style.fontSize = "18px";
        btn.style.cursor = "pointer";
        btn.style.borderRadius = "8px";
        btn.style.border = "none";
        btn.style.background = "#ff0000";
        btn.style.color = "white";

        btn.onclick = function () {
            location.href = "/youtube-unlocked.html?video=" + encodeURIComponent(id);
        };

        wrapper.appendChild(btn);
        return wrapper;
    }
})();
