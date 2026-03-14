async function getPlayer(videoId) {
    const html = await fetch(`https://www.youtube.com/watch?v=${videoId}`)
        .then(r => r.text());

    // Try simple string searches instead of regex
    const markers = [
        'ytInitialPlayerResponse = ',
        'var ytInitialPlayerResponse = ',
        'window["ytInitialPlayerResponse"] = ',
        'ytInitialPlayerResponse = JSON.parse("'
    ];

    for (const marker of markers) {
        const idx = html.indexOf(marker);
        if (idx !== -1) {
            let start = idx + marker.length;

            // JSON.parse("...") case
            if (marker.includes('JSON.parse')) {
                const end = html.indexOf('");', start);
                const raw = html.substring(start, end);

                const parsed = JSON.parse(JSON.parse(raw));
                return parsed;
            }

            // Normal {...} case
            const end = html.indexOf('};', start) + 1;
            const raw = html.substring(start, end);

            const parsed = JSON.parse(raw);
            return parsed;
        }
    }

    throw new Error("Could not extract player response");
}

module.exports = async function extract(videoId) {
    const data = await getPlayer(videoId);

    // ⭐ DEBUG LOGS — THIS IS WHAT WE NEED
    console.log("=== Extractor Debug ===");
    console.log("Video ID:", videoId);
    console.log("Formats:", data.streamingData?.formats?.length || 0);
    console.log("Adaptive:", data.streamingData?.adaptiveFormats?.length || 0);
    console.log("========================");

    const formats = [
        ...(data.streamingData?.formats || []),
        ...(data.streamingData?.adaptiveFormats || [])
    ];

    const combined = formats.filter(f =>
        f.mimeType &&
        f.mimeType.includes("video/mp4") &&
        f.audioQuality &&
        f.url
    );

    let best = combined.sort((a, b) => (b.height || 0) - (a.height || 0))[0];

    if (!best) {
        best = formats.find(f =>
            f.mimeType &&
            f.mimeType.includes("video/mp4") &&
            f.audioQuality &&
            f.url
        );
    }

    return {
        title: data.videoDetails.title,
        url: best?.url || null,
        height: best?.height || null
    };
};
