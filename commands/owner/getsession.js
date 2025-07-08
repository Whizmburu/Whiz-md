// Command: .getsession

async function handleGetsessionCommand(msg, args, client, theme, botPrefix, activeGames, isOwnerHelper) {
    // Owner check is done in index.js
    // This command sends sensitive data ONLY to the owner's chat.

    try {
        const ownerChatId = process.env.OWNER_NUMBER; // Ensure this is just number@c.us
        if (!ownerChatId) {
            await msg.reply("OWNER_NUMBER not configured. Cannot send session.");
            return;
        }

        const sessionData = process.env.WHIZMD_SESSION_DATA;

        if (!sessionData) {
            await client.sendMessage(ownerChatId, theme.messages.ownerCmd.getSession.fail + " (WHIZMD_SESSION_DATA environment variable is not set or empty).");
            return;
        }

        // Send warning first
        await client.sendMessage(ownerChatId, theme.messages.ownerCmd.getSession.warning);

        // Send session data
        // WhatsApp has message length limits. If session data is very long, it might need to be chunked or sent as a file.
        // For now, attempt to send as a single message.
        const dataMessage = `${theme.messages.ownerCmd.getSession.dataPrefix}\n\n\`\`\`${sessionData}\`\`\``;

        // Check length; typical WA limit is ~65536, but practically less for single message.
        // Let's aim for smaller chunks if it's very long.
        const MAX_MSG_LENGTH = 4000; // Conservative limit for a single message part
        if (dataMessage.length > MAX_MSG_LENGTH) {
            await client.sendMessage(ownerChatId, `${theme.messages.ownerCmd.getSession.dataPrefix}\nSession data is too long to send in one message. Sending in parts or consider alternative retrieval.`);
            // A more robust solution for very long data would be to save to a temp file and send the file,
            // or send multiple messages. For now, just warning if too long.
            // Sending the raw long string might fail or be heavily truncated by WA.
            // We'll still attempt to send it but it might not be complete if extremely large.
             try {
                await client.sendMessage(ownerChatId, dataMessage); // Attempt to send the full potentially long message
            } catch (sendErr) {
                console.error("Failed to send long session string:", sendErr);
                await client.sendMessage(ownerChatId, "Failed to send the full session string. It might be too large.");
            }
        } else {
            await client.sendMessage(ownerChatId, dataMessage);
        }

        // Confirm to the command issuer (if different from owner's direct chat, though owner commands usually come from owner)
        if (msg.from !== ownerChatId) {
            await msg.reply("Session data has been sent to your primary contact number (owner).");
        }


    } catch (error) {
        console.error("Error in .getsession command:", error);
        const ownerChatId = process.env.OWNER_NUMBER;
        if (ownerChatId) {
            await client.sendMessage(ownerChatId, theme.messages.ownerCmd.getSession.fail + ` (Error: ${error.message})`).catch(e => console.error("Failed to send getsession error to owner:", e));
        }
        // Also reply to original message if it wasn't the owner's direct chat.
        if (msg.from !== ownerChatId) {
             await msg.reply(theme.messages.ownerCmd.getSession.fail).catch(e => console.error("Failed to send getsession error to command issuer:", e));
        }
    }
}

module.exports = {
    handleGetsessionCommand
};
