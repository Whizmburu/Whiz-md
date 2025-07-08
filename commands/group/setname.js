// Command: .setname <new_group_name>

async function handleSetnameCommand(msg, args, client, theme, botPrefix, activeGames, isUserAdmin, isBotAdmin, getChatParticipant) {
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

    const newGroupName = args.join(' ');
    if (!newGroupName) {
        await msg.reply(theme.messages.groupCmd.setname.noName.replace('{prefix}', botPrefix));
        return;
    }

    try {
        await chat.sendStateTyping();
        await chat.setSubject(newGroupName);
        await msg.reply(theme.messages.groupCmd.setname.success.replace('{newName}', newGroupName));
        await chat.clearState();
    } catch (error) {
        console.error("Error in .setname command:", error);
        await msg.reply(theme.messages.groupCmd.setname.fail + ` (Error: ${error.message})`);
        if (chat) await chat.clearState();
    }
}

module.exports = {
    handleSetnameCommand
};
