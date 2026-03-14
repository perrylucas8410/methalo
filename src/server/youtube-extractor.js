async function getPlayer(videoId) {
    const html = await fetch(`https://www.youtube.com/watch?v=${videoId}`)
        .then(r => r.text());

    // Try multiple patterns
    const patterns = [
        /ytInitialPlayerResponse\s*=\s*(\{.+?\});/,
        /var\s+ytInitialPlayerResponse\s*=\s*(\{.+?\});/,
        /window

\["ytInitialPlayerResponse"\]

\s*=\s*(\{.+?\});/,
        /ytInitialPlayerResponse\s*=\s*JSON\.parse\("(.+?)"\);/
    ];

    for (const p of patterns) {
        const match = html.match(p);
        if (match) {
            try {
                const json = match[1].startsWith("{")
                    ? match[1]
                    : JSON.parse(match[1]); // handle JSON.parse("...")
                return JSON.parse(json);
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

    // Filter for combined audio+video MP4
    const combined = formats.filter(f =>
        f.mimeType.includes("video/mp4") &&
        f.audioQuality &&
        f.url
    );

    // Pick highest resolution
    let best = combined.sort((a, b) => (b.height || 0) - (a.height || 0))[0];

    // Fallback: ANY combined stream
    if (!best) {
        best = formats.find(f =>
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