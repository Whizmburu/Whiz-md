// WHIZ-MD WhatsApp Bot
// Main entry point

require('dotenv').config();
const fs = require('fs');
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const ytdl = require('ytdl-core');
const YouTube = require('youtube-sr').default; // .default is important for youtube-sr
const ffmpeg = require('fluent-ffmpeg');
const path = require('path'); // For handling file paths
const os = require('os'); // For temporary directory
const FormData = require('form-data'); // For removebg
const { evaluate } = require('mathjs'); // For .calc command
const QRCode = require('qrcode'); // For .qr command
const axios = require('axios'); // For API calls (lyrics, wiki, etc.)
const cheerio = require('cheerio'); // For scraping text effects
const Jimp = require('jimp'); // For image manipulation
const { OpenAI } = require('openai'); // For DALL-E image generation

// Fun Command Handlers
const { handleJokeCommand } = require('./commands/fun/joke.js');
const { handleQuoteCommand } = require('./commands/fun/quote.js');
const { handleFactCommand } = require('./commands/fun/fact.js');
const { handleMemeCommand } = require('./commands/fun/meme.js');
const { handle8BallCommand } = require('./commands/fun/8ball.js');
const { handleTruthCommand } = require('./commands/fun/truth.js');
const { handleDareCommand } = require('./commands/fun/dare.js');
const { handleHugCommand } = require('./commands/fun/hug.js');
const { handleSlapCommand } = require('./commands/fun/slap.js');
const { handleKissCommand } = require('./commands/fun/kiss.js');
const { handlePatCommand } = require('./commands/fun/pat.js');
const { handleShipCommand } = require('./commands/fun/ship.js');

// Game Command Handlers
const { handleRollCommand } = require('./commands/games/roll.js');
const { handleGuessCommand } = require('./commands/games/guess.js');
const { handleRiddleCommand, handleAnswerCommand: handleRiddleAnswerCommand } = require('./commands/games/riddle.js');
const { handleTTTCommand } = require('./commands/games/ttt.js');
const { handleHangmanCommand } = require('./commands/games/hangman.js');
const { handleSlotCommand } = require('./commands/games/slot.js');
const { handleTriviaCommand, handleTriviaAnswer } = require('./commands/games/trivia.js');
const { handleConnect4Command } = require('./commands/games/connect4.js');
const { handleSudokuCommand } = require('./commands/games/sudoku.js');

// Group Command Handlers
const { handleAddCommand } = require('./commands/group/add.js');
const { handleKickCommand } = require('./commands/group/kick.js');
const { handlePromoteCommand } = require('./commands/group/promote.js');
const { handleDemoteCommand } = require('./commands/group/demote.js');
const { handleLinkCommand } = require('./commands/group/link.js');
const { handleTagallCommand } = require('./commands/group/tagall.js');
const { handleHidetagCommand } = require('./commands/group/hidetag.js');
const { handleMuteCommand } = require('./commands/group/mute.js');
const { handleUnmuteCommand } = require('./commands/group/unmute.js');
const { handleSetnameCommand } = require('./commands/group/setname.js');
const { handleSetdescCommand } = require('./commands/group/setdesc.js');
const { handleSetppCommand } = require('./commands/group/setpp.js');

// Owner Command Handlers
const { handleBlockCommand } = require('./commands/owner/block.js');
const { handleUnblockCommand } = require('./commands/owner/unblock.js');
const { handleBroadcastCommand } = require('./commands/owner/broadcast.js');
const { handleSendCommand } = require('./commands/owner/send.js');
const { handleShutdownCommand } = require('./commands/owner/shutdown.js');
const { handleRestartCommand } = require('./commands/owner/restart.js');
const { handleGetsessionCommand } = require('./commands/owner/getsession.js');
const { handleEvalCommand } = require('./commands/owner/eval.js');
const { handleAutoviewCommand } = require('./commands/owner/autoview.js');
const { handleAutoreactCommand } = require('./commands/owner/autoreact.js');
const { handleSetreactionsCommand } = require('./commands/owner/setreactions.js');

// Info & Fetcher Command Handlers
const { handleProfileCommand } = require('./commands/info/profile.js');
const { handleNumberInfoCommand } = require('./commands/info/numberinfo.js');
const { handleGithubCommand } = require('./commands/info/github.js');
const { handleNpmCommand } = require('./commands/info/npm.js');
const { handleAnimeCommand } = require('./commands/info/anime.js');
const { handleQuoteImgCommand } = require('./commands/info/quoteimg.js');
const { handleCovidCommand } = require('./commands/info/covid.js');
const { handleQotdCommand } = require('./commands/info/qotd.js');

// Misc/Extras Command Handlers
const { handleVvCommand } = require('./commands/misc/vv.js');
const { handleEmojimixCommand } = require('./commands/misc/emojimix.js');
const { handleLogomakerCommand, handleLogostylesCommand } = require('./commands/misc/logomaker.js');
const { handleBirthdayCommand } = require('./commands/misc/birthday.js');

// AI Command Handlers
const { handleImageCommand } = require('./commands/ai/image.js');


// Active games state management (in-memory)
const activeGames = {};

// Status Automation Settings (in-memory)
let autoViewEnabled = true;
let autoReactEnabled = true;
let autoReactionEmojis = ['🔥', '💥', '🕳', '👾', '🤣', '👎', '🧡']; // Default set
let birthdays = {};

