// Command: .unmute

async function handleUnmuteCommand(msg, args, client, theme, botPrefix, activeGames, isUserAdmin, isBotAdmin, getChatParticipant) {
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

    try {
        await chat.sendStateTyping();
        await chat.setMessagesAdminsOnly(false);
        await msg.reply(theme.messages.groupCmd.unmute.success);
        await chat.clearState();
    } catch (error) {
        console.error("Error in .unmute command:", error);
        await msg.reply(theme.messages.groupCmd.unmute.fail);
        if (chat) await chat.clearState();
    }
}

module.exports = {
    handleUnmuteCommand
};
