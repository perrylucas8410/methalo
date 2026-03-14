const API_KEY = "PASTE_YOUR_INNERTUBE_API_KEY_HERE";

async function fetchHtmlPlayer(videoId) {
    const html = await fetch(`https://www.youtube.com/watch?v=${videoId}`)
        .then(r => r.text());

    const markers = [
        'ytInitialPlayerResponse = ',
        'var ytInitialPlayerResponse = ',
        'window["ytInitialPlayerResponse"] = ',
        'ytInitialPlayerResponse = JSON.parse("'
    ];

    for (const marker of markers) {
        const idx = html.indexOf(marker);
        if (idx === -1) continue;

        const start = idx + marker.length;

        // JSON.parse("...") case
        if (marker.indexOf('JSON.parse') !== -1) {
            const end = html.indexOf('");', start);
            if (end === -1) continue;
            const raw = html.substring(start, end);
            return JSON.parse(JSON.parse(raw));
        }

        // Normal {...} case
        const end = html.indexOf('};', start);
        if (end === -1) continue;
        const raw = html.substring(start, end + 1);
        return JSON.parse(raw);
    }

    return null;
}

async function fetchAndroidPlayer(videoId) {
    const res = await fetch(
        "https://www.youtube.com/youtubei/v1/player?key=" + API_KEY,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "User-Agent": "com.google.android.youtube/18.48.37 (Linux; U; Android 11)"
            },
            body: JSON.stringify({
                context: {
                    client: {
                        clientName: "ANDROID",
                        clientVersion: "18.48.37"
                    }
                },
                videoId
            })
        }
    );

    if (!res.ok) {
        throw new Error("Android player API failed with status " + res.status);
    }

    return res.json();
}

async function getPlayer(videoId) {
    // 1) Try HTML player response
    try {
        const htmlPlayer = await fetchHtmlPlayer(videoId);
        if (htmlPlayer &&
            htmlPlayer.streamingData &&
            ((htmlPlayer.streamingData.formats && htmlPlayer.streamingData.formats.length) ||
             (htmlPlayer.streamingData.adaptiveFormats && htmlPlayer.streamingData.adaptiveFormats.length))) {
            return htmlPlayer;
        }
    } catch (e) {
        console.error("HTML player parse failed:", e);
    }

    // 2) Fallback to Android internal API
    const androidPlayer = await fetchAndroidPlayer(videoId);
    return androidPlayer;
}

function collectFormats(data) {
    const sd = data.streamingData || {};
    const formats = sd.formats || [];
    const adaptive = sd.adaptiveFormats || [];
    return formats.concat(adaptive);
}

function getUrlFromFormat(format) {
    if (format.url) return format.url;

    const cipher = format.signatureCipher || format.cipher;
    if (!cipher) return null;

    const params = new URLSearchParams(cipher);
    const base = params.get("url");
    const sig = params.get("sig");
    const sp = params.get("sp") || "signature";

    if (base && sig) {
        return base + "&" + sp + "=" + sig;
    }

    // Many modern videos use "s" (obfuscated); full deciphering would require parsing player JS.
    return null;
}

module.exports = async function extract(videoId) {
    const data = await getPlayer(videoId);

    console.log("=== Extractor Debug ===");
    console.log("Video ID:", videoId);
    console.log("Formats:", data.streamingData?.formats?.length || 0);
    console.log("Adaptive:", data.streamingData?.adaptiveFormats?.length || 0);
    console.log("========================");

    const allFormats = collectFormats(data);

    const mp4Formats = allFormats.filter(f =>
        f.mimeType &&
        f.mimeType.indexOf("video/mp4") !== -1
    );

    mp4Formats.sort((a, b) => (b.height || 0) - (a.height || 0));

    let best = null;
    for (const f of mp4Formats) {
        const url = getUrlFromFormat(f);
        if (url) {
            best = { format: f, url };
            break;
        }
    }

    if (!best) {
        // Fallback: any format with a direct URL
        for (const f of allFormats) {
            const url = getUrlFromFormat(f);
            if (url) {
                best = { format: f, url };
                break;
            }
        }
    }

    return {
        title: data.videoDetails?.title || "Unknown title",
        url: best ? best.url : null,
        height: best && best.format ? best.format.height || null : null
    };
};
