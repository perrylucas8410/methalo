(function() {
    if (!location.href.includes("youtube.com/watch")) return;

    const videoId = new URLSearchParams(location.search).get("v");
    if (!videoId) return;

    const interval = setInterval(() => {
        const player = document.getElementById("player") ||
                       document.querySelector("video") ||
                       document.querySelector("#movie_player");

        if (!player) return;

        clearInterval(interval);

        player.replaceWith(createUnlockedButton(videoId));
    }, 500);

    function createUnlockedButton(id) {
        const wrapper = document.createElement("div");
        wrapper.style = `
            padding: 40px;
            text-align: center;
            background: #111;
            color: white;
            border-radius: 12px;
            margin-top: 20px;
        `;

        wrapper.innerHTML = `
            <h2>YouTube playback is blocked.</h2>
            <button id="unlockBtn" style="
                padding: 12px 20px;
                font-size: 18px;
                cursor: pointer;
                border-radius: 8px;
                border: none;
                background: #ff0000;
                color: white;
            ">Play in Unlocked Mode</button>
        `;

        wrapper.querySelector("#unlockBtn").onclick = () => {
            location.href = `/youtube-unlocked.html?video=${id}`;
        };

        return wrapper;
    }
})();