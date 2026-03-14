(function () {
    // Run ONLY on YouTube watch pages
    if (location.hostname.indexOf("youtube.com") === -1) return;
    if (location.pathname !== "/watch") return;

    // Delay until Rammerhead finishes rewriting the page
    document.addEventListener("DOMContentLoaded", function () {
        tryInject();
    }, true);

    function tryInject() {
        var params = new URLSearchParams(location.search);
        var videoId = params.get("v");
        if (!videoId) return;

        // Find the YouTube player
        var player =
            document.getElementById("player") ||
            document.querySelector("#movie_player") ||
            document.querySelector("video");

        if (!player) {
            // Retry a few times because YouTube loads late
            setTimeout(tryInject, 300);
            return;
        }

        // Replace the player with our button
        player.parentNode.replaceChild(createUnlockedButton(videoId), player);
    }

    function createUnlockedButton(id) {
        var wrapper = document.createElement("div");
        wrapper.style.padding = "40px";
        wrapper.style.textAlign = "center";
        wrapper.style.background = "#111";
        wrapper.style.color = "white";
        wrapper.style.borderRadius = "12px";
        wrapper.style.marginTop = "20px";

        var title = document.createElement("h2");
        title.textContent = "YouTube playback is blocked.";
        wrapper.appendChild(title);

        var btn = document.createElement("button");
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