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

// Info & Fetcher Command Handlers
const { handleProfileCommand } = require('./commands/info/profile.js');
const { handleNumberInfoCommand } = require('./commands/info/numberinfo.js');
const { handleGithubCommand } = require('./commands/info/github.js');
const { handleNpmCommand } = require('./commands/info/npm.js');
const { handleAnimeCommand } = require('./commands/info/anime.js');
const { handleQuoteImgCommand } = require('./commands/info/quoteimg.js');
const { handleCovidCommand } = require('./commands/info/covid.js');
const { handleAutoviewCommand } = require('./commands/owner/autoview.js');
const { handleAutoreactCommand } = require('./commands/owner/autoreact.js');
const { handleSetreactionsCommand } = require('./commands/owner/setreactions.js');
// const { handlePriorityViewCommand } = require('./commands/owner/priorityview.js'); // Removed

// Misc/Extras Command Handlers
const { handleVvCommand } = require('./commands/misc/vv.js');
const { handleEmojimixCommand } = require('./commands/misc/emojimix.js');
const { handleLogomakerCommand, handleLogostylesCommand } = require('./commands/misc/logomaker.js');
const { handleBirthdayCommand } = require('./commands/misc/birthday.js');
const { handleQotdCommand } = require('./commands/info/qotd.js'); // Assuming qotd is in info

// AI Command Handlers
const { handleImageCommand } = require('./commands/ai/image.js');

// Active games state management (in-memory)
const activeGames = {};

// Status Automation Settings (in-memory)
let autoViewEnabled = true;
let autoReactEnabled = true;
let autoReactionEmojis = ['🔥', '💥', '🕳', '👾', '🤣', '👎', '🧡']; // Default set
// let priorityViewList = []; // Removed
let birthdays = {}; // Stores birthdays, e.g., { "userId@c.us": "DD/MM" }

// Logo Maker Styles Configuration
const availableLogoStyles = {
    'neongalaxy': { url: 'https://textpro.me/neon-light-text-effect-with-galaxy-background-1069.html', inputs: 1, category: 'textpro' },
    'hubstyle': { url: 'https://en.ephoto360.com/create-a-logo-in-the-style-of-pornhub-online-676.html', inputs: 2, category: 'ephoto360' },
    // Add more styles here as { styleName: { url: 'page_url', inputs: numberOfTextInputs, category: 'textpro'/'ephoto360'/etc } }
    // The 'category' can help if generateTextEffect needs to adapt for different site structures.
};


// Load theme/config
let theme = {};
try {
    theme = JSON.parse(fs.readFileSync('./Themes/WHIZ.json', 'utf8'));
} catch (e) {
    console.error("Failed to load Themes/WHIZ.json. Proceeding with default messages.", e);
    // Define critical default messages if theme loading fails
    theme.messages = theme.messages || {};
    theme.messages.startupErrorNoSession = theme.messages.startupErrorNoSession || "CRITICAL ERROR: WHIZMD_SESSION_DATA environment variable not found or invalid. It must start with 'WHIZMD_'. Please set it correctly. You can generate a session at https://whizmdsessions.onrender.com. The bot will now exit.";
}


const ownerNumber = process.env.OWNER_NUMBER; // e.g., "1234567890@c.us"
const botPrefix = process.env.BOT_PREFIX || '.';

// Session ID Check
const sessionDataEnv = process.env.WHIZMD_SESSION_DATA;

if (!sessionDataEnv || !sessionDataEnv.startsWith('WHIZMD_')) {
    console.error(theme.messages.startupErrorNoSession);
    process.exit(1);
}

// Extract the actual session data part
const actualSessionData = sessionDataEnv.substring('WHIZMD_'.length);

// WHIZMD_SESSION_DATA is expected to be the Base64 encoded JSON content of the session.
// LocalAuth by default uses a folder structure like: {dataPath}/session-{clientId}/
// We will set dataPath to a specific folder and ensure the session file is written there.
const SESSION_FILE_PATH_DIR = './whizmd_session_data'; // LocalAuth will create this directory
const CLIENT_ID = 'whizmd'; // ClientId for LocalAuth

try {
    const decodedSessionData = Buffer.from(actualSessionData, 'base64').toString('utf-8');
    // LocalAuth will look for files inside SESSION_FILE_PATH_DIR/session-CLIENT_ID/
    // The main session file is typically WWebVersion (or similar, depends on wwebjs version)
    // For simplicity, we'll assume actualSessionData is the content of the main session file.
    // whatsapp-web.js LocalAuth handles the structure internally. We just provide the clientId.
    // The "session" directory is created by LocalAuth. We need to ensure our env var handling
    // is compatible with how LocalAuth would store/retrieve if it were to generate the session itself.

    // If the session data from ENV is meant to *BE* the session file:
    if (!fs.existsSync(SESSION_FILE_PATH_DIR)) {
        fs.mkdirSync(SESSION_FILE_PATH_DIR, { recursive: true });
    }
    const sessionClientPath = `${SESSION_FILE_PATH_DIR}/session-${CLIENT_ID}`;
     if (!fs.existsSync(sessionClientPath)) {
        fs.mkdirSync(sessionClientPath, { recursive: true });
    }
    // whatsapp-web.js v1.23.0 creates a file named 'Default' inside the session-<clientId> folder
    // and inside that, a JSON file, typically WWebVersion.
    // This is tricky to replicate perfectly without knowing the exact internal structure expected by LocalAuth
    // from a raw session string.
    // A more robust way for whatsapp-web.js is to let LocalAuth handle file creation.
    // If a session string is provided, it implies we might need a different auth strategy
    // or that the string is meant to be written to a *specific file* that LocalAuth reads.

    // For now, let's log that we have the data. The client initialization will use LocalAuth
    // and if the session directory is empty, it will generate a QR code.
    // If the session is valid (from a previous run where it was saved by LocalAuth), it will use it.
    // The ENV VAR approach here is more like a "backup" or "initial seed" that needs to be
    // correctly injected into LocalAuth's expected file structure.

    console.log("WHIZ-MD: Session ID check passed. Decoded session data obtained.");
    console.log("Note: For whatsapp-web.js with LocalAuth, if the session directory is empty or invalid, a new QR scan will be required.");
    console.log(`LocalAuth will use/create session files in: ${SESSION_FILE_PATH_DIR}/session-${CLIENT_ID}`);

    // If the `actualSessionData` is indeed the content of the primary session file (e.g. WWebVersion's JSON content)
    // We would write it to the specific file. This is an assumption.
    // Example: fs.writeFileSync(`${sessionClientPath}/WWebVersion`, decodedSessionData);
    // However, LocalAuth might have a more complex structure with multiple files.

} catch (e) {
    console.error("Failed to decode or prepare session data from WHIZMD_SESSION_DATA. This might be due to invalid Base64 string or other issues.", e);
    console.log("The bot will attempt to start and may require a QR scan if an existing valid session is not found by LocalAuth.");
    // It's not necessarily a fatal error to exit here, as LocalAuth might recover or prompt QR.
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
            // '--single-process', // Desabilitado para evitar problemas no Linux
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
    console.log("If you provide WHIZMD_SESSION_DATA, it should ideally prevent this QR scan on subsequent runs if the session is valid and correctly placed for LocalAuth.");
});

client.on('authenticated', () => {
    console.log('WHIZ-MD: Authenticated successfully!');
});

client.on('auth_failure', msg => {
    // Fired if session restore was unsuccessfull
    console.error('WHIZ-MD: AUTHENTICATION FAILURE', msg);
    // Potentially delete the session data so it tries to rescan next time
    const sessionDir = `${SESSION_FILE_PATH_DIR}/session-${CLIENT_ID}`;
    if (fs.existsSync(sessionDir)) {
        fs.rmSync(sessionDir, { recursive: true, force: true });
        console.log("Removed potentially corrupt session data. Please restart the bot to rescan QR code.");
    }
    process.exit(1); // Exit so the user can restart and get a new QR
});


// Function to generate the full menu text
function getFullMenuText() {
    const menuConfig = theme.menu;
    if (!menuConfig) return "Menu configuration is missing in Themes/WHIZ.json";

    let menuText = `${menuConfig.title.replace('{botName}', theme.botName || 'WHIZ-MD')}\n\n`;

    menuConfig.header.forEach(line => {
        menuText += `${line
            .replace('{prefix}', botPrefix)
            .replace('{commandCount}', totalCommandCount)
            .replace('{version}', theme.version || '1.0.0')
            // botName is already in the title, but if any header line specifically needs it:
            // .replace('{botName}', theme.botName || 'WHIZ-MD')
        }\n`;
    });
    menuText += `${menuConfig.headerEnd}\n\n`;

    menuConfig.instructions.forEach(line => {
        menuText += `${line.replace(/{prefix}/g, botPrefix)}\n`; // Replaced dot with {prefix}
    });
    // The first separator is handled by the structure, then before each section.
    // menuText += `\n${menuConfig.sectionSeparator || theme.borders.sectionSeparator}\n`;

    menuConfig.sections.forEach(section => {
        menuText += `\n${menuConfig.sectionSeparator || theme.borders.sectionSeparator}\n`; // Separator before section title
        menuText += `${menuConfig.sectionTitleFormat.replace('{sectionTitle}', section.title)}\n`;
        section.commands.forEach(cmd => {
            menuText += `${menuConfig.commandFormat.replace('{commandName}', cmd)}\n`;
        });
    });
    // The last separator is handled by the structure (after last section, before footer)
    menuText += `${menuConfig.sectionSeparator || theme.borders.sectionSeparator}\n`;

    menuText += `\n${menuConfig.footer}\n`;
    menuText += `${menuConfig.footerEnd}`;

    return menuText.trim(); // Trim overall to remove any leading/trailing newlines from assembly
}


const startTime = Date.now(); // Store bot start time

// Calculate total commands once
let totalCommandCount = 0;
if (theme.menu && theme.menu.sections) {
    theme.menu.sections.forEach(section => {
        totalCommandCount += section.commands.length;
    });
}

function formatUptime(ms) {
    let seconds = Math.floor(ms / 1000);
    let minutes = Math.floor(seconds / 60);
    let hours = Math.floor(minutes / 60);
    let days = Math.floor(hours / 24);

    seconds %= 60;
    minutes %= 60;
    hours %= 24;

    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}

