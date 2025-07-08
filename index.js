// WHIZ-MD WhatsApp Bot
// Main entry point

require('dotenv').config();
const fs = require('fs');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

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

    let menuText = `${menuConfig.title}\n\n`;

    menuConfig.header.forEach(line => {
        menuText += `${line
            .replace('{prefix}', botPrefix)
            .replace('{commandCount}', tổngCommandCount) // Corrected variable name
            .replace('{version}', theme.version || '1.0.0') // Assuming theme has a version
            .replace('{botName}', theme.botName || 'WHIZ-MD')
        }\n`;
    });
    menuText += `${menuConfig.headerEnd}\n\n`;

    menuConfig.instructions.forEach(line => {
        menuText += `${line.replace('{prefix}', botPrefix)}\n`;
    });
    menuText += `\n${theme.borders.section || '❀━━━━━━━━━━━━❀'}\n`;

    menuConfig.sections.forEach(section => {
        menuText += `❀ ${section.title} ✦✦✦\n`;
        section.commands.forEach(cmd => {
            menuText += `❀ ┃ *${cmd}*\n`;
        });
        menuText += `${theme.borders.section || '❀━━━━━━━━━━━━❀'}\n`;
    });

    menuText += `\n${menuConfig.footer}\n`;
    menuText += `${menuConfig.footerEnd}`;

    return menuText;
}


// Calculate total commands once
let tổngCommandCount = 0;
if (theme.menu && theme.menu.sections) {
    theme.menu.sections.forEach(section => {
        tổngCommandCount += section.commands.length;
    });
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

    // Simple Ping command for testing the handler
    if (commandName === 'ping') {
        const chat = await msg.getChat();
        try {
            await chat.sendStateTyping();
            const startTime = Date.now();
            // Simulate some async work or just reply directly
            // For a true latency, we'd need to factor in message send/ack time if possible,
            // but for a simple ping, response time is a good indicator.
            await msg.reply(`${theme.emojis.ping || '🏓'} Pong!`);
            const endTime = Date.now();
            const latency = endTime - startTime;
            // Send latency in a follow-up or edit message if library supports
            // For now, just log it or send a new message if desired.
            // console.log(`Ping latency: ${latency}ms`);
            // Optionally send latency back:
            // await client.sendMessage(msg.from, `Latency: ${latency}ms`);
            await chat.clearState();
        } catch (error) {
            console.error(`Error processing ping command for ${msg.from}:`, error);
            await chat.clearState(); // Ensure state is cleared even on error
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
