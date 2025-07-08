// Command: .vv (reply to a view-once message)

async function handleVvCommand(msg, args, client, theme, botPrefix) {
    const chat = await msg.getChat();

    if (!msg.hasQuotedMsg) {
        await msg.reply(theme.messages.vvCmd.noReply);
        return;
    }

    const quotedMsg = await msg.getQuotedMessage();

    // isViewOnce property indicates if it was a view-once message.
    // The bot can only download it if it hasn't "opened" it yet.
    // If auto-download of media is on for the bot's WhatsApp account, this might be tricky.
    if (!quotedMsg.isViewOnce || !quotedMsg.hasMedia) {
        await msg.reply(theme.messages.vvCmd.notViewOnce);
        return;
    }

    try {
        await chat.sendStateTyping();

        const senderContact = await quotedMsg.getContact(); // Contact who sent the view-once
        const senderName = senderContact.pushname || senderContact.name || (quotedMsg.author || quotedMsg.from).split('@')[0];

        await msg.reply(theme.messages.vvCmd.saving.replace('{userName}', senderName));

        const media = await quotedMsg.downloadMedia();

        if (!media) {
            await msg.reply(theme.messages.vvCmd.fail + " (Could not download the media).");
            await chat.clearState();
            return;
        }

        // The original caption of a view-once message is not directly available in the same way as regular media.
        // quotedMsg.body will be empty for view-once image/video.
        // We'll just indicate it was a view-once.
        const originalCaption = quotedMsg.caption || ""; // View once media can have captions set by sender

        const finalCaption = theme.messages.vvCmd.caption
            .replace('{userName}', senderName)
            .replace('{originalCaption}', originalCaption ? `\nOriginal caption: ${originalCaption}` : " (View-once media)");

        await client.sendMessage(msg.from, media, { caption: finalCaption.trim() });
        // await msg.reply(theme.messages.vvCmd.success); // Optional, sending media is success indication

        await chat.clearState();

    } catch (error) {
        console.error("Error in .vv command:", error);
        // Check if error is due to already viewed/expired view-once
        if (error.message && (error.message.includes("already been opened") || error.message.includes("already viewed"))) {
            await msg.reply(theme.messages.vvCmd.fail + " (This view-once message might have already been opened or expired).");
        } else {
            await msg.reply(theme.messages.vvCmd.fail + ` (Error: ${error.message})`);
        }
        if (chat) await chat.clearState();
    }
}

module.exports = {
    handleVvCommand
};
