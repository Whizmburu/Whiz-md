// Command: .link

async function handleLinkCommand(msg, args, client, theme, botPrefix, activeGames, isUserAdmin, isBotAdmin, getChatParticipant) {
    const chat = await msg.getChat();

    if (!chat.isGroup) {
        await msg.reply(theme.messages.groupCmd.notGroup);
        return;
    }

    if (!await isBotAdmin(chat, client)) {
        // Bot might still be able to get link if it's a member, but getInviteCode usually needs admin.
        // However, if settings allow any member to share link, this might work.
        // For consistency, let's require bot admin for generating a fresh/reliable link.
        await msg.reply(theme.messages.groupCmd.botNotAdmin + " (to generate a new invite link).");
        return;
    }

    try {
        await chat.sendStateTyping();
        const inviteCode = await chat.getInviteCode();
        const inviteLink = `https://chat.whatsapp.com/${inviteCode}`;

        await msg.reply(theme.messages.groupCmd.link.success.replace('{inviteLink}', inviteLink));
        await chat.clearState();
    } catch (error) {
        console.error("Error in .link command:", error);
        await msg.reply(theme.messages.groupCmd.link.fail);
        if (chat) await chat.clearState();
    }
}

module.exports = {
    handleLinkCommand
};
