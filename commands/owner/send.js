// Command: .send <chatId> <message>

async function handleSendCommand(msg, args, client, theme, botPrefix, activeGames, isOwnerHelper) {
    // Owner check is done in index.js

    if (args.length < 2) {
        await msg.reply(theme.messages.ownerCmd.send.noChatId + " and/or " + theme.messages.ownerCmd.send.noMessage.toLowerCase());
        return;
    }

    const chatId = args[0];
    const messageToSend = args.slice(1).join(' ');

    if (!chatId.endsWith('@c.us') && !chatId.endsWith('@g.us') && !chatId.endsWith('@s.whatsapp.net')) {
        // Basic validation for chat ID format
        await msg.reply(theme.messages.ownerCmd.send.invalidChatId.replace('{chatId}', chatId) + "\n(Example: 1234567890@c.us or group-id@g.us)");
        return;
    }

    if (!messageToSend) {
        await msg.reply(theme.messages.ownerCmd.send.noMessage);
        return;
    }

    try {
        // Check if chat exists (optional, sendMessage will fail if not)
        // const targetChat = await client.getChatById(chatId);
        // if (!targetChat) {
        //     await msg.reply(theme.messages.ownerCmd.send.invalidChatId.replace('{chatId}', chatId));
        //     return;
        // }

        await client.sendMessage(chatId, messageToSend);
        await msg.reply(theme.messages.ownerCmd.send.success.replace('{chatId}', chatId));

    } catch (error) {
        console.error(`Error in .send command to ${chatId}:`, error);
        await msg.reply(theme.messages.ownerCmd.send.fail.replace('{chatId}', chatId) + ` (Error: ${error.message})`);
    }
}

module.exports = {
    handleSendCommand
};