// Logo Maker Styles Configuration
const availableLogoStyles = {
    'neongalaxy': { url: 'https://textpro.me/neon-light-text-effect-with-galaxy-background-1069.html', inputs: 1, category: 'textpro' },
    'hubstyle': { url: 'https://en.ephoto360.com/create-a-logo-in-the-style-of-pornhub-online-676.html', inputs: 2, category: 'ephoto360' },
};

// Load theme/config
let theme = {};
const defaultStartupErrorNoSession = "CRITICAL ERROR: WHIZMD_SESSION_DATA environment variable not found or invalid. It must start with 'WHIZMD_'. Please set it correctly. You can generate a session at https://whizmdsessions.onrender.com. The bot will now exit.";
const defaultWelcomeMessage1 = "❀━━━━━━━━━━━━❀\n❀ *{botName}* is now Live{liveEmoji}\n❀ Welcome and Enjoy{welcomeEmoji}\n❀ Repo : {repoLink}\n❀ Owner : https://wa.me/254754783683\n❀ *_Kindly Fork me, it means a lot{forkEmoji}_*\n❀━━━━━━━━━━━━❀";
const defaultWelcomeMessage2Prefix = "Here is the full command menu:";
let totalCommandCount = 0;

try {
    const themeFileContent = fs.readFileSync('./Themes/WHIZ.json', 'utf8');
    theme = JSON.parse(themeFileContent);
} catch (e) {
    console.error("Failed to load or parse Themes/WHIZ.json. Proceeding with default messages.", e);
    theme = {};
}

// Ensure theme.messages and critical messages have fallbacks
if (!theme.messages || typeof theme.messages !== 'object') {
    theme.messages = {};
}
theme.messages.startupErrorNoSession = theme.messages.startupErrorNoSession || defaultStartupErrorNoSession;
theme.messages.welcomeMessage1 = theme.messages.welcomeMessage1 || defaultWelcomeMessage1;
theme.messages.welcomeMessage2Prefix = theme.messages.welcomeMessage2Prefix || defaultWelcomeMessage2Prefix;

// Ensure theme.emojis exists and has defaults
if (!theme.emojis || typeof theme.emojis !== 'object') {
    theme.emojis = {};
}
theme.emojis.live = theme.emojis.live || "🌀";
theme.emojis.welcome = theme.emojis.welcome || "👋";
theme.emojis.fork = theme.emojis.fork || "🙏";
theme.emojis.ping = theme.emojis.ping || "🏓";
theme.emojis.uptime = theme.emojis.uptime || "⏱️";
theme.emojis.owner = theme.emojis.owner || "👑";

if (!theme.menu || typeof theme.menu !== 'object') {
    theme.menu = { sections: [] };
    console.warn("Warning: theme.menu was not defined. Menu functionality will be limited.");
}
if (!theme.menu.sections || !Array.isArray(theme.menu.sections)) {
    theme.menu.sections = [];
}
if (!theme.signatures || typeof theme.signatures !== 'object') {
    theme.signatures = {};
}

if (theme.menu && theme.menu.sections && Array.isArray(theme.menu.sections)) {
    theme.menu.sections.forEach(section => {
        if (section.commands && Array.isArray(section.commands)) {
            totalCommandCount += section.commands.length;
        }
    });
}


const ownerNumber = process.env.OWNER_NUMBER;
const botPrefix = process.env.BOT_PREFIX || '.';

const sessionDataEnv = process.env.WHIZMD_SESSION_DATA;
if (!sessionDataEnv || !sessionDataEnv.startsWith('WHIZMD_')) {
    console.error(theme.messages.startupErrorNoSession);
    process.exit(1);
}

const actualSessionData = sessionDataEnv.substring('WHIZMD_'.length);
const SESSION_FILE_PATH_DIR = './whizmd_session_data';
const CLIENT_ID = 'whizmd';

try {
    const decodedSessionData = Buffer.from(actualSessionData, 'base64').toString('utf-8');
    if (!fs.existsSync(SESSION_FILE_PATH_DIR)) {
        fs.mkdirSync(SESSION_FILE_PATH_DIR, { recursive: true });
    }
    const sessionClientPath = path.join(SESSION_FILE_PATH_DIR, `session-${CLIENT_ID}`);
     if (!fs.existsSync(sessionClientPath)) {
        fs.mkdirSync(sessionClientPath, { recursive: true });
    }
    console.log("WHIZ-MD: Session ID check passed. Decoded session data obtained.");
    console.log(`LocalAuth will use/create session files in: ${sessionClientPath}`);
} catch (e) {
    console.error("Failed to decode session data from WHIZMD_SESSION_DATA.", e);
}

const client = new Client({
    authStrategy: new LocalAuth({
        clientId: CLIENT_ID,
        dataPath: SESSION_FILE_PATH_DIR
    }),
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu'
        ],
    },
    webVersionCache: {
        type: 'remote',
        remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html',
    }
});

client.on('qr', (qr) => {
    console.log('QR Code Received, scan it with your phone!');
    qrcode.generate(qr, { small: true });
});

client.on('authenticated', () => {
    console.log('WHIZ-MD: Authenticated successfully!');
});

