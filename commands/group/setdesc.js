// Command: .setdesc <new_description>

async function handleSetdescCommand(msg, args, client, theme, botPrefix, activeGames, isUserAdmin, isBotAdmin, getChatParticipant) {
    const chat = await msg.getChat();

    if (!chat.isGroup) {
        await msg.reply(theme.messages.groupCmd.notGroup);
        return;
    }

    if (!await isBotAdmin(chat, client)) {
        await msg.reply(theme.messages.groupCmd.botNotAdmin);
        return;
    }

    const senderId = msg.author || msg.from;
    if (!await isUserAdmin(chat, senderId)) {
        await msg.reply(theme.messages.groupCmd.userNotAdmin);
        return;
    }

    const newDescription = args.join(' ');
    if (!newDescription) { // Allow empty description to clear it. WhatsApp might have min length for actual set.
        // Forcing a non-empty description for this command.
        // To clear description, user might need to do it via WhatsApp UI.
        // Or we can have a specific command like .cleardesc
        await msg.reply(theme.messages.groupCmd.setdesc.noDesc);
        return;
    }

    try {
        await chat.sendStateTyping();
        await chat.setDescription(newDescription);
        await msg.reply(theme.messages.groupCmd.setdesc.success);
        await chat.clearState();
    } catch (error) {
        console.error("Error in .setdesc command:", error);
        await msg.reply(theme.messages.groupCmd.setdesc.fail + ` (Error: ${error.message})`);
        if (chat) await chat.clearState();
    }
}

module.exports = {
    handleSetdescCommand
};
