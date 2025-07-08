// Main bot file for WHIZ-MD
require('dotenv').config(); // Load environment variables from .env file at the very start
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const config = require('./config');

console.log("WHIZ-MD Bot Starting...");

// Session ID Check
let sessionID = null;
for (const envVar in process.env) {
    if (envVar.startsWith("WHIZMD_")) {
        sessionID = process.env[envVar];
        console.log(`Found session ID: ${sessionID} from env var ${envVar}`);
        break;
    }
}

if (!sessionID) {
    console.error("🔴 Error: WHIZ-MD session ID not found.");
    console.error("Please set an environment variable starting with 'WHIZMD_' with your session ID.");
    console.error("You can get a session ID from: https://whizmdsessions.onrender.com");
    process.exit(1); // Exit if no session ID is found
}

const client = new Client({
    authStrategy: new LocalAuth({ clientId: `WHIZMD_SESSION_${sessionID.substring(0, 8)}` }), // Use a unique clientId based on session
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    },
    webVersionCache: { // Added for potentially faster load times and stability
        type: 'remote',
        remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html',
    },
});

// Set bot start time for status command
try {
    const statusCommand = require('./commands/status.js');
    if (statusCommand && statusCommand.setBotStartTime) {
        statusCommand.setBotStartTime(Date.now());
    }
} catch (e) {
    console.warn("Could not set bot start time for status command:", e.message);
}


client.on('qr', qr => {
    qrcode.generate(qr, { small: true });
    console.log('QR code generated. Scan it with WhatsApp.');
});

client.on('ready', async () => {
    console.log('WHIZ-MD Bot is ready!');
    console.log(`Logged in as ${client.info.pushname} (${client.info.wid.user})`);

    // Send welcome message to "message yourself" chat
    // This now uses the getFullMenuText from the menu command to ensure consistency
    try {
        const welcomeMessage1 = `❀━━━━━━━━━━━━❀
❀ *WHIZ-MD* is now Live🌀
❀ Welcome and Enjoy
❀ Repo : github.com/whizmburu/whiz-md
❀ Owner : https://wa.me/${config.ownerNumber}
❀ *_Kindly Fork me, it means a lot_*
❀━━━━━━━━━━━━❀`;

        // Dynamically get the menu text
            // We need to require the menu command or its utility function here
            // For simplicity, let's define a local version or ensure it's easily accessible
            // This creates a slight dependency; ideally, menu text generation is a shared utility
            const { execute: menuExecute } = require('./commands/menu.js'); // Temporary direct require

            let menuTextForWelcome = "Welcome! Use .help or .menu to see commands."; // Fallback
            // Simulate a message object to get the menu text
            const mockMessageForMenu = { reply: (text) => { menuTextForWelcome = text; } };
            // Check if commands are loaded before calling this, or handle it inside getFullMenuText
            // For now, we assume commandHandler has loaded commands when 'ready' event fires.
            // Ensure commandHandler has loaded commands. This should be true by the 'ready' event.
            const getMenuTextFunction = require('./commands/help.js').__getFullMenuText;

            if (getMenuTextFunction) {
                 menuTextForWelcome = getMenuTextFunction();
            } else {
                // Fallback if the function isn't available for some reason
                console.warn("Welcome message: __getFullMenuText not found, using fallback menu.");
                 const commandsMap = require('./utils/commandHandler').commands;
                 menuTextForWelcome = `❀┏━【 💎 WHIZ‑MD BOT MENU ━┓
❀ Owner     : ${config.ownerName}
❀ Mode      : Public
❀ Prefix    : ${config.prefix}
❀ Commands  : ${commandsMap.size} (Loaded) / 119 (Planned)
❀ Version   : 1.0.0
❀ Repo      : github.com/whizmburu/WHIZ‑MD
❀━━━━━━━━━━━━━━━┛
... (rest of menu - use the full version from menu.js or help.js)`;
            }


            const selfChatId = client.info.wid._serialized;
            const firstMessage = await client.sendMessage(selfChatId, welcomeMessage1);

            // Safely try to quote the first message. If it fails or no message, send without quoting.
            let messagesInChat;
            try {
                messagesInChat = await client.getChatById(selfChatId).then(chat => chat.fetchMessages({ limit: 1 }));
            } catch (fetchError) {
                console.warn("Could not fetch messages from self chat to quote:", fetchError.message);
            }

            if (messagesInChat && messagesInChat.length > 0 && messagesInChat[0] && messagesInChat[0].id) {
                await client.sendMessage(selfChatId, menuTextForWelcome, { quotedMessageId: messagesInChat[0].id._serialized });
            } else {
                console.log("No prior message in self-chat to quote, or message ID is missing. Sending help menu as a new message.");
                await client.sendMessage(selfChatId, menuTextForWelcome);
            }
            console.log("Welcome messages sent to self chat.");

        } catch (error) {
            console.error("Error sending welcome message:", error);
    }
});

