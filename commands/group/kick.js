// Command: .kick <@user_or_reply_to_user>

async function handleKickCommand(msg, args, client, theme, botPrefix, activeGames, isUserAdmin, isBotAdmin, getChatParticipant) {
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

    let usersToKick = [];
    if (msg.mentionedIds.length > 0) {
        usersToKick = msg.mentionedIds;
    } else if (msg.hasQuotedMsg) {
        const quotedMsg = await msg.getQuotedMessage();
        if (quotedMsg.author) {
            usersToKick.push(quotedMsg.author);
        }
    }

    if (usersToKick.length === 0) {
        await msg.reply(theme.messages.groupCmd.noUserMentioned + " or reply to the user's message.");
        return;
    }

    // For simplicity, handle one kick at a time, though API supports multiple
    const targetUserId = usersToKick[0];
    const targetContact = await client.getContactById(targetUserId);
    const targetUserName = targetContact.pushname || targetContact.name || targetUserId.split('@')[0];

    if (targetUserId === senderId) {
        await msg.reply(theme.messages.groupCmd.kick.cannotKickSelf);
        return;
    }
    if (targetUserId === client.info.wid._serialized) {
        await msg.reply(theme.messages.groupCmd.kick.cannotKickBot);
        return;
    }

    const targetParticipant = await getChatParticipant(chat, targetUserId);
    if (!targetParticipant) {
        await msg.reply(theme.messages.groupCmd.targetUserNotMember.replace('{user}', targetUserName));
        return;
    }

    // Check if bot can kick this user (e.g. if target is also admin and bot is not superadmin, or target is group creator)
    // whatsapp-web.js removeParticipants will likely fail if bot can't kick, but good to be aware.

    try {
        await chat.removeParticipants([targetUserId]);
        await msg.reply(theme.messages.groupCmd.kick.success.replace('{user}', targetUserName));
    } catch (error) {
        console.error(`Error in .kick command for ${targetUserName}:`, error);
        await msg.reply(theme.messages.groupCmd.kick.fail.replace('{user}', targetUserName) + ` (Error: ${error.message})`);
    }
}

module.exports = {
    handleKickCommand
};