function sanitizeFilename(filename) {
    return filename.replace(/[<>:"/\\|?*]+/g, '_').substring(0, 100); // Replace invalid chars and limit length
}

// --- Group Command Helper Functions ---
async function getChatParticipant(chat, contactId) {
    if (!chat.isGroup) return null;
    return chat.participants.find(p => p.id._serialized === contactId);
}

async function isUserAdmin(chat, contactId) {
    if (!chat.isGroup) return false;
    const participant = await getChatParticipant(chat, contactId);
    return participant ? participant.isAdmin || participant.isSuperAdmin : false;
}

async function isBotAdmin(chat, client) {
    if (!chat.isGroup) return false;
    return isUserAdmin(chat, client.info.wid._serialized);
}
// --- End Group Command Helper Functions ---

// --- Owner Command Helper Function ---
function isOwner(messageAuthorOrId) {
    const ownerNum = process.env.OWNER_NUMBER;
    if (!ownerNum) {
        console.warn("OWNER_NUMBER is not set in .env file. Owner commands will not work.");
        return false;
    }
    // msg.author is for groups (e.g., 12345@c.us_67890@g.us), msg.from is for private chats (e.g., 12345@c.us)
    // We need to compare against the user part of the ID.
    const userId = typeof messageAuthorOrId === 'string' ? messageAuthorOrId.split('_')[0].split('@')[0] : null;
    const ownerId = ownerNum.split('@')[0];
    return userId === ownerId;
}
// --- End Owner Command Helper Function ---


// Helper function for Text Effect Generation (primarily for TextPro.me style sites)
async function generateTextEffect(effectPageUrl, textInputs = [], effectName = "effect") {
    if (!textInputs || textInputs.length === 0) {
        throw new Error("No text provided for the effect.");
    }

    try {
        // Step 1: GET the effect page to get cookies and form details/token
        const initialPageResponse = await axios.get(effectPageUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0' } // Common user agent
        });
        const cookies = initialPageResponse.headers['set-cookie'] ? initialPageResponse.headers['set-cookie'].join('; ') : '';
        const $ = cheerio.load(initialPageResponse.data);

        // Step 2: Scrape form action URL and necessary tokens/parameters
        // These selectors are common for TextPro.me but might need adjustment
        const formActionUrl = $('#effect-form, #form_value_maker, form[action*="effect/create-image"]').attr('action');
        const token = $('input[name="token"]').val();
        const buildServer = $('input[name="build_server"]').val();
        const buildServerId = $('input[name="build_server_id"]').val();

        if (!formActionUrl) {
            console.error(`Could not find form action URL on ${effectPageUrl}`);
            throw new Error(`Failed to find form action for ${effectName}.`);
        }

        const postUrl = new URL(formActionUrl, effectPageUrl).toString(); // Ensure it's an absolute URL

        // Step 3: Prepare form data for POST request
        const formData = new URLSearchParams();
        textInputs.forEach(text => formData.append('text[]', text));
        if (token) formData.append('token', token);
        if (buildServer) formData.append('build_server', buildServer);
        if (buildServerId) formData.append('build_server_id', buildServerId);
        formData.append('submit', 'Go'); // Or 'Create', depends on the site

        // Step 4: Make POST request to generate the image
        const postResponse = await axios.post(postUrl, formData, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'Mozilla/5.0',
                'Cookie': cookies,
                'Referer': effectPageUrl
            }
        });

        // Step 5: Parse POST response to find the final image URL
        // TextPro.me often returns JSON with image URL or HTML containing it
        let finalImageUrl;
        if (typeof postResponse.data === 'object' && postResponse.data.image_url) { // JSON response
            finalImageUrl = postResponse.data.image_url;
        } else if (typeof postResponse.data === 'string') { // HTML response
            const $$ = cheerio.load(postResponse.data);
            finalImageUrl = $$('#image-container img, .image-container img, #result-image, .result-image img').attr('src');
            if (!finalImageUrl) { // Try another common pattern if first fails
                 finalImageUrl = $$('img[id*="image"], img[class*="result"]').attr('src');
            }
             if (!finalImageUrl && postResponse.data.includes("image_url")) { // Check if URL is in a script tag as string
                const match = postResponse.data.match(/"image_url"\s*:\s*"([^"]+)"/);
                if (match && match[1]) finalImageUrl = match[1];
            }
        }

        if (!finalImageUrl) {
            console.error('Could not find final image URL in POST response from:', postUrl, 'Response Data:', postResponse.data);
            throw new Error(`Failed to extract final image URL for ${effectName}.`);
        }

        // Ensure finalImageUrl is absolute
        finalImageUrl = new URL(finalImageUrl, effectPageUrl).toString();


        // Step 6: Download the final image
        const imageResponse = await axios.get(finalImageUrl, {
            responseType: 'arraybuffer',
            headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': postUrl }
        });

        // Step 7: Create MessageMedia
        const imageBuffer = Buffer.from(imageResponse.data, 'binary');
        const mimeType = imageResponse.headers['content-type'] || 'image/jpeg'; // Default to jpeg if not specified
        return new MessageMedia(mimeType, imageBuffer.toString('base64'), `${effectName.replace(/\s+/g, '_')}.jpg`);

    } catch (error) {
        console.error(`Error in generateTextEffect for ${effectName} (${effectPageUrl}):`, error.message);
        if (error.response) {
            // console.error("Error response data:", error.response.data);
            // console.error("Error response status:", error.response.status);
        }
        throw new Error(`Failed to generate ${effectName} image. ${error.message}`);
    }
}


client.on('ready', async () => {
    console.log('WHIZ-MD: Client is ready!');
    const botName = client.info.pushname || theme.botName || 'WHIZ-MD';
    console.log(`Bot Name: ${botName}`);
    console.log(`Logged in as: ${client.info.wid._serialized || client.info.wid.user}`);

    // Send welcome message to "message yourself" chat
    const selfChatId = client.info.wid._serialized; // Correct way to get self chat ID

    if (selfChatId) {
        try {
            // Message 1: Welcome
            let welcomeMsg1 = theme.messages.welcomeMessage1 || "WHIZ-MD is now Live!";
            welcomeMsg1 = welcomeMsg1
                .replace('{botName}', botName)
                .replace('{liveEmoji}', theme.emojis.live || '🌀')
                .replace('{welcomeEmoji}', theme.emojis.welcome || '👋')
                .replace('{forkEmoji}', theme.emojis.fork || '🙏');

            await client.sendMessage(selfChatId, welcomeMsg1.trim());
            console.log("Welcome message 1 sent to self chat.");

            // Message 2: Full help menu (as a new message, not reply, per user prompt structure)
            let menuHeaderText = theme.messages.welcomeMessage2Prefix || "Here is the full command menu:";
            const fullMenu = getFullMenuText();

            await client.sendMessage(selfChatId, `${menuHeaderText}\n\n${fullMenu.trim()}`);
            console.log("Welcome message 2 (menu) sent to self chat.");

        } catch (error) {
            console.error("Failed to send welcome message:", error);
        }
    } else {
        console.warn("Could not determine self chat ID to send welcome message.");
    }
});

