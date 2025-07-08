// Command: .hidetag <message>
// This is an experimental command. Effectiveness of "hiding" tags varies.

async function handleHidetagCommand(msg, args, client, theme, botPrefix, activeGames, isUserAdmin, isBotAdmin, getChatParticipant) {
    const chat = await msg.getChat();

    if (!chat.isGroup) {
        await msg.reply(theme.messages.groupCmd.notGroup);
        return;
    }

    const messageText = args.join(' ');
    if (!messageText) {
        await msg.reply(theme.messages.groupCmd.hidetag.fail); // Or a more specific "no message" theme
        return;
    }

    // Optional: Check if sender is admin
    // const senderId = msg.author || msg.from;
    // if (!await isUserAdmin(chat, senderId)) {
    //    await msg.reply(theme.messages.groupCmd.userNotAdmin);
    //    return;
    // }

    try {
        // await chat.sendStateTyping(); // Not really needed for this

        let mentions = [];
        let hiddenTagText = "";

        // One common technique: intersperse message characters with zero-width characters and mentions
        // This is a very basic attempt and might not be effective or could be annoying.
        // A more sophisticated approach might involve specific unicode characters.

        // Let's build the text with mentions that are not directly visible in the main flow.
        // The primary purpose of the `mentions` array in sendMessage is for notifications.
        // The visual "hiding" is secondary and often unreliable.

        for (let participant of chat.participants) {
            mentions.push(participant);
        }

        // For hidetag, the message itself is sent, and the mentions array handles notifications.
        // The "hiding" part is more about not explicitly writing "@user" in the visible text.
        // A simple way is just to send the message and the mentions array.
        // More complex methods try to embed mention characters in ways they don't render as blue tags.
        // We'll keep it simple: send the text, and the `mentions` array will notify.
        // The "hiding" is that their names aren't in the `messageText` explicitly with @.

        await client.sendMessage(chat.id._serialized, messageText, { mentions });

        // No need for clearState here usually
    } catch (error) {
        console.error("Error in .hidetag command:", error);
        await msg.reply("❌ Oops! Something went wrong with the hidetag command.");
    }
}

module.exports = {
    handleHidetagCommand
};
