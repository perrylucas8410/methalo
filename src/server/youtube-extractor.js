async function getPlayer(videoId) {
    const html = await fetch(`https://www.youtube.com/watch?v=${videoId}`)
        .then(r => r.text());

    // Multiple patterns to catch all YouTube formats
    const patterns = [
        /ytInitialPlayerResponse\s*=\s*(\{.+?\});/,
        /var\s+ytInitialPlayerResponse\s*=\s*(\{.+?\});/,
        new RegExp('window\

\["ytInitialPlayerResponse"\\]

\\s*=\\s*(\\{.+?\\});'),
        /ytInitialPlayerResponse\s*=\s*JSON\.parse\("(.+?)"\);/
    ];

    for (const p of patterns) {
        const match = html.match(p);
        if (match) {
            try {
                const raw = match[1];

                // If JSON.parse("...") form
                if (!raw.startsWith("{")) {
                    return JSON.parse(JSON.parse(raw));
                }

                return JSON.parse(raw);
            } catch (e) {
                console.error("Parse error:", e);
            }
        }
    }

    throw new Error("Could not extract player response");
}

module.exports = async function extract(videoId) {
    const data = await getPlayer(videoId);

    const formats = [
        ...(data.streamingData?.formats || []),
        ...(data.streamingData?.adaptiveFormats || [])
    ];

    // Combined audio+video MP4 streams
    const combined = formats.filter(f =>
        f.mimeType &&
        f.mimeType.includes("video/mp4") &&
        f.audioQuality &&        // must have audio
        f.url                    // must have direct URL
    );

    // Highest resolution combined stream
    let best = combined.sort((a, b) => (b.height || 0) - (a.height || 0))[0];

    // Fallback: ANY combined stream
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