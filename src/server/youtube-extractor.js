const fetch = require("node-fetch");

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

    // Pick the best MP4 stream
    const stream = formats.find(f => f.mimeType.includes("video/mp4"));

    return {
        title: data.videoDetails.title,
        url: stream.url
    };
};