client.on('message', async (msg) => {
    // --- Reply-based Status Save (No Prefix) ---
    if (msg.body && msg.body.toLowerCase().startsWith('save') && msg.hasQuotedMsg) {
        const quotedMsg = await msg.getQuotedMessage();
        // Status messages typically come from 'status@broadcast' and have an 'author' field for the actual sender.
        // Also check if it has media.
        if (quotedMsg.from === 'status@broadcast' && quotedMsg.hasMedia) {
            const chat = await msg.getChat(); // For sendStateTyping
            try {
                await chat.sendStateTyping();
                const statusAuthorId = quotedMsg.author;
                if (!statusAuthorId) {
                    await msg.reply(theme.messages.statusSaveCmd.failNotStatusOrMedia || "Could not identify status author.");
                    await chat.clearState();
                    return;
                }

                const statusAuthorContact = await client.getContactById(statusAuthorId);
                const authorName = statusAuthorContact.pushname || statusAuthorContact.name || statusAuthorId.split('@')[0];

                await msg.reply(theme.messages.statusSaveCmd.saving.replace('{userName}', authorName));

                const media = await quotedMsg.downloadMedia();
                if (!media) {
                    await msg.reply(theme.messages.statusSaveCmd.failDownload);
                    await chat.clearState();
                    return;
                }

                const originalStatusCaption = quotedMsg.body || ""; // Statuses can have text captions
                const finalCaption = theme.messages.statusSaveCmd.caption
                    .replace('{userName}', authorName)
                    .replace('{statusCaption}', originalStatusCaption);

                await client.sendMessage(msg.from, media, { caption: finalCaption.trim() });
                // await msg.reply(theme.messages.statusSaveCmd.success); // Optional success message after sending media

                await chat.clearState();
            } catch (error) {
                console.error("Error in status save feature:", error);
                await msg.reply(theme.messages.statusSaveCmd.failDownload + ` (Error: ${error.message})`);
                if (chat) await chat.clearState();
            }
            return; // Important: stop further processing if it was a save attempt
        }
        // If it wasn't a reply to a status from status@broadcast, let it fall through to command processing.
    }


    if (!msg.body || !msg.body.startsWith(botPrefix)) return; // Ignore non-commands and empty messages

    const args = msg.body.slice(botPrefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    console.log(`Command received: ${commandName}, Args: ${args.join(' ')}`);
    const messageTimestamp = msg.timestamp ? msg.timestamp * 1000 : Date.now(); // Use message timestamp if available

    // Simple Ping command for testing the handler
    if (commandName === 'ping') {
        const chat = await msg.getChat();
        try {
            await chat.sendStateTyping();
            const processingStartTime = Date.now();
            // Latency: time from message arrival (or processing start) to sending reply
            const latency = processingStartTime - messageTimestamp;

            let pongMsg = theme.messages.pongWithLatency || "{pingEmoji} Pong! Latency: {latency}ms";
            pongMsg = pongMsg
                .replace('{pingEmoji}', theme.emojis.ping || '🏓')
                .replace('{latency}', latency);

            await msg.reply(pongMsg);
            await chat.clearState();
        } catch (error) {
            console.error(`Error processing ping command for ${msg.from}:`, error);
            await chat.clearState(); // Ensure state is cleared even on error
        }
        return;
    }

    if (commandName === 'time' || commandName === 'date') {
        const chat = await msg.getChat();
        try {
            // await chat.sendStateTyping(); // Optional for very quick commands

            const now = new Date();

            let replyMsg = "";

            if (commandName === 'time') {
                const serverTime = now.toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' });
                const utcTime = now.toLocaleTimeString('en-US', { timeZone: 'UTC', hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' });

                replyMsg = `${theme.messages.dateTimeCommand.serverTime.replace('{time}', serverTime)}\n` +
                           `${theme.messages.dateTimeCommand.utcTime.replace('{time}', utcTime + ' UTC')}`;
            } else { // commandName === 'date'
                const serverDate = now.toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }); // e.g., Monday, 28 October 2024
                const utcDate = now.toLocaleDateString('en-GB', { timeZone: 'UTC', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

                replyMsg = `${theme.messages.dateTimeCommand.serverDate.replace('{date}', serverDate)}\n` +
                           `${theme.messages.dateTimeCommand.utcDate.replace('{date}', utcDate + ' (UTC)')}`;
            }

            await msg.reply(replyMsg.trim());
            // await chat.clearState(); // Optional

        } catch (error) {
            console.error(`Error processing .${commandName} command:`, error);
            await msg.reply(`❌ Oops! Something went wrong while fetching the ${commandName}.`);
            // await chat.clearState(); // Ensure clear state if it was set
        }
        return;
    }

    if (commandName === 'speedtest') {
        const chat = await msg.getChat(); // Not strictly needed if only replying with static text
        try {
            // await chat.sendStateTyping(); // Optional for static message
            await msg.reply(theme.messages.speedtestCommand.info);
            // await chat.clearState(); // Optional
        } catch (error) {
            console.error("Error sending .speedtest placeholder:", error);
            // Fallback reply if theme message fails for some reason
            await msg.reply("To test your internet speed, please visit a website like https://www.speedtest.net or https://fast.com.");
        }
        return;
    }


    if (commandName === 'ip') {
        const query = args.join(' '); // Can be IP or domain
        if (!query) {
            await msg.reply(theme.messages.ipCommand.noQuery.replace('{prefix}', botPrefix));
            return;
        }

        const chat = await msg.getChat();
        try {
            await chat.sendStateTyping();
            await msg.reply(theme.messages.ipCommand.fetching.replace('{query}', query));

            // ip-api.com provides comprehensive, keyless lookups
            const apiUrl = `http://ip-api.com/json/${encodeURIComponent(query)}?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,query`;
            const response = await axios.get(apiUrl, { timeout: 10000 });

            if (response.data && response.data.status === 'success') {
                const data = response.data;
                let resultMsg = theme.messages.ipCommand.result;
                resultMsg = resultMsg
                    .replace(/{query}/g, data.query) // Use the query returned by API (resolved IP)
                    .replace('{ip}', data.query) // Actual IP address
                    .replace('{country}', data.country || 'N/A')
                    .replace('{countryCode}', data.countryCode || 'N/A')
                    .replace('{regionName}', data.regionName || 'N/A')
                    .replace('{region}', data.region || 'N/A')
                    .replace('{city}', data.city || 'N/A')
                    .replace('{zip}', data.zip || 'N/A')
                    .replace('{lat}', data.lat || 'N/A')
                    .replace('{lon}', data.lon || 'N/A')
                    .replace('{timezone}', data.timezone || 'N/A')
                    .replace('{isp}', data.isp || 'N/A')
                    .replace('{org}', data.org || 'N/A')
                    .replace('{as}', data.as || 'N/A');

                await msg.reply(resultMsg);
            } else {
                const apiErrorMsg = response.data.message || "Invalid input or not found.";
                await msg.reply(theme.messages.ipCommand.notFound.replace('{query}', query) + ` (API: ${apiErrorMsg})`);
            }
            await chat.clearState();

        } catch (error) {
            console.error(`Error processing .ip command for "${query}":`, error.message);
            await msg.reply(theme.messages.ipCommand.apiError);
            await chat.clearState();
        }
        return;
    }


    if (commandName === 'shorturl') {
        const longUrl = args[0];
        if (!longUrl) {
            await msg.reply(theme.messages.shortUrlCommand.noUrl.replace('{prefix}', botPrefix));
            return;
        }

        // Basic URL validation
        try {
            new URL(longUrl); // This will throw an error if the URL is invalid
        } catch (_) {
            await msg.reply(theme.messages.shortUrlCommand.invalidUrl);
            return;
        }

        const chat = await msg.getChat();
        try {
            await chat.sendStateTyping();
            await msg.reply(theme.messages.shortUrlCommand.shortening);

            const apiUrl = `https://is.gd/create.php?format=simple&url=${encodeURIComponent(longUrl)}`;
            const response = await axios.get(apiUrl, { timeout: 7000 }); // 7s timeout

            if (response.status === 200 && response.data && !response.data.toLowerCase().startsWith('error')) {
                const shortenedUrl = response.data.trim();
                await msg.reply(theme.messages.shortUrlCommand.result.replace('{shortenedUrl}', shortenedUrl));
            } else {
                // is.gd might return 200 OK with an error message in the body
                const apiErrorMsg = response.data ? response.data.substring(0, 100) : "Unknown API issue.";
                console.error("is.gd API error:", apiErrorMsg);
                await msg.reply(theme.messages.shortUrlCommand.error + ` (API: ${apiErrorMsg})`);
            }
            await chat.clearState();

        } catch (error) {
            console.error(`Error processing .shorturl for "${longUrl}":`, error.message);
            await msg.reply(theme.messages.shortUrlCommand.error);
            await chat.clearState();
        }
        return;
    }

    if (commandName === 'translate') {
        const chat = await msg.getChat();
        let textToTranslate = "";
        let targetLang = "";

        // Syntax 1: .translate <lang_code> <text...>
        // Syntax 2: .translate <text...> to <lang_code/lang_name>
        const toKeywordIndex = args.findIndex(arg => arg.toLowerCase() === 'to');

        if (args.length < 2) {
            await msg.reply(theme.messages.translateCommand.usage.replace(/{prefix}/g, botPrefix));
            return;
        }

        if (toKeywordIndex > -1 && toKeywordIndex < args.length - 1 && toKeywordIndex > 0) {
            // Syntax: .translate <text...> to <lang>
            textToTranslate = args.slice(0, toKeywordIndex).join(' ');
            targetLang = args.slice(toKeywordIndex + 1).join(' ');
        } else if (args.length >= 2 && args[0].length <= 3 && !args.slice(1).join(' ').includes(' to ')) {
            // Syntax: .translate <lang_code> <text...> (lang_code usually 2-3 chars)
            // And ensure "to" is not part of the text to avoid conflict if lang code is also "to" (unlikely)
            targetLang = args[0];
            textToTranslate = args.slice(1).join(' ');
        } else {
             // Default assumption or fallback: treat the last word as lang if it's short, otherwise it's part of text.
             // This is a bit ambiguous, so the other syntaxes are preferred.
             // For now, let's enforce one of the clearer syntaxes by replying usage.
            await msg.reply(theme.messages.translateCommand.usage.replace(/{prefix}/g, botPrefix));
            return;
        }

        if (!textToTranslate || !targetLang) {
            await msg.reply(theme.messages.translateCommand.usage.replace(/{prefix}/g, botPrefix));
            return;
        }

        try {
            await chat.sendStateTyping();
            await msg.reply(theme.messages.translateCommand.translating
                .replace('{text}', textToTranslate.substring(0, 30) + (textToTranslate.length > 30 ? '...' : ''))
                .replace('{language}', targetLang)
            );

            // MyMemory API: langpair format is source|target, e.g., en|es or auto|es
            // We'll use auto-detect for source language.
            const apiUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(textToTranslate)}&langpair=|${encodeURIComponent(targetLang)}`;

            const response = await axios.get(apiUrl, { timeout: 15000 }); // 15s timeout

            if (response.data && response.data.responseData && response.data.responseStatus === 200) {
                const translatedText = response.data.responseData.translatedText;
                const detectedSourceLang = response.data.responseData.detectedLanguage || "auto-detected";

                // Sometimes MyMemory includes "NO QUERY SPECIFIED!" or similar if it fails.
                if (translatedText.includes("NO QUERY SPECIFIED!") || translatedText.includes("INVALID LANGUAGE PAIR") || translatedText.length === 0) {
                     await msg.reply(theme.messages.translateCommand.error + " (API indicated an issue or no translation found).");
                } else {
                    let resultMsg = theme.messages.translateCommand.result;
                    resultMsg = resultMsg
                        .replace('{language}', `${targetLang} (from ${detectedSourceLang})`)
                        .replace('{translatedText}', translatedText);
                    await msg.reply(resultMsg);
                }
            } else if (response.data && response.data.responseDetails) {
                 await msg.reply(theme.messages.translateCommand.error + ` (API: ${response.data.responseDetails})`);
            }
            else {
                await msg.reply(theme.messages.translateCommand.error);
            }
            await chat.clearState();

        } catch (error) {
            console.error(`Error processing .translate command for "${textToTranslate}" to "${targetLang}":`, error.message);
            await msg.reply(theme.messages.translateCommand.error);
            await chat.clearState();
        }
        return;
    }

    if (commandName === 'weather') {
        const city = args.join(' ');
        const apiKey = process.env.OPENWEATHERMAP_API_KEY;

        if (!city) {
            await msg.reply(theme.messages.weatherCommand.noCity.replace('{prefix}', botPrefix));
            return;
        }
        if (!apiKey) {
            await msg.reply(theme.messages.weatherCommand.noApiKey);
            return;
        }

        const chat = await msg.getChat();
        try {
            await chat.sendStateTyping();
            await msg.reply(theme.messages.weatherCommand.fetching.replace('{city}', city));

            const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`;
            const response = await axios.get(apiUrl, { timeout: 10000 });

            if (response.data && response.data.cod === 200) {
                const weatherData = response.data;
                const main = weatherData.main;
                const wind = weatherData.wind;
                const weatherDesc = weatherData.weather[0].description;
                const sys = weatherData.sys;

                // Function to convert timestamp to HH:MM format in local time (server's local time)
                // For more accurate timezone specific sunrise/sunset, would need weatherData.timezone (offset in seconds from UTC)
                const formatTime = (timestamp) => {
                    const date = new Date((timestamp + weatherData.timezone) * 1000); // Adjust with timezone offset for true local time of city
                    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }); // Display as UTC then user infers
                };
                 const formatTimeWithOffset = (timestamp, offsetSeconds) => {
                    const date = new Date((timestamp + offsetSeconds) * 1000);
                    return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });
                };


                const windDir = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'][Math.floor((wind.deg / 22.5) + 0.5) % 16] || 'N/A';

                let resultMsg = theme.messages.weatherCommand.result;
                resultMsg = resultMsg
                    .replace('{city}', weatherData.name)
                    .replace('{country}', sys.country)
                    .replace('{temp}', main.temp.toFixed(1))
                    .replace('{feelsLike}', main.feels_like.toFixed(1))
                    .replace('{humidity}', main.humidity)
                    .replace('{windSpeed}', wind.speed.toFixed(1))
                    .replace('{windDir}', windDir)
                    .replace('{description}', weatherDesc.charAt(0).toUpperCase() + weatherDesc.slice(1))
                    .replace('{sunrise}', formatTimeWithOffset(sys.sunrise, weatherData.timezone))
                    .replace('{sunset}', formatTimeWithOffset(sys.sunset, weatherData.timezone));

                await msg.reply(resultMsg);

            } else if (response.data && response.data.message) { // OpenWeatherMap often returns error message with cod != 200
                await msg.reply(theme.messages.weatherCommand.notFound.replace('{city}', city) + ` (API: ${response.data.message})`);
            } else {
                 await msg.reply(theme.messages.weatherCommand.notFound.replace('{city}', city));
            }
            await chat.clearState();

        } catch (error) {
            console.error(`Error processing .weather command for "${city}":`, error.message);
            if (error.response && error.response.status === 404) {
                await msg.reply(theme.messages.weatherCommand.notFound.replace('{city}', city));
            } else if (error.response && error.response.data && error.response.data.message) {
                 await msg.reply(theme.messages.weatherCommand.apiError + ` (API: ${error.response.data.message})`);
            }
            else {
                await msg.reply(theme.messages.weatherCommand.apiError);
            }
            await chat.clearState();
        }
        return;
    }


    if (commandName === 'qr') {
        const textToEncode = args.join(' ');
        if (!textToEncode) {
            await msg.reply(theme.messages.qrCommand.noText.replace('{prefix}', botPrefix));
            return;
        }

        const chat = await msg.getChat();
        try {
            await chat.sendStateTyping();
            await msg.reply(theme.messages.qrCommand.generating.replace('{text}', textToEncode.substring(0, 30) + (textToEncode.length > 30 ? '...' : '')));

            // Generate QR code to a buffer
            const qrCodeBuffer = await QRCode.toBuffer(textToEncode, {
                errorCorrectionLevel: 'H', // High error correction
                type: 'png', // Output as PNG buffer
                margin: 2, // Margin around QR code
                scale: 8 // Scale factor for size (pixels per module)
            });

            const qrMedia = new MessageMedia('image/png', qrCodeBuffer.toString('base64'), 'qrcode.png');
            await client.sendMessage(msg.from, qrMedia, { caption: `QR Code for: ${textToEncode.substring(0, 50)}` });

            await chat.clearState();
        } catch (error) {
            console.error(`Error generating QR code for "${textToEncode}":`, error);
            await msg.reply(theme.messages.qrCommand.error);
            await chat.clearState();
        }
        return;
    }

    if (commandName === 'wiki') {
        const query = args.join(' ');
        if (!query) {
            await msg.reply(theme.messages.wikiCommand.noQuery.replace('{prefix}', botPrefix));
            return;
        }

        const chat = await msg.getChat();
        try {
            await chat.sendStateTyping();
            await msg.reply(theme.messages.wikiCommand.searching.replace('{query}', query));

            // Step 1: Search for the article to get the exact title
            const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&srlimit=1`;
            const searchResponse = await axios.get(searchUrl);

            if (!searchResponse.data.query.search || searchResponse.data.query.search.length === 0) {
                await msg.reply(theme.messages.wikiCommand.notFound.replace('{query}', query));
                await chat.clearState();
                return;
            }

            const pageTitle = searchResponse.data.query.search[0].title;

            // Step 2: Get the extract of the found article
            const extractUrl = `https://en.wikipedia.org/w/api.php?action=query&prop=extracts&exintro=true&explaintext=true&titles=${encodeURIComponent(pageTitle)}&format=json&redirects=1`;
            const extractResponse = await axios.get(extractUrl);

            const pages = extractResponse.data.query.pages;
            const pageId = Object.keys(pages)[0]; // Get the first (and likely only) page ID

            if (pageId === "-1" || !pages[pageId].extract) { // Page ID -1 means article not found (e.g. after redirect)
                await msg.reply(theme.messages.wikiCommand.notFound.replace('{query}', pageTitle)); // Use pageTitle here
                await chat.clearState();
                return;
            }

            let summary = pages[pageId].extract;
            // Limit summary length
            const maxSummaryLength = 500; // Adjust as needed
            if (summary.length > maxSummaryLength) {
                summary = summary.substring(0, maxSummaryLength).trim() + "...";
            }

            const articleUrl = `https://en.wikipedia.org/wiki/${encodeURIComponent(pageTitle.replace(/ /g, '_'))}`;

            let resultMsg = theme.messages.wikiCommand.summaryTitle;
            resultMsg = resultMsg
                .replace('{title}', pageTitle)
                .replace('{summary}', summary)
                .replace('{url}', articleUrl);

            await msg.reply(resultMsg);
            await chat.clearState();

        } catch (error) {
            console.error(`Error processing .wiki command for "${query}":`, error);
            await msg.reply(theme.messages.wikiCommand.apiError);
            await chat.clearState();
        }
        return;
    }


    if (commandName === 'calc') {
        const expression = args.join(' ');
        if (!expression) {
            await msg.reply(theme.messages.calcCommand.noExpression.replace('{prefix}', botPrefix));
            return;
        }

        try {
            const chat = await msg.getChat(); // getChat might not be needed if only replying
            // await chat.sendStateTyping(); // Optional for quick commands

            const result = evaluate(expression);
            // Ensure result is a number or something easily stringifiable.
            // math.js evaluate can return functions or complex objects for some inputs.
            if (typeof result === 'function' || (typeof result === 'object' && result !== null && !Array.isArray(result))) {
                 await msg.reply(theme.messages.calcCommand.invalidExpression + " (Cannot evaluate to a simple value).");
            } else {
                await msg.reply(theme.messages.calcCommand.result.replace('{result}', result.toString()));
            }
            // await chat.clearState(); // Optional
        } catch (error) {
            // console.error(`Error in .calc for expression "${expression}":`, error.message);
            await msg.reply(theme.messages.calcCommand.invalidExpression);
        }
        return;
    }


    // --- Placeholder for Advanced Image Effects ---
    if (['triggered', 'glitchimg'].includes(commandName)) {
        const chat = await msg.getChat();
        try {
            await chat.sendStateTyping();
            let replyMsg;
            if (commandName === 'triggered') {
                replyMsg = theme.messages.placeholderImageCommand.triggered;
            } else if (commandName === 'glitchimg') {
                replyMsg = theme.messages.placeholderImageCommand.glitchimg;
            }
            await msg.reply(replyMsg || `.${commandName} is under development.`);
            await chat.clearState();
        } catch (error) {
            console.error(`Error processing placeholder command ${commandName}:`, error);
            await chat.clearState();
        }
        return;
    }

    if (commandName === 'wanted') {
        const chat = await msg.getChat();
        const templatePath = './assets/images/wanted_template.png'; // Ensure this path is correct

        try {
            await chat.sendStateTyping();
            let userImageMedia;

            if (msg.hasQuotedMsg) {
                const quotedMsg = await msg.getQuotedMessage();
                if (quotedMsg.hasMedia && quotedMsg.type === 'image') {
                    userImageMedia = await quotedMsg.downloadMedia();
                }
            } else if (msg.hasMedia && msg.type === 'image') {
                userImageMedia = await msg.downloadMedia();
            }

            if (!userImageMedia) {
                await msg.reply(theme.messages.wantedCommand.noImage);
                await chat.clearState();
                return;
            }

            if (!fs.existsSync(templatePath)) {
                console.error("Wanted template not found at:", templatePath);
                await msg.reply("📜 Wanted poster template is missing. Please contact the bot owner.");
                await chat.clearState();
                return;
            }

            await msg.reply(theme.messages.wantedCommand.creating);

            const userImageBuffer = Buffer.from(userImageMedia.data, 'base64');
            const userImage = await Jimp.read(userImageBuffer);
            const template = await Jimp.read(templatePath);

            // Define coordinates and size for placing the user's image on the template
            // These values are examples and need to be adjusted based on the actual template image
            const targetX = 100; // Example: X-coordinate on template
            const targetY = 150; // Example: Y-coordinate on template
            const targetWidth = 300;  // Example: Width for user image on template
            const targetHeight = 300; // Example: Height for user image on template

            userImage.cover(targetWidth, targetHeight); // Resize and crop to fit target area
            template.composite(userImage, targetX, targetY);

            // Optional: Add text like "WANTED"
            // This requires a Jimp-compatible font (.fnt) or loading a system font if Jimp supports it easily.
            // For simplicity, we'll assume the template already has "WANTED" text or skip dynamic text for now.
            // Example if font is loaded:
            // const font = await Jimp.loadFont(Jimp.FONT_SANS_32_BLACK); // Example generic font
            // template.print(font, textX, textY, "WANTED");


            const outputMimeType = Jimp.MIME_PNG; // Output as PNG to preserve transparency if any
            const outputBuffer = await template.getBufferAsync(outputMimeType);
            const processedImage = new MessageMedia(outputMimeType, outputBuffer.toString('base64'), 'wanted_poster.png');

            await client.sendMessage(msg.from, processedImage, { caption: "🚨 You're Wanted!" });
            await chat.clearState();

        } catch (error) {
            console.error(`Error processing .wanted command:`, error);
            await msg.reply(theme.messages.wantedCommand.error);
            await chat.clearState();
        }
        return;
    }

    // --- Basic Image Filters ---
    const basicImageFilters = ['blur', 'invert', 'sepia', 'circle'];
    if (basicImageFilters.includes(commandName)) {
        const chat = await msg.getChat();
        const filterName = commandName.charAt(0).toUpperCase() + commandName.slice(1);

        try {
            await chat.sendStateTyping();
            let imageMedia;

            if (msg.hasQuotedMsg) {
                const quotedMsg = await msg.getQuotedMessage();
                if (quotedMsg.hasMedia && quotedMsg.type === 'image') {
                    imageMedia = await quotedMsg.downloadMedia();
                }
            } else if (msg.hasMedia && msg.type === 'image') {
                imageMedia = await msg.downloadMedia();
            }

            if (!imageMedia) {
                await msg.reply(theme.messages.imageFilterCommand.noImage);
                await chat.clearState();
                return;
            }

            await msg.reply(theme.messages.imageFilterCommand.applying.replace('{filterName}', filterName));

            const imageBuffer = Buffer.from(imageMedia.data, 'base64');
            const image = await Jimp.read(imageBuffer);

            switch (commandName) {
                case 'blur':
                    const blurAmount = parseInt(args[0]) || 5; // Default blur radius 5 if no arg or invalid
                    image.blur(Math.max(1, Math.min(blurAmount, 50))); // Clamp blur to reasonable values (1-50)
                    break;
                case 'invert':
                    image.invert();
                    break;
                case 'sepia':
                    image.sepia();
                    break;
                case 'circle':
                    image.circle(); // Jimp's circle crop
                    break;
            }

            const outputBuffer = await image.getBufferAsync(imageMedia.mimetype); // Preserve original mimetype if possible
            const processedImage = new MessageMedia(imageMedia.mimetype, outputBuffer.toString('base64'), `filtered_${commandName}.${Jimp.getExtension(imageMedia.mimetype) || 'png'}`);

            await client.sendMessage(msg.from, processedImage, { caption: `🖼️ ${filterName} filter applied!` });
            await chat.clearState();

        } catch (error) {
            console.error(`Error processing .${commandName} filter:`, error);
            await msg.reply(theme.messages.imageFilterCommand.error.replace('{filterName}', filterName));
            await chat.clearState();
        }
        return;
    }

    if (commandName === 'toimg') {
        const chat = await msg.getChat();
        try {
            await chat.sendStateTyping();

            if (!msg.hasQuotedMsg) {
                await msg.reply(theme.messages.toImgCommand.noSticker);
                await chat.clearState();
                return;
            }

            const quotedMsg = await msg.getQuotedMessage();
            if (quotedMsg.type === 'sticker' && quotedMsg.hasMedia) {
                await msg.reply(theme.messages.toImgCommand.converting);
                const stickerMedia = await quotedMsg.downloadMedia(); // This will be a MessageMedia object

                // Send the sticker's media data as a regular image.
                // The stickerMedia object already contains the necessary mimetype and data.
                await client.sendMessage(msg.from, stickerMedia, { caption: "🖼️ Sticker converted to image." });
            } else {
                await msg.reply(theme.messages.toImgCommand.noSticker + " (The replied message is not a sticker or has no media).");
            }
            await chat.clearState();

        } catch (error) {
            console.error(`Error processing .toimg command:`, error);
            await msg.reply(theme.messages.toImgCommand.error);
            await chat.clearState();
        }
        return;
    }

    if (commandName === 'removebg') {
        const chat = await msg.getChat();
        const apiKey = process.env.REMOVEBG_API_KEY;

        if (!apiKey) {
            await msg.reply(theme.messages.removeBgCommand.noApiKey);
            return;
        }

        try {
            await chat.sendStateTyping();
            let imageMedia;

            if (msg.hasQuotedMsg) {
                const quotedMsg = await msg.getQuotedMessage();
                if (quotedMsg.hasMedia && quotedMsg.type === 'image') {
                    imageMedia = await quotedMsg.downloadMedia();
                }
            } else if (msg.hasMedia && msg.type === 'image') {
                imageMedia = await msg.downloadMedia();
            }

            if (!imageMedia) {
                await msg.reply(theme.messages.removeBgCommand.noImage);
                await chat.clearState();
                return;
            }

            await msg.reply(theme.messages.removeBgCommand.processing);

            const formData = new FormData();
            formData.append('image_file', Buffer.from(imageMedia.data, 'base64'), {
                filename: 'image.jpg', // Filename is required by the API
                contentType: imageMedia.mimetype
            });
            formData.append('size', 'auto'); // Or other sizes like 'preview', 'full'

            const response = await axios.post('https://api.remove.bg/v1.0/removebg', formData, {
                headers: {
                    ...formData.getHeaders(),
                    'X-Api-Key': apiKey,
                },
                responseType: 'arraybuffer' // Get image data as buffer
            });

            if (response.status === 200) {
                const processedImage = new MessageMedia('image/png', Buffer.from(response.data).toString('base64'), 'removed_bg.png');
                await client.sendMessage(msg.from, processedImage, { caption: "🖼️ Background removed!" });
            } else {
                // This case might not be hit if axios throws for non-2xx statuses,
                // but good for explicit handling if API returns error JSON with 200.
                console.error("Remove.bg API responded with status:", response.status, response.data);
                await msg.reply(theme.messages.removeBgCommand.apiError + ` (Status: ${response.status})`);
            }
            await chat.clearState();

        } catch (error) {
            console.error(`Error processing .removebg command:`, error.message);
            let errorMsg = theme.messages.removeBgCommand.error;
            if (error.response) {
                // Try to parse error from remove.bg API response
                // response.data might be a buffer, so need to convert to string
                let apiErrorDetails = '';
                try {
                    const errorDataStr = Buffer.from(error.response.data).toString('utf-8');
                    const errorJson = JSON.parse(errorDataStr);
                    if (errorJson.errors && errorJson.errors.length > 0) {
                        apiErrorDetails = errorJson.errors.map(e => e.title || e.detail).join(', ');
                    }
                } catch (parseError) {
                    // If parsing fails, use generic message
                }
                errorMsg = `${theme.messages.removeBgCommand.apiError} ${apiErrorDetails ? `(${apiErrorDetails})` : `(Status: ${error.response.status})`}`;
            }
            await msg.reply(errorMsg);
            await chat.clearState();
        }
        return;
    }


    if (commandName === 'sticker') {
        const chat = await msg.getChat();
        try {
            await chat.sendStateTyping();
            let mediaToProcess;

            if (msg.hasQuotedMsg) {
                const quotedMsg = await msg.getQuotedMessage();
                if (quotedMsg.hasMedia) {
                    mediaToProcess = await quotedMsg.downloadMedia();
                }
            } else if (msg.hasMedia) {
                mediaToProcess = await msg.downloadMedia();
            }

            if (!mediaToProcess) {
                await msg.reply(theme.messages.stickerCommand.noMedia);
                await chat.clearState();
                return;
            }

            // Check if media is image or video (for GIF -> animated sticker)
            if (mediaToProcess.mimetype.startsWith('image/') || mediaToProcess.mimetype.startsWith('video/')) {
                await msg.reply(theme.messages.stickerCommand.creating);

                // Sticker metadata (optional)
                const stickerAuthor = theme.botName || "WHIZ-MD";
                const stickerName = `Sticker by ${msg.author ? msg.author.slice(0, msg.author.indexOf('@')) : 'User'}`; // Use user's pushname part

                await client.sendMessage(msg.from, mediaToProcess, {
                    sendMediaAsSticker: true,
                    stickerName: stickerName,
                    stickerAuthor: stickerAuthor,
                    //stickerCategories: ['cool'] // Optional: Sticker categories
                });
                // await msg.reply(theme.messages.stickerCommand.success); // Optional success message
            } else {
                await msg.reply(theme.messages.stickerCommand.noMedia + " (Unsupported media type)");
            }
            await chat.clearState();

        } catch (error) {
            console.error(`Error processing .sticker command:`, error);
            await msg.reply(theme.messages.stickerCommand.error);
            await chat.clearState();
        }
        return;
    }


    if (commandName === 'textstyles') {
        const chat = await msg.getChat();
        try {
            await chat.sendStateTyping();
            const availableStyles = Object.keys(textEffectCommands);
            const stylesListString = availableStyles.map(style => `➢ \`.${style}\``).join('\n');

            let listMessage = theme.messages.textStylesList || "✨ Available Text Styles ✨\n\n{stylesList}\n\nUse `{prefix}[style_name] [your text]` to generate an image.";
            listMessage = listMessage
                .replace('{stylesList}', stylesListString)
                .replace(/{prefix}/g, botPrefix);

            await msg.reply(listMessage);
            await chat.clearState();
        } catch (error) {
            console.error(`Error processing .textstyles command:`, error);
            await msg.reply("❌ Oops! Something went wrong while fetching the list of text styles.");
            await chat.clearState();
        }
        return;
    }

    // --- Placeholder Media Commands ---
    const placeholderCommands = {
        'shazam': theme.messages.placeholderCommand.shazam,
        'pinterest': theme.messages.placeholderCommand.pinterest,
        'tiktok': theme.messages.placeholderCommand.tiktok,
        'instagram': theme.messages.placeholderCommand.instagram,
        'facebook': theme.messages.placeholderCommand.facebook,
        'spotify': theme.messages.placeholderCommand.spotify,
        'soundcloud': theme.messages.placeholderCommand.soundcloud,
        'joox': theme.messages.placeholderCommand.joox
    };

    if (placeholderCommands[commandName]) {
        const chat = await msg.getChat();
        try {
            await chat.sendStateTyping();
            let replyMsg = placeholderCommands[commandName];
            if (commandName === 'spotify' || commandName === 'soundcloud') {
                const query = args.join(' ') || 'your query';
                replyMsg = replyMsg.replace('{query}', encodeURIComponent(query));
            }
            await msg.reply(replyMsg);
            await chat.clearState();
        } catch (error) {
            console.error(`Error processing placeholder command ${commandName}:`, error);
            await chat.clearState();
        }
        return;
    }

    if (commandName === 'lyrics') {
        const chat = await msg.getChat();
        const query = args.join(' ');

        if (!query) {
            await msg.reply(theme.messages.lyricsCommand.noQuery.replace('{prefix}', botPrefix));
            return;
        }

        try {
            await chat.sendStateTyping();
            await msg.reply(theme.messages.lyricsCommand.searching.replace('{query}', query));

            // Attempt to split query into artist and title if possible, otherwise use full query for title
            // This is a simple heuristic; lyrics.ovh API is flexible.
            // Example: "Bohemian Rhapsody Queen" -> artist: Queen, title: Bohemian Rhapsody
            // If only "Bohemian Rhapsody" -> artist: "", title: Bohemian Rhapsody
            // The API format is https://api.lyrics.ovh/v1/artist/title

            let artist = "";
            let title = query;

            // A simple way to guess artist if multiple words and last words might be artist
            // This is very basic and might not always be accurate.
            // For a more robust solution, one might try to find "by" or "-"
            // or use a more sophisticated NLP approach if available.
            const words = query.split(' ');
            if (words.length > 2) { // Heuristic: if more than 2 words, last one or two could be artist
                // This part can be refined. For now, we'll just pass the query as title.
                // A better approach for lyrics.ovh is to try to parse artist/title or just send the query as title.
                // The API seems to handle "Artist Title" as title sometimes.
            }

            // For lyrics.ovh, the artist/title in the URL needs to be URL encoded.
            // Let's assume the query is mostly the title, or "artist title".
            // The API is a bit fuzzy. We'll try with the full query as title first.
            // If that fails, and there's a clear separator like " by ", we could split.
            // For now, simple approach:

            let apiUrl = `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`;
            if (args.includes('by') && args.indexOf('by') < args.length -1 && args.indexOf('by') > 0) {
                const byIndex = args.indexOf('by');
                artist = args.slice(byIndex + 1).join(' ');
                title = args.slice(0, byIndex).join(' ');
                apiUrl = `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`;
            } else {
                 // If no "by", assume the whole query is the title, or "Artist - Title"
                 // The API might handle "Artist - Title" directly in the title field.
                 apiUrl = `https://api.lyrics.ovh/v1/${encodeURIComponent("")}/${encodeURIComponent(query)}`;
            }


            const response = await axios.get(apiUrl, { timeout: 10000 }); // 10s timeout

            if (response.data && response.data.lyrics) {
                let lyricsText = response.data.lyrics;
                // API sometimes returns instrumental message
                if (lyricsText.toLowerCase().includes("instrumental")) {
                     await msg.reply(`It seems \"${query}\" is an instrumental piece or lyrics are not available.`);
                } else {
                    // Format lyrics: Title + Lyrics
                    // The API doesn't return title/artist in the response, so we use the query.
                    lyricsText = `🎶 *Lyrics for: ${query}*\n\n${lyricsText.trim()}`;
                    // WhatsApp has message length limits (around 4096, but practically less with formatting)
                    // Split into chunks if too long
                    const MAX_LENGTH = 4000;
                    if (lyricsText.length > MAX_LENGTH) {
                        await msg.reply(`Lyrics for \"${query}\" are very long. Sending in parts...`);
                        for (let i = 0; i < lyricsText.length; i += MAX_LENGTH) {
                            await client.sendMessage(msg.from, lyricsText.substring(i, i + MAX_LENGTH));
                        }
                    } else {
                        await client.sendMessage(msg.from, lyricsText);
                    }
                }
            } else {
                // This case might be covered by the catch block if API returns 404 for not found
                await msg.reply(theme.messages.lyricsCommand.notFound.replace('{query}', query));
            }
            await chat.clearState();

        } catch (error) {
            if (error.response && error.response.status === 404) {
                await msg.reply(theme.messages.lyricsCommand.notFound.replace('{query}', query));
            } else {
                console.error(`Error processing .lyrics command for "${query}":`, error.message);
                await msg.reply(theme.messages.lyricsCommand.fetchError);
            }
            await chat.clearState();
        }
        return;
    }

    // --- Text Effect Commands ---
    const textEffectCommands = {
        'fire': 'https://textpro.me/create-a-flaming-text-effect-online-1039.html',
        'neon': 'https://textpro.me/create-a-glowing-neon-text-effect-online-1061.html',
        'glitch': 'https://textpro.me/create-a-glitch-text-effect-online-free-1026.html', // Takes 2 texts
        'steel': 'https://textpro.me/steel-text-effect-online-921.html',
        'wood': 'https://textpro.me/create-3d-wood-text-effect-online-1054.html',
        'ice': 'https://textpro.me/create-realistic-3d-text-effect-frozen-ice-1094.html',
        'gradient': 'https://textpro.me/create-a-gradient-text-effect-online-1092.html',
        // Ephoto360 URLs - may require adjustments to generateTextEffect or a new helper if structure is too different
        'splash': 'https://en.ephoto360.com/create-water-splash-text-effect-online-294.html',
        'comic': 'https://en.ephoto360.com/comic-style-text-effect-596.html',
    };

    if (textEffectCommands[commandName]) {
        const chat = await msg.getChat();
        const text = args.join(' ');
        const effectStyleName = commandName.charAt(0).toUpperCase() + commandName.slice(1); // e.g., "Fire"

        if (!text) {
            let रिप्लाईMsg = theme.messages.textEffectCommand.noText || "⚠️ Please provide text.";
            await msg.reply(रिप्लाईMsg.replace('{prefix}', botPrefix).replace('{commandName}', commandName));
            return;
        }

        try {
            await chat.sendStateTyping();
            let जेनरेटिंगMsg = theme.messages.textEffectCommand.generating || "🎨 Generating...";
            await msg.reply(जेनरेटिंगMsg.replace('{styleName}', effectStyleName).replace('{text}', text.substring(0, 30))); // Show first 30 chars

            let effectPageUrl = textEffectCommands[commandName];
            let textInputs = [text];

            // Special handling for effects known to take multiple inputs
            if (commandName === 'glitch') {
                effectPageUrl = 'https://textpro.me/create-a-glitch-text-effect-online-free-1026.html'; // Ensure correct URL if map is simplified
                if (text.includes('|')) {
                    const parts = text.split('|');
                    textInputs = [parts[0].trim(), parts[1] ? parts[1].trim() : parts[0].trim()];
                } else {
                    textInputs = [text, text];
                }
            }
            // Add other multi-input effects here if any, e.g.
            // if (commandName === 'someOtherEffectWithTwoTexts') {
            //     if (text.includes('|')) { ... } else { textInputs = [text, text]; }
            // }

            const media = await generateTextEffect(effectPageUrl, textInputs, effectStyleName);
            // Sanitize the caption text to prevent WhatsApp formatting issues if it contains special characters like * _ ~ `
            const safeCaptionText = text.replace(/[*_~`]/g, '');
            await client.sendMessage(msg.from, media, { caption: `${effectStyleName} text: ${safeCaptionText.substring(0,50)}` });
            await chat.clearState();

        } catch (error) {
            console.error(`Error processing .${commandName} command for "${text}":`, error);
            await msg.reply(theme.messages.textEffectCommand.apiError || "❌ Error generating image.");
            await chat.clearState();
        }
        return;
    }


    if (commandName === 'ytmp4') {
        const chat = await msg.getChat();
        const url = args[0];

        if (!url) {
            await msg.reply(theme.messages.ytmp4Command.noUrl.replace('{prefix}', botPrefix));
            return;
        }

        if (!ytdl.validateURL(url)) {
            await msg.reply(theme.messages.ytmp4Command.invalidUrl);
            return;
        }

        let videoInfo;
        try {
            await chat.sendStateTyping();
            await msg.reply(theme.messages.ytmp4Command.fetchingInfo);

            videoInfo = await ytdl.getInfo(url);
            const videoTitle = sanitizeFilename(videoInfo.videoDetails.title);

            await msg.reply(theme.messages.ytmp4Command.downloading.replace('{title}', videoTitle));

            const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'whizmd-ytmp4-'));
            const tempFilePath = path.join(tempDir, `${Date.now()}_${videoTitle}.mp4`);

            // Choose a format that has both video and audio, preferably mp4
            // ytdl-core often provides DASH formats (separate audio/video) or progressive (combined)
            // We'll try to get a good quality progressive MP4 stream directly.
            // If ytdl can't provide a direct mp4 stream with audio+video, ffmpeg would be needed to merge.
            // For simplicity, we first try to get a combined stream.

            const videoStream = ytdl(url, {
                quality: 'highestvideo', // or a specific itag like '18' (360p), '22' (720p) if available
                filter: format => format.container === 'mp4' && format.hasAudio && format.hasVideo
            });

            // Pipe the stream to a file
            const fileStream = fs.createWriteStream(tempFilePath);

            await new Promise((resolve, reject) => {
                videoStream.pipe(fileStream);
                fileStream.on('finish', resolve);
                videoStream.on('error', (err) => {
                     console.error('Error during ytdl video stream for .ytmp4:', err.message);
                     reject(new Error(theme.messages.ytmp4Command.downloadError.replace('{title}', videoTitle)));
                });
                fileStream.on('error', (err) => { // Handle errors on the file stream as well
                    console.error('Error during file stream for .ytmp4:', err.message);
                    reject(new Error(theme.messages.ytmp4Command.downloadError.replace('{title}', videoTitle)));
                });
            });

            // Ensure the file is not empty (ytdl might end stream early on error sometimes)
            const stats = fs.statSync(tempFilePath);
            if (stats.size === 0) {
                fs.unlinkSync(tempFilePath); // Clean up empty file
                throw new Error(theme.messages.ytmp4Command.downloadError.replace('{title}', videoTitle) + " (File empty)");
            }

            const media = MessageMedia.fromFilePath(tempFilePath);
            await client.sendMessage(msg.from, media, { caption: `${videoInfo.videoDetails.title}` });

            fs.unlink(tempFilePath, (err) => {
                if (err) console.error("Error deleting temp video file for .ytmp4:", err);
                fs.rmdir(tempDir, { recursive: true }, (rmErr) => {
                    if (rmErr) console.error("Error deleting temp directory for .ytmp4:", rmErr);
                });
            });

            await chat.clearState();

        } catch (error) {
            console.error(`Error processing .ytmp4 command for URL "${url}":`, error);
            const titleForError = videoInfo ? videoInfo.videoDetails.title : "the video";
             const errorMessage = error.message.includes("private") || error.message.includes("age-restricted") || (error.response && error.response.status === 410)
                ? `❌ The video "${titleForError}" might be private, age-restricted, or unavailable.`
                : theme.messages.ytmp4Command.downloadError.replace('{title}', titleForError);
            await msg.reply(errorMessage);
            await chat.clearState();
        }
        return;
    }

    if (commandName === 'play') {
        const chat = await msg.getChat();
        const query = args.join(' ');

        if (!query) {
            await msg.reply(theme.messages.playCommand.noQuery.replace('{prefix}', botPrefix));
            return;
        }

        try {
            await chat.sendStateTyping();
            await msg.reply(theme.messages.playCommand.searching.replace('{query}', query));

            const searchResults = await YouTube.search(query, { limit: 1, type: 'video' });

            if (!searchResults || searchResults.length === 0) {
                await msg.reply(theme.messages.playCommand.notFound.replace('{query}', query));
                await chat.clearState();
                return;
            }

            const video = searchResults[0];
            await msg.reply(theme.messages.playCommand.downloading.replace('{title}', video.title));

            const audioStream = ytdl(video.url, { filter: 'audioonly', quality: 'highestaudio' });

            // We need to save the stream to a temporary file to send it as MessageMedia
            // whatsapp-web.js does not directly support sending streams as media attachments for audio.
            // It expects a filepath or a base64 encoded string.
            const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'whizmd-play-'));
            const tempFilePath = path.join(tempDir, `${Date.now()}_${sanitizeFilename(video.title || 'audio')}.mp3`);

            // Promisify the ffmpeg conversion / stream saving
            await new Promise((resolve, reject) => {
                ffmpeg(audioStream)
                    .audioBitrate(128) // Standard bitrate
                    .toFormat('mp3')
                    .on('error', (err) => {
                        console.error('Error during ffmpeg processing for .play:', err.message);
                        reject(new Error(theme.messages.playCommand.downloadError.replace('{title}', video.title)));
                    })
                    .on('end', () => {
                        console.log('ffmpeg processing finished for .play');
                        resolve();
                    })
                    .save(tempFilePath);
            });

            const media = MessageMedia.fromFilePath(tempFilePath);
            await client.sendMessage(msg.from, media, { sendAudioAsVoice: false, caption: `Playing: ${video.title}` });

            fs.unlink(tempFilePath, (err) => { // Clean up temp file
                if (err) console.error("Error deleting temp audio file for .play:", err);
                fs.rmdir(tempDir, { recursive: true }, (rmErr) => {
                    if (rmErr) console.error("Error deleting temp directory for .play:", rmErr);
                });
            });

            await chat.clearState();

        } catch (error) {
            console.error(`Error processing .play command for "${query}":`, error);
            const errorMessage = error.message.includes(" privata") || error.message.includes(" age-restricted")
                ? `❌ The video "${searchResults && searchResults[0] ? searchResults[0].title : query}" might be private or age-restricted.`
                : theme.messages.playCommand.downloadError.replace('{title}', (searchResults && searchResults[0] ? searchResults[0].title : query));
            await msg.reply(errorMessage);
            await chat.clearState();
        }
        return;
    }

    if (commandName === 'runtime') {
        const chat = await msg.getChat();
        try {
            await chat.sendStateTyping();
            const uptime = formatUptime(Date.now() - startTime);
            let runtimeMsg = theme.messages.runtime || "{uptimeEmoji} Bot has been running for: {runtimeValue}";

            runtimeMsg = runtimeMsg
                .replace('{uptimeEmoji}', theme.emojis.uptime || '⏱️')
                .replace('{runtimeValue}', uptime);

            await msg.reply(runtimeMsg.trim());
            await chat.clearState();
        } catch (error) {
            console.error(`Error processing .runtime command for ${msg.from}:`, error);
            await chat.clearState();
        }
        return;
    }

    if (commandName === 'status') {
        const chat = await msg.getChat();
        try {
            await chat.sendStateTyping();
            const uptime = formatUptime(Date.now() - startTime);
            let statusMsg = theme.messages.status || "❀ *{botName} Status* ❀\nMode: {mode}\nUptime: {uptime}\nCommands Loaded: {commandsCount}\nPrefix: {prefix}";

            statusMsg = statusMsg
                .replace('{botName}', theme.botName || 'WHIZ-MD')
                .replace('{mode}', 'Public') // Mode is hardcoded as Public for now
                .replace('{uptime}', uptime)
                .replace('{commandsCount}', totalCommandCount)
                .replace('{prefix}', botPrefix);

            await msg.reply(statusMsg.trim());
            await chat.clearState();
        } catch (error) {
            console.error(`Error processing .status command for ${msg.from}:`, error);
            await chat.clearState();
        }
        return;
    }

    if (commandName === 'ytmp3') {
        const chat = await msg.getChat();
        const url = args[0];

        if (!url) {
            await msg.reply(theme.messages.ytmp3Command.noUrl.replace('{prefix}', botPrefix));
            return;
        }

        if (!ytdl.validateURL(url)) {
            await msg.reply(theme.messages.ytmp3Command.invalidUrl);
            return;
        }

        let videoInfo; // To store video info for error messages if needed

        try {
            await chat.sendStateTyping();
            await msg.reply(theme.messages.ytmp3Command.fetchingInfo);

            videoInfo = await ytdl.getInfo(url);
            const videoTitle = sanitizeFilename(videoInfo.videoDetails.title);

            await msg.reply(theme.messages.ytmp3Command.downloading.replace('{title}', videoTitle));

            const audioStream = ytdl(url, { filter: 'audioonly', quality: 'highestaudio' });

            const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'whizmd-ytmp3-'));
            const tempFilePath = path.join(tempDir, `${Date.now()}_${videoTitle}.mp3`);

            await new Promise((resolve, reject) => {
                ffmpeg(audioStream)
                    .audioBitrate(128)
                    .toFormat('mp3')
                    .on('error', (err) => {
                        console.error('Error during ffmpeg processing for .ytmp3:', err.message);
                        reject(new Error(theme.messages.ytmp3Command.conversionError.replace('{title}', videoTitle)));
                    })
                    .on('end', () => {
                        console.log('ffmpeg processing finished for .ytmp3');
                        resolve();
                    })
                    .save(tempFilePath);
            });

            const media = MessageMedia.fromFilePath(tempFilePath);
            await client.sendMessage(msg.from, media, { sendAudioAsVoice: false, caption: `${videoInfo.videoDetails.title}` });

            fs.unlink(tempFilePath, (err) => {
                if (err) console.error("Error deleting temp audio file for .ytmp3:", err);
                 fs.rmdir(tempDir, { recursive: true }, (rmErr) => {
                    if (rmErr) console.error("Error deleting temp directory for .ytmp3:", rmErr);
                });
            });

            await chat.clearState();

        } catch (error) {
            console.error(`Error processing .ytmp3 command for URL "${url}":`, error);
            const titleForError = videoInfo ? videoInfo.videoDetails.title : "the video";
            const errorMessage = error.message.includes("private") || error.message.includes("age-restricted")
                ? `❌ The video "${titleForError}" might be private or age-restricted.`
                : (error.message.startsWith("❌ Error converting") ? error.message : theme.messages.ytmp3Command.downloadError.replace('{title}', titleForError) );
            await msg.reply(errorMessage);
            await chat.clearState();
        }
        return;
    }


    if (commandName === 'menu') {
        const chat = await msg.getChat();
        try {
            await chat.sendStateTyping();
            const menuText = getFullMenuText();
            await msg.reply(menuText.trim());
            await chat.clearState();
        } catch (error) {
            console.error(`Error processing .menu command for ${msg.from}:`, error);
            await chat.clearState();
            // Optionally send an error message to the user
            // await msg.reply(theme.messages.commandError || "❌ Oops! Something went wrong while fetching the menu.");
        }
        return;
    }

    if (commandName === 'info') {
        const chat = await msg.getChat();
        try {
            await chat.sendStateTyping();
            let infoMsg = theme.messages.botInfo || "Bot Info Missing";

            infoMsg = infoMsg
                .replace('{ownerEmoji}', theme.emojis.owner || '👑')
                .replace('{botName}', theme.botName || 'WHIZ-MD')
                .replace('{repoEmoji}', "") // No repo emoji in the example provided for .info specifically
                .replace(/{prefix}/g, botPrefix)
                .replace('{commandsCount}', totalCommandCount)
                .replace('{version}', theme.version || '1.0.0');

            // The theme.messages.botInfo already includes "Owner: WHIZ" and "Mode: Public"
            // and the repo link directly.
            // If we need to make "Mode" dynamic later, we'll adjust.

            await msg.reply(infoMsg.trim());
            await chat.clearState();
        } catch (error) {
            console.error(`Error processing .info command for ${msg.from}:`, error);
            await chat.clearState();
        }
        return;
    }

    if (commandName === 'version') {
        const chat = await msg.getChat();
        try {
            await chat.sendStateTyping();
            let versionMsg = theme.messages.versionInfo || "{botName} Version: {version}";

            versionMsg = versionMsg
                .replace('{botName}', theme.botName || 'WHIZ-MD')
                .replace('{version}', theme.version || '1.0.0');

            await msg.reply(versionMsg.trim());
            await chat.clearState();
        } catch (error) {
            console.error(`Error processing .version command for ${msg.from}:`, error);
            await chat.clearState();
        }
        return;
    }

    if (commandName === 'help') {
        const chat = await msg.getChat();
        try {
            await chat.sendStateTyping();
            if (args.length === 0) {
                // .help without arguments - show full menu
                const menuText = getFullMenuText();
                await msg.reply(menuText.trim());
            } else {
                // .help with argument (command name)
                const specificCommand = args[0].toLowerCase();
                // For now, just a placeholder. Later, this could look up actual help text.
                let helpMsg = theme.messages.specificHelpPlaceholder || "📋 Detailed help for `{prefix}{command}` is not yet available. Please check back later!";
                helpMsg = helpMsg.replace('{command}', specificCommand).replace(/{prefix}/g, botPrefix);
                await msg.reply(helpMsg);
            }
            await chat.clearState();
        } catch (error) {
            console.error(`Error processing .help command for ${msg.from}:`, error);
            await chat.clearState();
            // Optionally send an error message
        }
        return;
    }

    // --- Fun & Text Game Commands ---
    const funCommands = {
        'joke': handleJokeCommand,
        'quote': handleQuoteCommand,
        'fact': handleFactCommand,
        'meme': handleMemeCommand,
        '8ball': handle8BallCommand,
        'truth': handleTruthCommand,
        'dare': handleDareCommand,
        'hug': handleHugCommand,
        'slap': handleSlapCommand,
        'kiss': handleKissCommand,
        'pat': handlePatCommand,
        'ship': handleShipCommand,
    };

    if (funCommands[commandName]) {
        try {
            // Pass botPrefix to handlers that might need it for theme messages
            await funCommands[commandName](msg, args, client, theme, botPrefix);
        } catch (error) {
            console.error(`Unhandled error in fun command ${commandName}:`, error);
            await msg.reply(`❌ An unexpected error occurred while running the ${commandName} command.`);
        }
        return; // Command handled
    }

    // --- AI Commands ---
    const aiCommands = {
        'image': handleImageCommand,
        'dalle': handleImageCommand, // Alias for .image
        // 'chatgpt': handleChatGPTCommand, // Future
        // 'bard': handleBardCommand,       // Future
    };

    if (aiCommands[commandName]) {
        try {
            await aiCommands[commandName](msg, args, client, theme, botPrefix, activeGames);
        } catch (error) {
            console.error(`Unhandled error in AI command ${commandName}:`, error);
            await msg.reply(`❌ An unexpected error occurred while running the AI command ${commandName}.`);
        }
        return; // Command handled
    }

    // --- Misc & Extras Commands ---
    const miscCommands = {
        'vv': handleVvCommand,
        'emojimix': handleEmojimixCommand,
        'logomaker': handleLogomakerCommand,
        'logostyles': handleLogostylesCommand,
        'qotd': handleQotdCommand,
        'birthday': handleBirthdayCommand,
    };

    if (miscCommands[commandName]) {
        try {
            // Prepare globalState for birthday command
            const globalState = {
                birthdays: birthdays, // Direct reference
                // priorityViewList is not typically needed by these misc commands directly
                // but could be part of a larger globalState object if structured that way.
                // For logomaker, pass generateTextEffect and availableLogoStyles
            };

            if (commandName === 'logomaker' || commandName === 'logostyles') {
                 await miscCommands[commandName](msg, args, client, theme, botPrefix, activeGames, isOwner, null, generateTextEffect, availableLogoStyles);
            } else {
                // Most misc commands don't need statusAutomationState or isOwner, but pass for consistency if signature expects it
                // The `isOwner` is passed to birthday to allow owner to set for others.
                await miscCommands[commandName](msg, args, client, theme, botPrefix, activeGames, isOwner, null, globalState);
            }

        } catch (error) {
            console.error(`Unhandled error in misc command ${commandName}:`, error);
            await msg.reply(`❌ An unexpected error occurred while running the ${commandName} command.`);
        }
        return; // Command handled
    }

    // --- Group Tool Commands ---
    const groupCommands = {
        'add': handleAddCommand,
        'kick': handleKickCommand,
        'promote': handlePromoteCommand,
        'demote': handleDemoteCommand,
        'link': handleLinkCommand,
        'tagall': handleTagallCommand,
        'hidetag': handleHidetagCommand,
        'mute': handleMuteCommand,
        'unmute': handleUnmuteCommand,
        'setname': handleSetnameCommand,
        'setdesc': handleSetdescCommand,
        'setpp': handleSetppCommand,
    };

    if (groupCommands[commandName]) {
        try {
            // Pass group helper functions as well
            await groupCommands[commandName](msg, args, client, theme, botPrefix, activeGames, isUserAdmin, isBotAdmin, getChatParticipant);
        } catch (error) {
            console.error(`Unhandled error in group command ${commandName}:`, error);
            await msg.reply(`❌ An unexpected error occurred while running the ${commandName} command.`);
        }
        return; // Command handled
    }

    // --- Owner Control Commands ---
    // IMPORTANT: Owner check is the first gate for these commands.
    const ownerCommands = {
        'block': handleBlockCommand,
        'unblock': handleUnblockCommand,
        'broadcast': handleBroadcastCommand,
        'send': handleSendCommand,
        'shutdown': handleShutdownCommand,
        'restart': handleRestartCommand,
        'getsession': handleGetsessionCommand,
        'eval': handleEvalCommand,
        'autoview': handleAutoviewCommand,
        'autoreact': handleAutoreactCommand,
        'setreactions': handleSetreactionsCommand,
        // 'priorityview': handlePriorityViewCommand, // Removed
    };

    if (ownerCommands[commandName]) {
        if (isOwner(msg.author || msg.from)) {
            // Prepare the statusAutomation state object and globalState for birthdays
            const statusAutomationState = {
                get autoViewEnabled() { return autoViewEnabled; },
                set autoViewEnabled(val) { autoViewEnabled = val; },
                get autoReactEnabled() { return autoReactEnabled; },
                set autoReactEnabled(val) { autoReactEnabled = val; },
                get autoReactionEmojis() { return autoReactionEmojis; },
                set autoReactionEmojis(val) { autoReactionEmojis = val; }
            };
            const globalState = { // For commands needing to modify global lists/objects
                // priorityViewList: priorityViewList, // Removed
                birthdays: birthdays             // Direct reference
            };

            try {
                // Pass statusAutomationState and globalState to relevant owner commands
                await ownerCommands[commandName](msg, args, client, theme, botPrefix, activeGames, isOwner, statusAutomationState, globalState);
            } catch (error) {
                console.error(`Unhandled error in owner command ${commandName}:`, error);
                await msg.reply(`❌ An unexpected error occurred while running the owner command ${commandName}.`);
            }
        } else {
            await msg.reply(theme.messages.ownerCmd.unauthorized);
        }
        return; // Command attempt (authorized or not) is handled.
    }

    // --- Info & Fetcher Commands ---
    const infoCommands = {
        'profile': handleProfileCommand,
        'numberinfo': handleNumberInfoCommand,
        'github': handleGithubCommand,
        'npm': handleNpmCommand,
        'anime': handleAnimeCommand,
        'quoteimg': handleQuoteImgCommand,
        'covid': handleCovidCommand,
        // 'iplookup' is handled by 'ip' in utilities section
    };

    if (infoCommands[commandName]) {
        try {
            await infoCommands[commandName](msg, args, client, theme, botPrefix, activeGames); // activeGames might not be used by all
        } catch (error) {
            console.error(`Unhandled error in info command ${commandName}:`, error);
            await msg.reply(`❌ An unexpected error occurred while running the ${commandName} command.`);
        }
        return; // Command handled
    }


    // --- Interactive Game Commands ---
    const gameCommands = {
        'roll': handleRollCommand,
        'guess': handleGuessCommand,
        'riddle': handleRiddleCommand,
        // 'answer' is special, handled below
        'ttt': handleTTTCommand,
        'hangman': handleHangmanCommand,
        'slot': handleSlotCommand,
        'trivia': handleTriviaCommand,
        'skipquiz': handleTriviaCommand, // Alias for stopping trivia
        'stopquiz': handleTriviaCommand, // Alias for stopping trivia
        'connect4': handleConnect4Command, // Placeholder
        'sudoku': handleSudokuCommand,     // Placeholder
    };

    if (gameCommands[commandName]) {
        try {
            await gameCommands[commandName](msg, args, client, theme, botPrefix, activeGames);
        } catch (error) {
            console.error(`Unhandled error in game command ${commandName}:`, error);
            await msg.reply(`❌ An unexpected error occurred while running the ${commandName} command.`);
        }
        return; // Command handled
    }

    // Special handling for .answer command (contextual to active game)
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
                    await msg.reply("There's no active game expecting an answer right now.");
                }
            } catch (error) {
                 console.error(`Unhandled error in .answer command for ${activeGame.gameType}:`, error);
                 await msg.reply(`❌ An unexpected error occurred while processing your answer.`);
            }
        } else {
            await msg.reply("There's no active game expecting an answer right now. Try starting a riddle or trivia game!");
        }
        return; // Command handled
    }


    // Placeholder for other commands
    // For now, send a "command not found" type message from theme
    try {
        const chat = await msg.getChat();
        await chat.sendStateTyping();
        let cmdNotFoundMsg = theme.messages.commandNotFound || "❌ Command not found. Type `{prefix}help` to see the menu.";
        cmdNotFoundMsg = cmdNotFoundMsg.replace('{prefix}', botPrefix);
        await msg.reply(cmdNotFoundMsg);
        await chat.clearState();
    } catch (error) {
        console.error(`Error sending command not found for ${msg.from}:`, error);
        // Attempt to clear state if chat object was obtained
        if (msg.getChat && typeof msg.getChat === 'function') {
            try {
                const chatOnError = await msg.getChat();
                await chatOnError.clearState();
            } catch (e) {
                // ignore
            }
        }
    }

    // --- Autoview & Autoreact to Statuses ---
    // This should be checked for every message that could be a status
    if (msg.from === 'status@broadcast' && msg.author && msg.author !== client.info.wid._serialized) {
        const statusAuthorId = msg.author;
        // console.log(`Received status from ${statusAuthorId}`); // Debug log

        // console.log(`Received status from ${statusAuthorId}`); // Debug log

        if (autoViewEnabled) {
            try {
                await client.sendSeen(statusAuthorId);
                // console.log(`Autoviewed status from ${statusAuthorId}`);
            } catch (viewError) {
                console.error(`Failed to autoview status from ${statusAuthorId}:`, viewError.message);
            }
        }

        if (autoReactEnabled && autoReactionEmojis.length > 0) {
            // Small delay before reacting, can seem more natural
            await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1500));
            try {
                const randomReaction = autoReactionEmojis[Math.floor(Math.random() * autoReactionEmojis.length)];
                await msg.react(randomReaction);
                // console.log(`Autoreacted with ${randomReaction} to status from ${statusAuthorId}`);
            } catch (reactError) {
                console.error(`Failed to autoreact to status from ${statusAuthorId}:`, reactError.message);
            }
        }
    }
    // End of Autoview & Autoreact

});

console.log("WHIZ-MD: Initializing WhatsApp client...");
client.initialize().catch(err => {
    console.error("WHIZ-MD: Client initialization error", err);
    process.exit(1);
});

// console.log("WHIZ-MD: index.js - Session check implemented. Further initialization pending.");
