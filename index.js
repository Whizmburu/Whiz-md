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
});

console.log("WHIZ-MD: Initializing WhatsApp client...");
client.initialize().catch(err => {
    console.error("WHIZ-MD: Client initialization error", err);
    process.exit(1);
});

// console.log("WHIZ-MD: index.js - Session check implemented. Further initialization pending.");