client.on('auth_failure', msg => {
    console.error('WHIZ-MD: AUTHENTICATION FAILURE', msg);
    const sessionDir = path.join(SESSION_FILE_PATH_DIR, `session-${CLIENT_ID}`);
    if (fs.existsSync(sessionDir)) {
        fs.rmSync(sessionDir, { recursive: true, force: true });
        console.log("Removed potentially corrupt session data. Please restart the bot to rescan QR code.");
    }
    process.exit(1);
});

function getFullMenuText() {
    const menuConfig = theme.menu;
    const defaultTitle = `❀━【 💎* _${theme.botName || 'WHIZ-MD'} MENU_━━━ *╮`;
    const defaultHeaderEnd = "*❀━━━━━━━━━━━━━╯*";
    const defaultSectionSeparator = "❀━━━━━━━━━━━━❀";
    const defaultSectionTitleFormat = "*❀* ✦✦✦ *{sectionTitle}* ✦✦✦";
    const defaultCommandFormat = "*❀* ┃ *{commandName}*";
    const defaultFooterEnd = "*❀━━━━━━━━━━━━━━╯*";

    if (!menuConfig || !menuConfig.sections || !Array.isArray(menuConfig.sections) || menuConfig.sections.length === 0) {
        let header = (theme.MENU_HEADER || defaultTitle)
            .replace('{commandCount}', totalCommandCount)
            .replace('{version}', theme.version || '1.0.0')
            .replace('{repoLink}', theme.repoLink || "N/A")
            .replace('{groupLink}', theme.groupLink || "N/A")
            .replace(/{prefix}/g, botPrefix)
            .replace('{botName}', theme.botName || 'WHIZ-MD')
            .replace('{ownerName}', theme.ownerName || "WHIZ");
        let footer = (theme.MENU_FOOTER || "_Type `{prefix}help` for details_").replace(/{prefix}/g, botPrefix);
        return `${header}\n\n[Menu body not available or empty due to configuration in Themes/WHIZ.json]\n\n${footer}`;
    }

    let menuText = `${(menuConfig.title || defaultTitle).replace('{botName}', theme.botName || 'WHIZ-MD')}\n`;

    (menuConfig.header || []).forEach(line => {
        menuText += `${line
            .replace('{ownerName}', theme.ownerName || "WHIZ")
            .replace(/{prefix}/g, botPrefix)
            .replace('{commandCount}', totalCommandCount)
            .replace('{version}', theme.version || '1.0.0')
            .replace('{repoLink}', theme.repoLink || "N/A")
            .replace('{groupLink}', theme.groupLink || "N/A")
        }\n`;
    });
    menuText += `${menuConfig.headerEnd || defaultHeaderEnd}\n\n`;

    if (menuConfig.instructions && Array.isArray(menuConfig.instructions)) {
        menuConfig.instructions.forEach(line => {
            menuText += `${line.replace(/{prefix}/g, botPrefix)}\n`;
        });
        menuText += "\n";
    }

    menuConfig.sections.forEach(section => {
        menuText += `${menuConfig.sectionSeparator || defaultSectionSeparator}\n`;
        menuText += `${(menuConfig.sectionTitleFormat || defaultSectionTitleFormat).replace('{sectionTitle}', section.title)}\n`;
        if (section.commands && Array.isArray(section.commands)) {
            section.commands.forEach(cmd => {
                menuText += `${(menuConfig.commandFormat || defaultCommandFormat).replace('{commandName}', cmd)}\n`;
            });
        }
    });
    menuText += `${menuConfig.sectionSeparator || defaultSectionSeparator}\n`;

    if (menuConfig.footer && Array.isArray(menuConfig.footer)) {
        menuConfig.footer.forEach(line => {
            menuText += `${line.replace(/{prefix}/g, botPrefix)}\n`;
        });
    }
    menuText += `${menuConfig.footerEnd || defaultFooterEnd}`;

    const signature = (theme.signatures && theme.signatures.textOnlyAppend) || `\n\n*~ Powered by ${theme.botName || 'WHIZ-MD'} ~*`;
    return `${menuText.trim()}${signature}`;
}

const startTime = Date.now();

function formatUptime(ms) {
    let seconds = Math.floor(ms / 1000);
    let minutes = Math.floor(seconds / 60);
    let hours = Math.floor(minutes / 60);
    let days = Math.floor(hours / 24);
    seconds %= 60; minutes %= 60; hours %= 24;
    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}

