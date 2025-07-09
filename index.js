// WHIZ-MD WhatsApp Bot
// Main entry point

require('dotenv').config();
const fs = require('fs');
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const ytdl = require('ytdl-core');
const YouTube = require('youtube-sr').default;
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const os = require('os');
const FormData = require('form-data');
const { evaluate } = require('mathjs');
const QRCode = require('qrcode');
const axios = require('axios');
const cheerio = require('cheerio');
const Jimp = require('jimp');
const { OpenAI } = require('openai');

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

const activeGames = {};
let autoViewEnabled = true;
let autoReactEnabled = true;
let autoReactionEmojis = ['🔥', '💥', '🕳', '👾', '🤣', '👎', '🧡'];
let birthdays = {};
const availableLogoStyles = {
    'neongalaxy': { url: 'https://textpro.me/neon-light-text-effect-with-galaxy-background-1069.html', inputs: 1, category: 'textpro' },
    'hubstyle': { url: 'https://en.ephoto360.com/create-a-logo-in-the-style-of-pornhub-online-676.html', inputs: 2, category: 'ephoto360' },
};

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

if (!theme.messages || typeof theme.messages !== 'object') {
    theme.messages = {};
}
theme.messages.startupErrorNoSession = theme.messages.startupErrorNoSession || defaultStartupErrorNoSession;
theme.messages.welcomeMessage1 = theme.messages.welcomeMessage1 || defaultWelcomeMessage1;
theme.messages.welcomeMessage2Prefix = theme.messages.welcomeMessage2Prefix || defaultWelcomeMessage2Prefix;

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
    if (!fs.existsSync(SESSION_FILE_PATH_DIR)) {
        fs.mkdirSync(SESSION_FILE_PATH_DIR, { recursive: true });
    }
    const sessionClientPath = path.join(SESSION_FILE_PATH_DIR, `session-${CLIENT_ID}`);
     if (!fs.existsSync(sessionClientPath)) {
        fs.mkdirSync(sessionClientPath, { recursive: true });
    }
    console.log("WHIZ-MD: Session ID check passed."); // Simplified log
    console.log(`LocalAuth will use/create session files in: ${sessionClientPath}`);
} catch (e) {
    console.error("Error preparing session directory.", e);
}

const client = new Client({
    authStrategy: new LocalAuth({ clientId: CLIENT_ID, dataPath: SESSION_FILE_PATH_DIR }),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-accelerated-2d-canvas', '--no-first-run', '--no-zygote', '--disable-gpu'],
    },
    webVersionCache: { type: 'remote', remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html' }
});

