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

    const combined = formats.filter(f =>
        f.mimeType.includes("video/mp4") &&
        !f.mimeType.includes("codecs=\"vp9\"") &&
        f.audioQuality
    );

    const best = combined.sort((a, b) => (b.height || 0) - (a.height || 0))[0];

    return {
        title: data.videoDetails.title,
        url: best?.url || null,
        height: best?.height || null
    };
};