function sanitizeFilename(filename) {
    return filename.replace(/[<>:"/\\|?*]+/g, '_').substring(0, 100);
}

async function getChatParticipant(chat, contactId) {
    if (!chat.isGroup) return null;
    return chat.participants.find(p => p.id._serialized === contactId);
}

async function isUserAdmin(chat, contactId) {
    if (!chat.isGroup) return false;
    const participant = await getChatParticipant(chat, contactId);
    return participant ? participant.isAdmin || participant.isSuperAdmin : false;
}

async function isBotAdmin(chat, clientInstance) {
    if (!chat.isGroup) return false;
    return isUserAdmin(chat, clientInstance.info.wid._serialized);
}

function isOwner(messageAuthorOrId) {
    const ownerNum = process.env.OWNER_NUMBER;
    if (!ownerNum) {
        console.warn("OWNER_NUMBER is not set in .env file. Owner commands will not work.");
        return false;
    }
    const userId = typeof messageAuthorOrId === 'string' ? messageAuthorOrId.split('_')[0].split('@')[0] : null;
    const ownerId = ownerNum.split('@')[0];
    return userId === ownerId;
}

async function sendSignedTextReply(msg, textContent, currentTheme) {
    try {
        const signature = (currentTheme.signatures && currentTheme.signatures.textOnlyAppend) || '';
        const fullMessage = `${textContent}${signature}`;
        await msg.reply(fullMessage.trim());
    } catch (error) {
        console.error("Error in sendSignedTextReply:", error);
    }
}

async function sendSignedMessage(clientInstance, chatId, textContent, currentTheme) {
    try {
        const signature = (currentTheme.signatures && currentTheme.signatures.textOnlyAppend) || '';
        const fullMessage = `${textContent}${signature}`;
        await clientInstance.sendMessage(chatId, fullMessage.trim());
    } catch (error) {
        console.error("Error in sendSignedMessage:", error);
    }
}

async function generateTextEffect(effectPageUrl, textInputs = [], effectName = "effect") {
    if (!textInputs || textInputs.length === 0) throw new Error("No text provided for the effect.");
    try {
        const initialPageResponse = await axios.get(effectPageUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        const cookies = initialPageResponse.headers['set-cookie'] ? initialPageResponse.headers['set-cookie'].join('; ') : '';
        const $ = cheerio.load(initialPageResponse.data);
        const formActionUrl = $('#effect-form, #form_value_maker, form[action*="effect/create-image"]').attr('action');
        const token = $('input[name="token"]').val();
        const buildServer = $('input[name="build_server"]').val();
        const buildServerId = $('input[name="build_server_id"]').val();
        if (!formActionUrl) throw new Error(`Failed to find form action for ${effectName}.`);
        const postUrl = new URL(formActionUrl, effectPageUrl).toString();
        const formData = new URLSearchParams();
        textInputs.forEach(text => formData.append('text[]', text));
        if (token) formData.append('token', token);
        if (buildServer) formData.append('build_server', buildServer);
        if (buildServerId) formData.append('build_server_id', buildServerId);
        formData.append('submit', 'Go');
        const postResponse = await axios.post(postUrl, formData, { headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'Mozilla/5.0', 'Cookie': cookies, 'Referer': effectPageUrl }});
        let finalImageUrl;
        if (typeof postResponse.data === 'object' && postResponse.data.image_url) {
            finalImageUrl = postResponse.data.image_url;
        } else if (typeof postResponse.data === 'string') {
            const $$ = cheerio.load(postResponse.data);
            finalImageUrl = $$('#image-container img, .image-container img, #result-image, .result-image img, img[id*="image"], img[class*="result"]').attr('src');
            if (!finalImageUrl && postResponse.data.includes("image_url")) {
                const match = postResponse.data.match(/"image_url"\s*:\s*"([^"]+)"/);
                if (match && match[1]) finalImageUrl = match[1];
            }
        }
        if (!finalImageUrl) throw new Error(`Failed to extract final image URL for ${effectName}.`);
        finalImageUrl = new URL(finalImageUrl, effectPageUrl).toString();
        const imageResponse = await axios.get(finalImageUrl, { responseType: 'arraybuffer', headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': postUrl }});
        const imageBuffer = Buffer.from(imageResponse.data, 'binary');
        const mimeType = imageResponse.headers['content-type'] || 'image/jpeg';
        return new MessageMedia(mimeType, imageBuffer.toString('base64'), `${effectName.replace(/\s+/g, '_')}.jpg`);
    } catch (error) {
        console.error(`Error in generateTextEffect for ${effectName} (${effectPageUrl}):`, error.message);
        throw new Error(`Failed to generate ${effectName} image. ${error.message}`);
    }
}

client.on('ready', async () => {
    console.log('WHIZ-MD: Client is ready!');
    const currentBotName = client.info.pushname || theme.botName || 'WHIZ-MD';
    console.log(`Bot Name: ${currentBotName}`);
    const loggedInAs = client.info.wid ? (client.info.wid._serialized || client.info.wid.user) : "UNKNOWN";
    console.log(`Logged in as: ${loggedInAs}`);

    const selfChatId = client.info.wid ? client.info.wid._serialized : null;

    console.log("--- DEBUG: Entering 'ready' event ---");
    console.log("Attempting to send welcome message to selfChatId:", selfChatId);
    console.log("Type of theme:", typeof theme);
    try {
        console.log("theme object content (full):", JSON.stringify(theme, null, 2));
    } catch (e) {
        console.log("theme object content (full): Error stringifying theme -", e.message);
        console.log("theme object content (partial messages):", theme.messages);
        console.log("theme object content (partial emojis):", theme.emojis);
        console.log("theme object content (partial menu title):", theme.menu ? theme.menu.title : "theme.menu undefined");
    }
    console.log("Type of theme.messages:", typeof theme.messages);
    if (theme.messages) {
        console.log("theme.messages content:", JSON.stringify(theme.messages, null, 2));
        console.log("Value of theme.messages.welcomeMessage1:", theme.messages.welcomeMessage1);
    } else {
        console.log("theme.messages is undefined or not an object.");
    }
    console.log("Type of theme.emojis:", typeof theme.emojis);
     if (theme.emojis) {
        console.log("theme.emojis content:", JSON.stringify(theme.emojis, null, 2));
    } else {
        console.log("theme.emojis is undefined or not an object.");
    }

    if (selfChatId) {
        try {
            let welcomeMsg1String = (theme.messages && theme.messages.welcomeMessage1) ? theme.messages.welcomeMessage1 : defaultWelcomeMessage1;
            console.log("Initial welcomeMsg1String:", welcomeMsg1String);

            welcomeMsg1String = welcomeMsg1String
                .replace('{botName}', currentBotName)
                .replace('{repoLink}', theme.repoLink || "github.com/whizmburu/WHIZ-MD")
                .replace('{liveEmoji}', (theme.emojis && theme.emojis.live) || '🌀')
                .replace('{welcomeEmoji}', (theme.emojis && theme.emojis.welcome) || '👋')
                .replace('{forkEmoji}', (theme.emojis && theme.emojis.fork) || '🙏');

            console.log("Processed welcomeMsg1String:", welcomeMsg1String);
            await sendSignedMessage(client, selfChatId, welcomeMsg1String.trim(), theme);
            console.log("Welcome message 1 sent to self chat (or attempted).");

            let menuHeaderTextString = (theme.messages && theme.messages.welcomeMessage2Prefix) ? theme.messages.welcomeMessage2Prefix : defaultWelcomeMessage2Prefix;
            console.log("Initial menuHeaderTextString:", menuHeaderTextString);
            const fullMenu = getFullMenuText();
            console.log("Generated fullMenu length:", fullMenu.length);

            await sendSignedMessage(client, selfChatId, `${menuHeaderTextString}\n\n${fullMenu.trim()}`, theme);
            console.log("Welcome message 2 (menu) sent to self chat (or attempted).");

        } catch (error) {
            console.error("Failed to send welcome message. Error details:", error);
            console.error("Error name:", error.name);
            console.error("Error message:", error.message);
            console.error("Error stack:", error.stack);
        }
    } else {
        console.warn("Could not determine self chat ID (client.info.wid._serialized is null/undefined). Welcome message NOT sent.");
    }
});

client.on('message', async (msg) => {
    if (msg.body && msg.body.toLowerCase().startsWith('save') && msg.hasQuotedMsg) {
        const quotedMsg = await msg.getQuotedMessage();
        if (quotedMsg.from === 'status@broadcast' && quotedMsg.hasMedia) {
            const chat = await msg.getChat();
            try {
                await chat.sendStateTyping();
                const statusAuthorId = quotedMsg.author;
                if (!statusAuthorId) {
                    await sendSignedTextReply(msg, theme.STATUS_SAVE_FAIL_NO_AUTHOR || "Could not identify status author.", theme);
                    await chat.clearState(); return;
                }
                const statusAuthorContact = await client.getContactById(statusAuthorId);
                const authorName = statusAuthorContact.pushname || statusAuthorContact.name || statusAuthorId.split('@')[0];
                await sendSignedTextReply(msg, (theme.STATUS_SAVE_SAVING || "💾 Saving status from {userName}...").replace('{userName}', authorName), theme);
                const media = await quotedMsg.downloadMedia();
                if (!media) {
                    await sendSignedTextReply(msg, (theme.STATUS_SAVE_FAIL_DOWNLOAD || "❌ Failed to download status media.").replace('{userName}', authorName), theme);
                    await chat.clearState(); return;
                }
                await client.sendMessage(msg.from, media, { caption: (theme.signatures && theme.signatures.downloadedBy) || `Downloaded by ${theme.botName || "WHIZ-MD"}` });
                if (theme.STATUS_SAVE_SUCCESS) await sendSignedTextReply(msg, theme.STATUS_SAVE_SUCCESS, theme);
                await chat.clearState();
            } catch (error) {
                console.error("Error in status save feature:", error);
                const errorText = (theme.STATUS_SAVE_FAIL || "❌ Failed to save status.") + ` (Error: ${error.message})`;
                await sendSignedTextReply(msg, errorText, theme);
                if (chat) await chat.clearState();
            }
            return;
        }
    }

    if (!msg.body || !msg.body.startsWith(botPrefix)) return;

    const args = msg.body.slice(botPrefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();
    const contact = await msg.getContact();
    const messageTimestamp = msg.timestamp ? msg.timestamp * 1000 : Date.now();

    console.log(`Command: ${botPrefix}${commandName}, Args: [${args.join(', ')}], From: ${contact.pushname} (${msg.author || msg.from})`);

    if (commandName === 'ping') {
        const chat = await msg.getChat();
        try {
            await chat.sendStateTyping();
            const latency = Date.now() - messageTimestamp;
            let pongMsg = (theme.PING_REPLY || "{pingEmoji} Pong! Latency: {latency}ms");
            if (!pongMsg.includes("{pingEmoji}") && theme.emojis) pongMsg = (theme.emojis.ping || '🏓') + " " + pongMsg;
            pongMsg = pongMsg.replace('{pingEmoji}', (theme.emojis && theme.emojis.ping) || '🏓').replace('{latency}', latency);
            await sendSignedTextReply(msg, pongMsg, theme);
            await chat.clearState();
        } catch (e) { console.error("Ping error", e); if(chat) await chat.clearState(); }
        return;
    }
    if (commandName === 'menu') {
        const chat = await msg.getChat();
        try {
            await chat.sendStateTyping();
            await sendSignedTextReply(msg, getFullMenuText(), theme);
            await chat.clearState();
        } catch (e) { console.error("Menu error", e); if(chat) await chat.clearState(); }
        return;
    }
     if (commandName === 'help') {
        const chat = await msg.getChat();
        try {
            await chat.sendStateTyping();
            const query = args.join(' ').trim();
            const menuConfig = theme.menu;

            if (!menuConfig || !menuConfig.sections) {
                await sendSignedTextReply(msg, "Menu configuration is missing or incomplete.", theme);
                await chat.clearState(); return;
            }

            if (!query) {
                let helpText = (theme.HELP_CATEGORY_LIST_HEADER || "Categories:\n").replace(/{prefix}/g, botPrefix);
                menuConfig.sections.forEach((s, i) => { helpText += (theme.HELP_CATEGORY_ITEM_FORMAT || "\n{num}. {title}").replace('{num}', i + 1).replace('{title}', s.title); });
                await sendSignedTextReply(msg, helpText.trim(), theme);
            } else {
                const catNum = parseInt(query);
                let foundCat = null;
                if (!isNaN(catNum) && catNum > 0 && catNum <= menuConfig.sections.length) foundCat = menuConfig.sections[catNum - 1];
                else foundCat = menuConfig.sections.find(s => s.title.toLowerCase().includes(query.toLowerCase()));

                if (foundCat) {
                    let catHelp = (theme.HELP_COMMANDS_IN_CATEGORY_HEADER || "In {title}:\n").replace('{title}', foundCat.title).replace(/{prefix}/g, botPrefix);
                    foundCat.commands.forEach(cmd => { catHelp += (theme.HELP_COMMANDS_IN_CATEGORY_ITEM_FORMAT || "\n- {prefix}{cmd}").replace('{prefix}', botPrefix).replace('{cmd}', cmd.toLowerCase()); });
                    await sendSignedTextReply(msg, catHelp.trim(), theme);
                } else {
                    let foundCmd = null;
                    for (const section of menuConfig.sections) {
                        const cmdDetail = section.commands.find(c => c.toLowerCase() === query.toLowerCase());
                        if (cmdDetail) { foundCmd = { name: cmdDetail, desc: `Help for ${cmdDetail}. (Desc pending)`, usage: `${cmdDetail.toLowerCase()} ...`, ex: `${cmdDetail.toLowerCase()} ...`, alias: "N/A" }; break; }
                    }
                    if (foundCmd) {
                        let specHelp = (theme.HELP_SPECIFIC_COMMAND_HEADER || "Help for .{cmd}:\n").replace(/{cmd}/g, foundCmd.name.toLowerCase()).replace(/{prefix}/g, botPrefix);
                        specHelp += (theme.HELP_SPECIFIC_COMMAND_DESCRIPTION || "\nDesc: {desc}").replace('{desc}', foundCmd.desc);
                        specHelp += (theme.HELP_SPECIFIC_COMMAND_USAGE || "\nUsage: {prefix}{usage}").replace('{prefix}', botPrefix).replace('{usage}', foundCmd.usage);
                        if (foundCmd.alias !== "N/A") specHelp += (theme.HELP_SPECIFIC_COMMAND_ALIASES || "\nAlias: {alias}").replace('{alias}', foundCmd.alias);
                        specHelp += (theme.HELP_SPECIFIC_COMMAND_EXAMPLE || "\nEx: {prefix}{ex}").replace('{prefix}', botPrefix).replace('{ex}', foundCmd.ex);
                        await sendSignedTextReply(msg, specHelp.trim(), theme);
                    } else {
                        await sendSignedTextReply(msg, (theme.HELP_CATEGORY_NOT_FOUND || "Category/Command not found.").replace('{query}', query).replace(/{prefix}/g, botPrefix), theme);
                    }
                }
            }
            await chat.clearState();
        } catch (e) { console.error("Help error", e); await sendSignedTextReply(msg, "Error fetching help.", theme); if(chat) await chat.clearState(); }
        return;
    }

    const commandRouter = {
        'repo': async (m) => sendSignedTextReply(m, theme.REPO_MSG || "Repo link not configured.", theme),
        'time': async (m) => {
            const now = new Date();
            const serverTime = now.toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' });
            const utcTime = now.toLocaleTimeString('en-US', { timeZone: 'UTC', hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' });
            const replyMsg = `${((theme.messages && theme.messages.dateTimeCommand && theme.messages.dateTimeCommand.serverTime) || "Server Time: {time}").replace('{time}', serverTime)}\n` +
                           `${((theme.messages && theme.messages.dateTimeCommand && theme.messages.dateTimeCommand.utcTime) || "UTC Time: {time}").replace('{time}', utcTime + ' UTC')}`;
            await sendSignedTextReply(m, replyMsg.trim(), theme);
        },
        'date': async (m) => {
            const now = new Date();
            const serverDate = now.toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
            const utcDate = now.toLocaleDateString('en-GB', { timeZone: 'UTC', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
            const replyMsg = `${((theme.messages && theme.messages.dateTimeCommand && theme.messages.dateTimeCommand.serverDate) || "Server Date: {date}").replace('{date}', serverDate)}\n` +
                           `${((theme.messages && theme.messages.dateTimeCommand && theme.messages.dateTimeCommand.utcDate) || "UTC Date: {date}").replace('{date}', utcDate + ' (UTC)')}`;
            await sendSignedTextReply(m, replyMsg.trim(), theme);
        },
        'speedtest': async (m) => sendSignedTextReply(m, ((theme.messages && theme.messages.speedtestCommand && theme.messages.speedtestCommand.info) || "Test speed at speedtest.net"), theme),
        'ip': async (m, a) => {
            const query = a.join(' ');
            if (!query) { await sendSignedTextReply(m, ((theme.messages && theme.messages.ipCommand && theme.messages.ipCommand.noQuery) || "Provide IP/domain.").replace('{prefix}', botPrefix), theme); return; }
            try {
                const response = await axios.get(`http://ip-api.com/json/${encodeURIComponent(query)}?fields=status,message,country,countryCode,regionName,city,isp,query`);
                if (response.data && response.data.status === 'success') await sendSignedTextReply(m, `IP Details for ${response.data.query}: ${response.data.city}, ${response.data.regionName}, ${response.data.country} (ISP: ${response.data.isp})`, theme);
                else await sendSignedTextReply(m, "Could not fetch IP details.", theme);
            } catch { await sendSignedTextReply(m, "Error fetching IP details.", theme); }
        },
        'shorturl': async (m, a) => { /* ... */ },
        'translate': async (m, a) => { /* ... */ },
        'weather': async (m, a) => { /* ... */ },
        'qr': async (m, a) => { /* ... */ },
        'wiki': async (m, a) => { /* ... */ },
        'calc': async (m, a) => { /* ... */ },
        'joke': handleJokeCommand, 'quote': handleQuoteCommand, 'fact': handleFactCommand, 'meme': handleMemeCommand,
        '8ball': handle8BallCommand, 'truth': handleTruthCommand, 'dare': handleDareCommand, 'hug': handleHugCommand,
        'slap': handleSlapCommand, 'kiss': handleKissCommand, 'pat': handlePatCommand, 'ship': handleShipCommand,
        'image': handleImageCommand, 'dalle': handleImageCommand,
        'vv': handleVvCommand, 'emojimix': handleEmojimixCommand, 'logomaker': handleLogomakerCommand,
        'logostyles': handleLogostylesCommand, 'qotd': handleQotdCommand, 'birthday': handleBirthdayCommand,
        'add': handleAddCommand, 'kick': handleKickCommand, 'promote': handlePromoteCommand, 'demote': handleDemoteCommand,
        'link': handleLinkCommand, 'tagall': handleTagallCommand, 'hidetag': handleHidetagCommand, 'mute': handleMuteCommand,
        'unmute': handleUnmuteCommand, 'setname': handleSetnameCommand, 'setdesc': handleSetdescCommand, 'setpp': handleSetppCommand,
        'profile': handleProfileCommand, 'numberinfo': handleNumberInfoCommand, 'github': handleGithubCommand,
        'npm': handleNpmCommand, 'anime': handleAnimeCommand, 'quoteimg': handleQuoteImgCommand, 'covid': handleCovidCommand,
        'roll': handleRollCommand, 'guess': handleGuessCommand, 'riddle': handleRiddleCommand, 'ttt': handleTTTCommand,
        'hangman': handleHangmanCommand, 'slot': handleSlotCommand, 'trivia': handleTriviaCommand,
        'skipquiz': handleTriviaCommand, 'stopquiz': handleTriviaCommand,
        'connect4': handleConnect4Command, 'c4': handleConnect4Command, 'sudoku': handleSudokuCommand,
        'block': handleBlockCommand, 'unblock': handleUnblockCommand, 'broadcast': handleBroadcastCommand,
        'send': handleSendCommand, 'shutdown': handleShutdownCommand, 'restart': handleRestartCommand,
        'getsession': handleGetsessionCommand, 'eval': handleEvalCommand, 'autoview': handleAutoviewCommand,
        'autoreact': handleAutoreactCommand, 'setreactions': handleSetreactionsCommand,
        'status': async (m) => { await sendSignedTextReply(m, ((theme.messages && theme.messages.status) || "Status...").replace('{uptime}',formatUptime(Date.now() - startTime)).replace('{botName}', theme.botName || "WHIZ-MD").replace('{commandsCount}', totalCommandCount).replace('{prefix}', botPrefix).replace('{version}', theme.version || "1.0.0"), theme);},
        'runtime': async (m) => { await sendSignedTextReply(m, ((theme.messages && theme.messages.runtime) || "Runtime...").replace('{uptimeEmoji}', (theme.emojis && theme.emojis.uptime) || '⏱️').replace('{runtimeValue}',formatUptime(Date.now() - startTime)), theme);},
        'play': async (m,a) => { if (!a.join(' ')) {await sendSignedTextReply(m, "Provide song name",theme); return;} await sendSignedTextReply(m, `Playing ${a.join(' ')}... (Full logic needed)`, theme); /* Full ytdl logic */},
        'ytmp3': async (m,a) => { if (!a[0]) {await sendSignedTextReply(m, "Provide YT URL",theme); return;} await sendSignedTextReply(m, `Downloading MP3 from ${a[0]}... (Full logic needed)`, theme); /* Full ytdl logic */},
        'ytmp4': async (m,a) => { if (!a[0]) {await sendSignedTextReply(m, "Provide YT URL",theme); return;} await sendSignedTextReply(m, `Downloading MP4 from ${a[0]}... (Full logic needed)`, theme); /* Full ytdl logic */},
        'lyrics': async (m,a) => { if (!a.join(' ')) {await sendSignedTextReply(m, "Provide song name for lyrics",theme); return;} await sendSignedTextReply(m, `Fetching lyrics for ${a.join(' ')}... (Full logic needed)`, theme); /* Full API logic */},
        'fire': async(m,a) => { if (!a.join(' ')) {await sendSignedTextReply(m, "Provide text for fire effect",theme); return;} await sendSignedTextReply(m, (theme.TEXT_EFFECT_GENERATING || "Generating fire text...").replace('{styleName}','Fire').replace('{text}',a.join(' ')), theme); /* Full generateTextEffect */},
        'textstyles': async(m) => await sendSignedTextReply(m, (theme.TEXT_STYLES_AVAILABLE || "Available styles..."), theme),
        'sticker': async(m) => await sendSignedTextReply(m, ((theme.messages && theme.messages.stickerCommand && theme.messages.stickerCommand.creating) || "Creating sticker..."), theme),
    };

    if (commandRouter[commandName]) {
        try {
            // For commands needing specific contexts like `isOwner` or game states
            if (['block', 'unblock', 'broadcast', 'send', 'shutdown', 'restart', 'getsession', 'eval', 'autoview', 'autoreact', 'setreactions'].includes(commandName)) {
                if (isOwner(msg.author || msg.from)) {
                    const statusAutomationState = { autoViewEnabled, autoReactEnabled, autoReactionEmojis, birthdays };
                     await commandRouter[commandName](msg, args, client, theme, botPrefix, activeGames, isOwner, statusAutomationState, {birthdays});
                } else {
                    await sendSignedTextReply(msg, (theme.messages.ownerCmd && theme.messages.ownerCmd.unauthorized) || "Owner only.", theme);
                }
            } else if (['connect4', 'c4', 'sudoku', 'ttt', 'hangman', 'riddle', 'guess', 'slot', 'trivia', 'roll', 'birthday', 'logomaker', 'logostyles'].includes(commandName)) {
                 await commandRouter[commandName](msg, args, client, theme, botPrefix, activeGames, isOwner, null, generateTextEffect, availableLogoStyles); // Pass more args
            } else {
                await commandRouter[commandName](msg, args, client, theme, botPrefix, activeGames);
            }
        } catch (error) {
            console.error(`Error executing command ${botPrefix}${commandName}:`, error);
            await sendSignedTextReply(msg, (theme.messages.commandError || "❌ Error executing command."), theme);
        }
        return;
    }

    // Special handling for .answer (contextual to game)
    if (commandName === 'answer') {
        const chatId = msg.from;
        const activeGame = activeGames[chatId];
        if (activeGame) {
            try {
                if (activeGame.gameType === 'riddle') {
                    await handleRiddleAnswerCommand(msg, args, client, theme, botPrefix, activeGames);
                } else if (activeGame.gameType === 'trivia') {
                    await handleTriviaAnswer(msg, args, client, theme, botPrefix, activeGames);
                } else {
                    await sendSignedTextReply(msg, "There's no active game expecting an answer right now.", theme);
                }
            } catch (error) {
                 console.error(`Unhandled error in .answer command for ${activeGame.gameType}:`, error);
                 await sendSignedTextReply(msg, `❌ An unexpected error occurred while processing your answer.`, theme);
            }
        } else {
            await sendSignedTextReply(msg, "There's no active game expecting an answer right now. Try starting a riddle or trivia game!", theme);
        }
        return;
    }

    // Fallback for truly unknown commands
    let cmdNotFoundMsg = ((theme.messages && theme.messages.commandNotFound) || "❌ Command `{commandName}` not found. Type `{prefix}help` to see the menu.")
        .replace('{commandName}', commandName)
        .replace(/{prefix}/g, botPrefix);
    await sendSignedTextReply(msg, cmdNotFoundMsg, theme);


    // Autoview & Autoreact to Statuses
    if (msg.from === 'status@broadcast' && msg.author && msg.author !== (client.info.wid ? client.info.wid._serialized : null) ) {
        const statusAuthorId = msg.author;
        if (autoViewEnabled) {
            try { await client.sendSeen(statusAuthorId); }
            catch (viewError) { console.error(`Failed to autoview status from ${statusAuthorId}:`, viewError.message); }
        }
        if (autoReactEnabled && autoReactionEmojis.length > 0) {
            await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1500));
            try {
                const randomReaction = autoReactionEmojis[Math.floor(Math.random() * autoReactionEmojis.length)];
                await msg.react(randomReaction);
            } catch (reactError) { console.error(`Failed to autoreact to status from ${statusAuthorId}:`, reactError.message); }
        }
    }
});

console.log("WHIZ-MD: Initializing WhatsApp client...");
client.initialize().catch(err => {
    console.error("WHIZ-MD: Client initialization error", err);
    process.exit(1);
});