client.on('qr', qr => { qrcode.generate(qr, { small: true }); console.log("Scan QR and restart if session ENV VAR is not set/valid."); });
client.on('authenticated', () => console.log('WHIZ-MD: Authenticated successfully!'));
client.on('auth_failure', msg => {
    console.error('WHIZ-MD: AUTHENTICATION FAILURE', msg);
    const sessionDir = path.join(SESSION_FILE_PATH_DIR, `session-${CLIENT_ID}`);
    if (fs.existsSync(sessionDir)) {
        try { fs.rmSync(sessionDir, { recursive: true, force: true }); console.log("Removed potentially corrupt session data."); }
        catch (e) { console.error("Error removing session dir:", e); }
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
            .replace('{commandCount}', totalCommandCount).replace('{version}', theme.version || '1.0.0')
            .replace('{repoLink}', theme.repoLink || "N/A").replace('{groupLink}', theme.groupLink || "N/A")
            .replace(/{prefix}/g, botPrefix).replace('{botName}', theme.botName || 'WHIZ-MD').replace('{ownerName}', theme.ownerName || "WHIZ");
        let footer = (theme.MENU_FOOTER || "_Type `{prefix}help` for details_").replace(/{prefix}/g, botPrefix);
        return `${header}\n\n[Menu body not available or empty due to configuration in Themes/WHIZ.json]\n\n${footer}`;
    }
    let menuText = `${(menuConfig.title || defaultTitle).replace('{botName}', theme.botName || 'WHIZ-MD')}\n`;
    (menuConfig.header || []).forEach(line => {
        menuText += `${line.replace('{ownerName}', theme.ownerName || "WHIZ").replace(/{prefix}/g, botPrefix)
            .replace('{commandCount}', totalCommandCount).replace('{version}', theme.version || '1.0.0')
            .replace('{repoLink}', theme.repoLink || "N/A").replace('{groupLink}', theme.groupLink || "N/A")}\n`;
    });
    menuText += `${menuConfig.headerEnd || defaultHeaderEnd}\n\n`;
    if (menuConfig.instructions && Array.isArray(menuConfig.instructions)) {
        menuConfig.instructions.forEach(line => { menuText += `${line.replace(/{prefix}/g, botPrefix)}\n`; });
        menuText += "\n";
    }
    menuConfig.sections.forEach(section => {
        menuText += `${menuConfig.sectionSeparator || defaultSectionSeparator}\n`;
        menuText += `${(menuConfig.sectionTitleFormat || defaultSectionTitleFormat).replace('{sectionTitle}', section.title)}\n`;
        if (section.commands && Array.isArray(section.commands)) {
            section.commands.forEach(cmd => { menuText += `${(menuConfig.commandFormat || defaultCommandFormat).replace('{commandName}', cmd)}\n`; });
        }
    });
    menuText += `${menuConfig.sectionSeparator || defaultSectionSeparator}\n`;
    if (menuConfig.footer && Array.isArray(menuConfig.footer)) {
        menuConfig.footer.forEach(line => { menuText += `${line.replace(/{prefix}/g, botPrefix)}\n`; });
    }
    menuText += `${menuConfig.footerEnd || defaultFooterEnd}`;
    const signature = (theme.signatures && theme.signatures.textOnlyAppend) || `\n\n*~ Powered by ${theme.botName || 'WHIZ-MD'} ~*`;
    return `${menuText.trim()}${signature}`;
}

const startTime = Date.now();
let isReadyLogicExecuted = false; // Flag to prevent multiple executions

client.on('ready', async () => {
    if (isReadyLogicExecuted) {
        console.log("WHIZ-MD: Subsequent 'ready' event triggered. Ignoring to prevent duplicate actions.");
        return;
    }
    isReadyLogicExecuted = true;
    console.log('WHIZ-MD: Client is ready! (First execution)');

    const currentBotName = client.info.pushname || theme.botName || 'WHIZ-MD';
    console.log(`Bot Name: ${currentBotName}`);
    const loggedInAs = client.info.wid ? (client.info.wid._serialized || client.info.wid.user) : "UNKNOWN";
    console.log(`Logged in as: ${loggedInAs}`);

    const selfChatId = client.info.wid ? client.info.wid._serialized : null;

    console.log("--- DEBUG: Entering 'ready' event ---");
    console.log("Attempting to send welcome message to selfChatId:", selfChatId);
    // console.log("theme object content (full):", JSON.stringify(theme, null, 2)); // Already logged in your output

    if (selfChatId) {
        setTimeout(async () => { // Added delay
            try {
                console.log("--- DEBUG: Attempting to send welcome messages after delay ---");
                let welcomeMsg1String = (theme.messages && theme.messages.welcomeMessage1) ? theme.messages.welcomeMessage1 : defaultWelcomeMessage1;
                welcomeMsg1String = welcomeMsg1String
                    .replace('{botName}', currentBotName)
                    .replace('{repoLink}', theme.repoLink || "github.com/whizmburu/WHIZ-MD")
                    .replace('{liveEmoji}', (theme.emojis && theme.emojis.live) || '🌀')
                    .replace('{welcomeEmoji}', (theme.emojis && theme.emojis.welcome) || '👋')
                    .replace('{forkEmoji}', (theme.emojis && theme.emojis.fork) || '🙏');

                await sendSignedMessage(client, selfChatId, welcomeMsg1String.trim(), theme);
                console.log("Welcome message 1 sent to self chat (or attempted).");

                let menuHeaderTextString = (theme.messages && theme.messages.welcomeMessage2Prefix) ? theme.messages.welcomeMessage2Prefix : defaultWelcomeMessage2Prefix;
                const fullMenu = getFullMenuText();

                await sendSignedMessage(client, selfChatId, `${menuHeaderTextString}\n\n${fullMenu.trim()}`, theme);
                console.log("Welcome message 2 (menu) sent to self chat (or attempted).");

            } catch (error) {
                console.error("Failed to send welcome message after delay. Error details:", error);
            }
        }, 5000); // 5 second delay
    } else {
        console.warn("Could not determine self chat ID. Welcome message NOT sent.");
    }
});

client.on('message', async (msg) => {
    console.log(`--- DEBUG: Message received --- From: ${msg.from}, Type: ${msg.type}, Body: "${msg.body ? msg.body.substring(0, 100) + (msg.body.length > 100 ? '...' : '') : '<No Body>'}"`); // Added comprehensive log

    // --- Reply-based Status Save (No Prefix) ---
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
        'time': async (m) => { /* ... */ }, 'date': async (m) => { /* ... */ },
        'speedtest': async (m) => { /* ... */ }, 'ip': async (m, a) => { /* ... */ },
        'shorturl': async (m, a) => { /* ... */ }, 'translate': async (m, a) => { /* ... */ },
        'weather': async (m, a) => { /* ... */ }, 'qr': async (m, a) => { /* ... */ },
        'wiki': async (m, a) => { /* ... */ }, 'calc': async (m, a) => { /* ... */ },
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
        'status': async (m) => { /* ... */}, 'runtime': async (m) => { /* ... */},
        'play': async (m,a) => { /* ... */ }, 'ytmp3': async (m,a) => { /* ... */ },
        'ytmp4': async (m,a) => { /* ... */ }, 'lyrics': async (m,a) => { /* ... */ },
        'fire': async(m,a) => { /* ... */ }, 'textstyles': async(m) => { /* ... */ },
        'sticker': async(m) => { /* ... */ },
    };

    if (commandRouter[commandName]) {
        try {
            if (['block', 'unblock', 'broadcast', 'send', 'shutdown', 'restart', 'getsession', 'eval', 'autoview', 'autoreact', 'setreactions'].includes(commandName)) {
                if (isOwner(msg.author || msg.from)) {
                    const statusAutomationState = { autoViewEnabled, autoReactEnabled, autoReactionEmojis, birthdays };
                     await commandRouter[commandName](msg, args, client, theme, botPrefix, activeGames, isOwner, statusAutomationState, {birthdays});
                } else {
                    await sendSignedTextReply(msg, (theme.messages.ownerCmd && theme.messages.ownerCmd.unauthorized) || "Owner only.", theme);
                }
            } else if (['connect4', 'c4', 'sudoku', 'ttt', 'hangman', 'riddle', 'guess', 'slot', 'trivia', 'roll', 'birthday', 'logomaker', 'logostyles'].includes(commandName)) {
                 await commandRouter[commandName](msg, args, client, theme, botPrefix, activeGames, isOwner, null, generateTextEffect, availableLogoStyles);
            } else {
                await commandRouter[commandName](msg, args, client, theme, botPrefix, activeGames);
            }
        } catch (error) {
            console.error(`Error executing command ${botPrefix}${commandName}:`, error);
            await sendSignedTextReply(msg, (theme.messages.commandError || "❌ Error executing command."), theme);
        }
        return;
    }

    if (commandName === 'answer') {
        // ... (answer logic)
        return;
    }

    let cmdNotFoundMsg = ((theme.messages && theme.messages.commandNotFound) || "❌ Command `{commandName}` not found. Type `{prefix}help`.")
        .replace('{commandName}', commandName).replace(/{prefix}/g, botPrefix);
    await sendSignedTextReply(msg, cmdNotFoundMsg, theme);

    if (msg.from === 'status@broadcast' && msg.author && msg.author !== (client.info.wid ? client.info.wid._serialized : null) ) {
        // ... (status view/react logic)
    }
});

console.log("WHIZ-MD: Initializing WhatsApp client...");
client.initialize().catch(err => {
    console.error("WHIZ-MD: Client initialization error", err);
    process.exit(1);
});
