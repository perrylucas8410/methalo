const generateId = require('../util/generateId');
const URLPath = require('../util/URLPath');
const httpResponse = require('../util/httpResponse');
const config = require('../config');
const StrShuffler = require('../util/StrShuffler');
const RammerheadSession = require('../classes/RammerheadSession');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');
const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const streamToString = require('../util/streamToString');
require('dotenv').config();

// Initialize Email
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
});

// Initialize Discord
const discordClient = new Client({ 
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] 
});
if (process.env.DISCORD_BOT_TOKEN) {
    discordClient.login(process.env.DISCORD_BOT_TOKEN).catch(err => console.error('[Discord] Login Failed:', err.message));
}

/**
 *
 * @param {import('../classes/RammerheadProxy')} proxyServer
 * @param {import('../classes/RammerheadSessionAbstractStore')} sessionStore
 * @param {import('../classes/RammerheadLogging')} logger
 */
module.exports = function setupRoutes(proxyServer, sessionStore, logger) {
    const distDir = path.join(__dirname, '../../app/dist');
    const indexPath = path.join(distDir, 'index.html');
    let indexContent = { content: 'React build not found', contentType: 'text/html' };
    
    if (fs.existsSync(indexPath)) {
        logger.info(`Serving React from ${distDir}`);
        indexContent = {
            content: fs.readFileSync(indexPath),
            contentType: 'text/html'
        };
    } else {
        logger.warn(`React build not found at ${indexPath}`);
    }

    proxyServer.GET('/login', indexContent);
    proxyServer.GET('/signup', indexContent);
    proxyServer.GET('/dashboard', indexContent);
    proxyServer.GET('/settings', indexContent);
    proxyServer.GET('/admin', indexContent);
    proxyServer.GET('/support', indexContent);
    proxyServer.GET('/contact', indexContent);
    proxyServer.GET('/', indexContent);

    const isNotAuthorized = (req, res) => {
        if (!config.password) return;
        const { pwd } = new URLPath(req.url).getParams();
        if (config.password !== pwd) {
            httpResponse.accessForbidden(logger, req, res, config.getIP(req), 'bad password');
            return true;
        }
        return false;
    };

    proxyServer.GET('/newsession', (req, res) => {
        if (isNotAuthorized(req, res)) return;
        const id = generateId();
        const session = new RammerheadSession();
        session.data.restrictIP = config.getIP(req);
        sessionStore.addSerializedSession(id, session.serializeSession());
        res.end(id);
    });

    proxyServer.GET('/api/admin/sessions', (req, res) => {
        if (isNotAuthorized(req, res)) return;
        const sessions = sessionStore.keys().map(id => {
            const session = sessionStore.get(id);
            return {
                id,
                createdOn: session ? session.data.createdOn : null,
                ip: session ? session.data.restrictIP : null
            };
        });
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(sessions));
    });

    proxyServer.GET('/deletesession', (req, res) => {
        if (isNotAuthorized(req, res)) return;
        const { id } = new URLPath(req.url).getParams();
        if (!id || !sessionStore.has(id)) return res.end('not found');
        sessionStore.delete(id);
        res.end('Success');
    });

    proxyServer.GET('/mainport', (req, res) => {
        const serverInfo = config.getServerInfo(req);
        res.end((serverInfo.port || '').toString());
    });

    proxyServer.GET('/api/shuffleDict', (req, res) => {
        const { id } = new URLPath(req.url).getParams();
        if (!id || !sessionStore.has(id)) {
            return httpResponse.badRequest(logger, req, res, config.getIP(req), 'Invalid session id');
        }
        const session = sessionStore.get(id);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(session.data.shuffleDict));
    });

    proxyServer.POST('/api/support/submit', async (req, res) => {
        try {
            const body = await streamToString(req);
            const { fullName, accountEmail, replyEmail, problem } = JSON.parse(body);

            // Email Notification
            if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
                transporter.sendMail({
                    from: `"Methalo Support" <${process.env.EMAIL_USER}>`,
                    to: process.env.EMAIL_USER,
                    subject: `[SUPPORT] ${fullName}`,
                    html: `<b>User:</b> ${fullName}<br><b>Account:</b> ${accountEmail}<br><b>Reply:</b> ${replyEmail}<br><br><b>Problem:</b><br>${problem}`
                }).catch(() => {});
            }

            // Discord Notification
            if (process.env.DISCORD_BOT_TOKEN && process.env.DISCORD_SUPPORT_CHANNEL_ID) {
                const channel = await discordClient.channels.fetch(process.env.DISCORD_SUPPORT_CHANNEL_ID).catch(() => null);
                if (channel) {
                    const embed = new EmbedBuilder()
                        .setTitle("🆕 New Support Ticket")
                        .setColor(0x00d4ff)
                        .addFields(
                            { name: "User", value: fullName, inline: true },
                            { name: "Account", value: accountEmail, inline: true },
                            { name: "Reply Email", value: replyEmail },
                            { name: "Problem", value: problem }
                        )
                        .setTimestamp();
                    const row = new ActionRowBuilder().addComponents(
                        new ButtonBuilder().setCustomId(`reply_${fullName}`).setLabel('Reply to User').setStyle(ButtonStyle.Primary)
                    );
                    await channel.send({ embeds: [embed], components: [row] }).catch(() => {});
                }
            }

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true }));
        } catch (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Failed' }));
        }
    });

    proxyServer.POST('/api/support/reply', async (req, res) => {
        try {
            const body = await streamToString(req);
            const { replyEmail, userName, message } = JSON.parse(body);
            await transporter.sendMail({
                from: `"Methalo Support" <${process.env.EMAIL_USER}>`,
                to: replyEmail,
                subject: `Support Request Update`,
                html: `<div style="background:#0a0a0a; color:white; padding:30px; border-radius:15px; font-family:sans-serif;"><h2 style="color:#00d4ff;">Support Update</h2><p>Hello ${userName},</p><p>${message.replace(/\n/g, '<br>')}</p></div>`
            });
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true }));
        } catch (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Reply failed' }));
        }
    });
};
