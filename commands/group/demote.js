// Command: .demote <@user_or_reply_to_user>

async function handleDemoteCommand(msg, args, client, theme, botPrefix, activeGames, isUserAdmin, isBotAdmin, getChatParticipant) {
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

    let usersToDemote = [];
    if (msg.mentionedIds.length > 0) {
        usersToDemote = msg.mentionedIds;
    } else if (msg.hasQuotedMsg) {
        const quotedMsg = await msg.getQuotedMessage();
        if (quotedMsg.author) {
            usersToDemote.push(quotedMsg.author);
        }
    }

    if (usersToDemote.length === 0) {
        await msg.reply(theme.messages.groupCmd.noUserMentioned + " or reply to the user's message.");
        return;
    }

    const targetUserId = usersToDemote[0]; // Demote one at a time
    const targetContact = await client.getContactById(targetUserId);
    const targetUserName = targetContact.pushname || targetContact.name || targetUserId.split('@')[0];

    const targetParticipant = await getChatParticipant(chat, targetUserId);
    if (!targetParticipant) {
        await msg.reply(theme.messages.groupCmd.targetUserNotMember.replace('{user}', targetUserName));
        return;
    }

    if (!targetParticipant.isAdmin && !targetParticipant.isSuperAdmin) {
        await msg.reply(theme.messages.groupCmd.targetUserNotAdmin.replace('{user}', targetUserName));
        return;
    }

    // Cannot demote group creator (superAdmin) - whatsapp-web.js should handle this error.
    // Or if bot tries to demote another admin with higher privileges if bot isn't creator.

    try {
        await chat.demoteParticipants([targetUserId]);
        await msg.reply(theme.messages.groupCmd.demote.success.replace('{user}', targetUserName));
    } catch (error) {
        console.error(`Error in .demote command for ${targetUserName}:`, error);
        await msg.reply(theme.messages.groupCmd.demote.fail.replace('{user}', targetUserName) + ` (Error: ${error.message})`);
    }
}

module.exports = {
    handleDemoteCommand
};
