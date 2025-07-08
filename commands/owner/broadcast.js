// Command: .broadcast <message>

async function handleBroadcastCommand(msg, args, client, theme, botPrefix, activeGames, isOwnerHelper) {
    // Owner check is done in index.js

    const broadcastMessage = args.join(' ');
    if (!broadcastMessage) {
        await msg.reply(theme.messages.ownerCmd.broadcast.noMessage);
        return;
    }

    try {
        const chats = await client.getChats();
        if (chats.length === 0) {
            await msg.reply("No chats found to broadcast to.");
            return;
        }

        await msg.reply(theme.messages.ownerCmd.broadcast.start.replace('{chatCount}', chats.length));

        let successCount = 0;
        let failCount = 0;
        const delayBetweenMessages = 2000; // 2 seconds delay

        for (const chat of chats) {
            // Skip own chat, other bots, or service chats if needed
            if (chat.id._serialized === client.info.wid._serialized || chat.isReadOnly || !chat.isGroup && chat.isUser) {
                // Basic filter: send to groups and individual user chats.
                // More sophisticated filtering could be added (e.g. by labels, last interaction time)
                // For now, we attempt to send to most non-service chats.
                // `chat.isUser` is true for individual chats.
                // `chat.isGroup` is true for group chats.
                // We want to broadcast to both.
            }

            try {
                await client.sendMessage(chat.id._serialized, broadcastMessage);
                successCount++;
                console.log(`Broadcast sent to: ${chat.name || chat.id._serialized}`);
                // Optional: Send update to owner for each successful send, but can be spammy
                // await client.sendMessage(msg.from, theme.messages.ownerCmd.broadcast.sentTo.replace('{chatName}', chat.name || chat.id._serialized));

                // Wait for a bit before sending the next message
                if (chats.indexOf(chat) < chats.length - 1) { // Don't wait after the last message
                    await new Promise(resolve => setTimeout(resolve, delayBetweenMessages));
                }
            } catch (err) {
                failCount++;
                console.error(`Failed to send broadcast to ${chat.name || chat.id._serialized}:`, err.message);
                // Optional: Send update to owner for each failed send
                // await client.sendMessage(msg.from, theme.messages.ownerCmd.broadcast.failTo.replace('{chatName}', chat.name || chat.id._serialized));
            }
        }

        await msg.reply(theme.messages.ownerCmd.broadcast.complete
            .replace('{successCount}', successCount)
            .replace('{totalCount}', chats.length)
        );

    } catch (error) {
        console.error("Error in .broadcast command:", error);
        await msg.reply(`❌ An error occurred during broadcast: ${error.message}`);
    }
}

module.exports = {
    handleBroadcastCommand
};