const { handleMessage } = require('./utils/commandHandler');

client.on('message', async msg => {
    console.log(`[BOT.JS] Received message from: ${msg.from}, author: ${msg.author || 'N/A'}, body: "${msg.body}"`);
    if (msg.body && typeof msg.body === 'string' && msg.body.startsWith(config.prefix)) {
        console.log(`[BOT.JS] Message starts with prefix, attempting to handle command.`);
        await handleMessage(client, msg);
    } else if (msg.body && typeof msg.body === 'string' && !msg.body.startsWith(config.prefix)) {
        // console.log(`[BOT.JS] Message does not start with prefix, ignoring for command handling.`);
    } else {
        // console.log(`[BOT.JS] Message body is not a string or is empty, ignoring.`);
    }
});

// Status event listeners are now integrated into the main 'message' handler below.

client.on('message', async (msg) => { // Renamed 'message' to 'msg' for clarity within this specific handler
    console.log(`[BOT.JS] Received message event. From: ${msg.from}, Author: ${msg.author || 'N/A'}, Type: ${msg.type}, Body: "${msg.body}"`);

    // Handle status updates (auto-view/react)
    if (msg.from === 'status@broadcast') {
        console.log(`[BOT.JS] Detected status update from author: ${msg.author}. Body: ${msg.body}, Type: ${msg.type}`);

        // Optional: If you want to completely stop further processing for status@broadcast messages here:
        // console.log("[BOT.JS] Status message detected. No further command processing will occur for this message.");
        // return; // This would prevent command handler from seeing it if it somehow matched prefix.

        const autoviewCmd = require('./commands/status_extras/autoview.js');
        const autoreactCmd = require('./commands/status_extras/autoreact.js');

        if (autoviewCmd && typeof autoviewCmd.isAutoViewEnabled === 'function' && autoviewCmd.isAutoViewEnabled()) {
            if (msg.author && client.info.wid._serialized !== msg.author) {
                console.log(`[AutoView] Processing status from ${msg.author}. (Conceptual view - actual seen depends on library internals)`);
                // Actual "sendSeen" for statuses is complex and often not directly possible via a simple message object.
                // The library might handle this implicitly or require specific methods not used here.
            }
        }

        if (autoreactCmd && typeof autoreactCmd.isAutoReactEnabled === 'function' && autoreactCmd.isAutoReactEnabled()) {
            if (msg.author && client.info.wid._serialized !== msg.author) {
                try {
                    const reactions = autoreactCmd.getReactions();
                    if (reactions && reactions.length > 0) {
                        const randomReaction = reactions[Math.floor(Math.random() * reactions.length)];
                        await msg.react(randomReaction);
                        console.log(`[AutoReact] Reacted with ${randomReaction} to status from ${msg.author}`);
                    }
                } catch (e) {
                    console.error(`[AutoReact] Error auto-reacting to status from ${msg.author}:`, e);
                }
            }
        }
        // After handling status-specific actions, decide if it should proceed to command handler.
        // Generally, status messages don't trigger text commands.
        // If you want to ensure status messages are *never* processed as commands:
        return; // Stop further processing for status@broadcast messages.
    }

    // Regular command handling for non-status messages
    if (msg.body && typeof msg.body === 'string' && msg.body.startsWith(config.prefix)) {
        console.log(`[BOT.JS] Message from ${msg.from} starts with prefix, attempting to handle command: "${msg.body}"`);
        await handleMessage(client, msg);
    } else if (msg.body && typeof msg.body === 'string' && !msg.body.startsWith(config.prefix)) {
        // console.log(`[BOT.JS] Message from ${msg.from} does not start with prefix, ignoring for command handling.`);
    } else {
        // console.log(`[BOT.JS] Message from ${msg.from} body is not a string or is empty, ignoring.`);
    }
});


client.on('auth_failure', msg => {
    console.error('WHIZ-MD Authentication Failure:', msg);
    // Potentially trigger a re-auth or session refresh here if applicable
});

client.on('disconnected', (reason) => {
    console.log('WHIZ-MD Client was logged out:', reason);
    // Implement reconnection logic or exit
});

client.initialize().catch(err => {
    console.error("Error during client initialization:", err);
});

console.log("Attempting to initialize WHIZ-MD client...");
