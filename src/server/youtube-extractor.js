async function getPlayer(videoId) {
    const html = await fetch(`https://www.youtube.com/watch?v=${videoId}`)
        .then(r => r.text());

    const marker = "ytInitialPlayerResponse = ";
    const start = html.indexOf(marker) + marker.length;
    const end = html.indexOf("};", start) + 1;

    const json = html.substring(start, end);
    return JSON.parse(json);
}

module.exports = async function extract(videoId) {
    const data = await getPlayer(videoId);

    const formats = [
        ...(data.streamingData?.formats || []),
        ...(data.streamingData?.adaptiveFormats || [])
    ];

    // Phase 1: Only combined MP4 streams (video+audio)
    const combined = formats.filter(f =>
        f.mimeType.includes("video/mp4") &&
        !f.mimeType.includes("codecs=\"vp9\"") &&
        f.audioQuality // ensures audio is included
    );

    // Pick the highest resolution combined stream
    const best = combined.sort((a, b) => (b.height || 0) - (a.height || 0))[0];

    return {
        title: data.videoDetails.title,
        url: best?.url || null,
        height: best?.height || null
    };
};
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
