// Command: .promote <@user_or_reply_to_user>

async function handlePromoteCommand(msg, args, client, theme, botPrefix, activeGames, isUserAdmin, isBotAdmin, getChatParticipant) {
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

    let usersToPromote = [];
    if (msg.mentionedIds.length > 0) {
        usersToPromote = msg.mentionedIds;
    } else if (msg.hasQuotedMsg) {
        const quotedMsg = await msg.getQuotedMessage();
        if (quotedMsg.author) {
            usersToPromote.push(quotedMsg.author);
        }
    }

    if (usersToPromote.length === 0) {
        await msg.reply(theme.messages.groupCmd.noUserMentioned + " or reply to the user's message.");
        return;
    }

    const targetUserId = usersToPromote[0]; // Promote one at a time for simplicity
    const targetContact = await client.getContactById(targetUserId);
    const targetUserName = targetContact.pushname || targetContact.name || targetUserId.split('@')[0];

    const targetParticipant = await getChatParticipant(chat, targetUserId);
    if (!targetParticipant) {
        await msg.reply(theme.messages.groupCmd.targetUserNotMember.replace('{user}', targetUserName));
        return;
    }

    if (targetParticipant.isAdmin || targetParticipant.isSuperAdmin) {
        await msg.reply(theme.messages.groupCmd.targetUserIsAdmin.replace('{user}', targetUserName));
        return;
    }

    try {
        await chat.promoteParticipants([targetUserId]);
        await msg.reply(theme.messages.groupCmd.promote.success.replace('{user}', targetUserName));
    } catch (error) {
        console.error(`Error in .promote command for ${targetUserName}:`, error);
        await msg.reply(theme.messages.groupCmd.promote.fail.replace('{user}', targetUserName) + ` (Error: ${error.message})`);
    }
}

module.exports = {
    handlePromoteCommand
};
