const express = require("express");
const bodyParser = require("body-parser");
const cluster = require('cluster');
if (cluster.isMaster) {
    require('dotenv-flow').config();
}

const exitHook = require('async-exit-hook');
const sticky = require('sticky-session-custom');
const RammerheadProxy = require('../classes/RammerheadProxy');
const addStaticDirToProxy = require('../util/addStaticDirToProxy');
const RammerheadSessionFileCache = require('../classes/RammerheadSessionFileCache');
const config = require('../config');
const setupRoutes = require('./setupRoutes');
const setupPipeline = require('./setupPipeline');
const RammerheadLogging = require('../classes/RammerheadLogging');
const getSessionId = require('../util/getSessionId');

const prefix = config.enableWorkers ? (cluster.isMaster ? '(master) ' : `(${cluster.worker.id}) `) : '';

const logger = new RammerheadLogging({
    logLevel: config.logLevel,
    generatePrefix: (level) => prefix + config.generatePrefix(level)
});

const proxyServer = new RammerheadProxy({
    logger,
    loggerGetIP: config.getIP,
    bindingAddress: config.bindingAddress,
    port: config.port,
    crossDomainPort: config.crossDomainPort,
    dontListen: config.enableWorkers,
    ssl: config.ssl,
    getServerInfo: config.getServerInfo,
    disableLocalStorageSync: config.disableLocalStorageSync,
    jsCache: config.jsCache,
    disableHttp2: config.disableHttp2
});

// --------------------
// METHALO YOUTUBE BACKEND
// --------------------
const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Allow CORS for Methalo frontend
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "*");
    next();
});

// Placeholder extractor — replace with real logic later
async function extractYoutubeInfo(videoId) {
    return {
        id: videoId,
        title: "Placeholder Title",
        author: "Placeholder Channel",
        thumbnail: "",
        formats: [
            {
                itag: 18,
                qualityLabel: "360p",
                mimeType: "video/mp4",
                url: `https://example.com/dummy-${videoId}.mp4`
            }
        ]
    };
}

// GET /api/youtube/info?id=VIDEO_ID
app.get("/api/youtube/info", async (req, res) => {
    const videoId = req.query.id;
    if (!videoId) return res.status(400).json({ error: "Missing id" });

    try {
        const info = await extractYoutubeInfo(videoId);
        res.json(info);
    } catch (e) {
        console.error("YouTube info error:", e);
        res.status(500).json({ error: "Failed to extract video info" });
    }
});

// Proxy stream: /api/youtube/stream?url=ENCODED_URL
app.get("/api/youtube/stream", async (req, res) => {
    const url = req.query.url;
    if (!url) return res.status(400).send("Missing url");

    try {
        const target = decodeURIComponent(url);
        const upstream = await fetch(target, {
            headers: {
                range: req.headers.range || ""
            }
        });

        res.status(upstream.status);
        upstream.headers.forEach((value, key) => {
            if (key.toLowerCase() === "transfer-encoding") return;
            res.setHeader(key, value);
        });

        upstream.body.pipe(res);
    } catch (e) {
        console.error("Stream proxy error:", e);
        res.status(500).send("Stream error");
    }
});

if (config.publicDir) addStaticDirToProxy(proxyServer, config.publicDir);

const fileCacheOptions = { logger, ...config.fileCacheSessionConfig };
if (!cluster.isMaster) {
    fileCacheOptions.staleCleanupOptions = null;
}
const sessionStore = new RammerheadSessionFileCache(fileCacheOptions);
sessionStore.attachToProxy(proxyServer);

setupPipeline(proxyServer, sessionStore);
setupRoutes(proxyServer, sessionStore, logger);

// nicely close proxy server and save sessions to store before we exit
exitHook(() => {
    logger.info(`(server) Received exit signal, closing proxy server`);
    proxyServer.close();
    logger.info('(server) Closed proxy server');
});

if (!config.enableWorkers) {
    const formatUrl = (secure, hostname, port) => `${secure ? 'https' : 'http'}://${hostname}:${port}`;
    logger.info(
        `(server) Rammerhead proxy is listening on ${formatUrl(config.ssl, config.bindingAddress, config.port)}`
    );
}

// spawn workers if multithreading is enabled //
if (config.enableWorkers) {
    const stickyOptions = {
        workers: config.workers,
        generatePrehashArray(req) {
            let sessionId = getSessionId(req.url);
            if (!sessionId) {
                const parsed = new URL(req.url, 'https://a.com');
                sessionId = parsed.searchParams.get('id') || parsed.searchParams.get('sessionId');
                if (!sessionId) {
                    for (let i = 0; i < req.headers.length; i += 2) {
                        if (req.headers[i].toLowerCase() === 'referer') {
                            sessionId = getSessionId(req.headers[i + 1]);
                            break;
                        }
                    }
                    if (!sessionId) sessionId = ' ';
                }
            }
            return sessionId.split('').map((e) => e.charCodeAt());
        }
    };
    logger.info(JSON.stringify({ port: config.port, crossPort: config.crossDomainPort, master: cluster.isMaster }));
    const closeMasters = [sticky.listen(proxyServer.server1, config.port, config.bindingAddress, stickyOptions)];
    if (config.crossDomainPort) {
        closeMasters.push(
            sticky.listen(proxyServer.server2, config.crossDomainPort, config.bindingAddress, stickyOptions)
        );
    }

    if (closeMasters[0]) {
        const formatUrl = (secure, hostname, port) => `${secure ? 'https' : 'http'}://${hostname}:${port}`;
        logger.info(
            `Rammerhead proxy load balancer is listening on ${formatUrl(
                config.ssl,
                config.bindingAddress,
                config.port
            )}`
        );

        exitHook(async (done) => {
            logger.info('Master received exit signal. Shutting down workers');
            for (const closeMaster of closeMasters) {
                await new Promise((resolve) => closeMaster(resolve));
            }
            logger.info('Closed all workers');
            done();
        });
    } else {
        logger.info(`Worker ${cluster.worker.id} is running`);
    }
}

// --------------------
// ATTACH EXPRESS TO RAMMERHEAD
// --------------------
proxyServer.server1.on("request", app);

// export proxy server
module.exports = proxyServer;
