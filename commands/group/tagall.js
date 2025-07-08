// Command: .tagall [optional_message]

async function handleTagallCommand(msg, args, client, theme, botPrefix, activeGames, isUserAdmin, isBotAdmin, getChatParticipant) {
    const chat = await msg.getChat();

    if (!chat.isGroup) {
        await msg.reply(theme.messages.groupCmd.notGroup);
        return;
    }

    // Optional: Check if sender is admin
    // const senderId = msg.author || msg.from;
    // if (!await isUserAdmin(chat, senderId)) {
    //     await msg.reply(theme.messages.groupCmd.userNotAdmin);
    //     return;
    // }

    try {
        await chat.sendStateTyping();

        let text = args.join(' ') || (theme.messages.groupCmd.tagall.header || "📢 Attention Everyone!");
        let mentions = [];

        for (let participant of chat.participants) {
            // const contact = await client.getContactById(participant.id._serialized); // Already have contact objects in participant
            mentions.push(participant); // participant object itself can be used in mentions array
            text += ` @${participant.id.user}`; // Append @user to text for visual cue
        }

        // Ensure the text isn't too long for WhatsApp caption/message limits if combined with many mentions
        // Though whatsapp-web.js handles sending mentions separately from the text body if needed.
        // The text part with @user is more for the visual appearance in the message.

        await client.sendMessage(chat.id._serialized, text.trim(), { mentions });
        // No need to clearState if sendMessage is the last action, but good practice if more follows
        // await chat.clearState();

    } catch (error) {
        console.error("Error in .tagall command:", error);
        await msg.reply("❌ Oops! Something went wrong while trying to tag everyone.");
        // if (chat) await chat.clearState(); // Ensure cleared if error before send
    }
}

module.exports = {
    handleTagallCommand
};
