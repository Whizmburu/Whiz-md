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
    // Basic message logging
    // console.log(`Message from ${msg.from} (${msg.author || 'N/A'}): ${msg.body}`);
    await handleMessage(client, msg);
});

// Status event listeners
// Assuming 'status' event exists and provides status objects.
// The actual event name and structure might differ in whatsapp-web.js for statuses.
// Common way is 'message' event with msg.isStatus or msg.from === 'status@broadcast'.
// Let's refine this based on typical wwebjs patterns.
// whatsapp-web.js typically emits 'message' for statuses too.
// We need to check msg.from === 'status@broadcast' or if msg.type indicates a status update.

client.on('message', async (message) => {
    // This will run handleMessage again, which is fine as it filters by prefix.
    // Now, add status specific logic.
    if (message.from === 'status@broadcast' || message.isStatus) { // isStatus might not be reliable, 'status@broadcast' is better for received statuses
        // console.log("Received a status update:", message);

        const autoviewCmd = require('./commands/status_extras/autoview.js');
        const autoreactCmd = require('./commands/status_extras/autoreact.js');

        if (autoviewCmd && typeof autoviewCmd.isAutoViewEnabled === 'function' && autoviewCmd.isAutoViewEnabled()) {
            try {
                // Marking as read: sendReadReceipt might not work for statuses directly.
                // Viewing is usually implicit by fetching/receiving it.
                // For whatsapp-web.js, viewing a status is done by client.sendSeen(statusId)
                // statusId is tricky to get here. It's usually chatId of the status.
                // The message object for a status is from 'status@broadcast'.
                // The actual sender is in message.author.
                if (message.author && client.info.wid._serialized !== message.author) { // Don't mark own statuses as seen via bot
                    // console.log(`Auto-viewing status from ${message.author}`);
                    // client.sendSeen needs the chatID of the status message, which is tricky.
                    // A common way is to get the chat of the author and then send "read" for their statuses.
                    // This is an area that often needs library-specific handling.
                    // For now, we'll log, as direct "sendSeen" for a specific status message ID is complex.
                    // A simpler "view" might be to fetch the status message itself, which some libraries treat as viewing.
                    // whatsapp-web.js doesn't have a direct "viewStatus(statusMsg)" function.
                    // The most reliable way is often to get all statuses for a contact and iterate.
                    // This event is for *new* status posts.
                    // Let's assume for now that receiving it and logging is a conceptual "view".
                    // Actual "seen" checkmark update is more involved.
                    // await client.sendPresenceUpdate('available', message.author); // Not for viewing
                    // The library might automatically handle "seen" for statuses you receive if you process them.
                    // No explicit "sendSeenForStatus" for a single status message object.
                    // The most common workaround is to fetch all statuses by the author and then the library marks them.
                    // This is not ideal for an event-driven new status.
                    console.log(`[AutoView] Received status from ${message.author}. "Viewing" it (actual seen may depend on library internals).`);
                     // Attempting to send a read receipt to the status sender's chat (their user ID)
                    // This is speculative and might not correctly mark the status as read.
                    // client.sendSeen(message.author); // This would mark their CHAT as seen, not status.
                }
            } catch (e) {
                console.error("Error during auto-view attempt:", e);
            }
        }

        if (autoreactCmd && typeof autoreactCmd.isAutoReactEnabled === 'function' && autoreactCmd.isAutoReactEnabled()) {
            if (message.author && client.info.wid._serialized !== message.author) { // Don't react to own statuses
                 try {
                    const reactions = autoreactCmd.getReactions();
                    if (reactions && reactions.length > 0) {
                        const randomReaction = reactions[Math.floor(Math.random() * reactions.length)];
                        // Reacting to a status message
                        await message.react(randomReaction);
                        console.log(`[AutoReact] Reacted with ${randomReaction} to status from ${message.author}`);
                    }
                } catch (e) {
                    console.error(`Error auto-reacting to status from ${message.author}:`, e);
                }
            }
        }
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
