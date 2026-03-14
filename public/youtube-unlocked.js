(async () => {
    const params = new URLSearchParams(location.search);
    const videoId = params.get("video");

    if (!videoId) {
        alert("Missing video ID");
        return;
    }

    const info = await fetch(`/api/youtube?id=${videoId}`).then(r => r.json());

    if (!info.url) {
        alert("Unable to load video stream");
        return;
    }

    const video = document.getElementById("player");
    video.src = info.url;
    video.play();
})();