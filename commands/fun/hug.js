async function handleHugCommand(msg, args, client, theme, botPrefix) {
    const chat = await msg.getChat();
    await chat.sendStateTyping();

    if (msg.mentionedIds.length === 0) {
        let replyMsgContent = theme.messages.interactiveCmd.noMention;
        replyMsgContent = replyMsgContent.replace('{prefix}', botPrefix).replace('{commandName}', 'hug');
        await msg.reply(replyMsgContent + (theme.signatures.textOnlyAppend || ""));
        await chat.clearState();
        return;
    }

    // Get sender's name (or number if name not available)
    const senderContact = await msg.getContact();
    const senderName = senderContact.pushname || senderContact.name || msg.author.split('@')[0];

    // Get mentioned user's name
    // For simplicity, we'll take the first mentioned user for this command.
    // To get contact for mentionedId: client.getContactById(msg.mentionedIds[0])
    const mentionedId = msg.mentionedIds[0];
    const mentionedContact = await client.getContactById(mentionedId);
    const mentionedUserName = mentionedContact.pushname || mentionedContact.name || mentionedId.split('@')[0];

    let replyMsgContent = theme.messages.interactiveCmd.hug;
    replyMsgContent = replyMsgContent
        .replace('{SENDER}', senderName)
        .replace('{MENTIONED_USER}', `@${mentionedId.split('@')[0]}`); // Tag the user

    // This is a text message, so append signature
    await client.sendMessage(msg.from, replyMsgContent + (theme.signatures.textOnlyAppend || ""), { mentions: [mentionedContact] });
    await chat.clearState();
}

module.exports = {
    handleHugCommand
};
// Note: The noMention reply also needs to be signed.
// if (msg.mentionedIds.length === 0) {
//     let replyMsg = theme.messages.interactiveCmd.noMention;
//     replyMsg = replyMsg.replace('{prefix}', botPrefix).replace('{commandName}', 'hug');
//     await msg.reply(replyMsg + (theme.signatures.textOnlyAppend || "")); // SIGNED
//     await chat.clearState();
//     return;
// }
