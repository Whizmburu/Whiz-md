// Command: .setpp (reply to an image)
const { MessageMedia } = require('whatsapp-web.js');


async function handleSetppCommand(msg, args, client, theme, botPrefix, activeGames, isUserAdmin, isBotAdmin, getChatParticipant) {
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

    if (!msg.hasQuotedMsg) {
        await msg.reply(theme.messages.groupCmd.setpp.noImage);
        return;
    }

    const quotedMsg = await msg.getQuotedMessage();
    if (!quotedMsg.hasMedia || quotedMsg.type !== 'image') {
        await msg.reply(theme.messages.groupCmd.setpp.noImage + " (Quoted message is not an image).");
        return;
    }

    try {
        await chat.sendStateTyping();
        const imageMedia = await quotedMsg.downloadMedia();

        // MessageMedia is already what downloadMedia returns.
        // If it needed to be reconstructed from buffer:
        // const media = new MessageMedia(imageMedia.mimetype, imageMedia.data, imageMedia.filename);

        await chat.setProfilePic(imageMedia);
        await msg.reply(theme.messages.groupCmd.setpp.success);
        await chat.clearState();
    } catch (error) {
        console.error("Error in .setpp command:", error);
        await msg.reply(theme.messages.groupCmd.setpp.fail + ` (Error: ${error.message})`);
        if (chat) await chat.clearState();
    }
}

module.exports = {
    handleSetppCommand
};
