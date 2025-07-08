async function handleKissCommand(msg, args, client, theme, botPrefix) {
    const chat = await msg.getChat();
    await chat.sendStateTyping();

    if (msg.mentionedIds.length === 0) {
        let replyMsg = theme.messages.interactiveCmd.noMention;
        replyMsg = replyMsg.replace('{prefix}', botPrefix).replace('{commandName}', 'kiss');
        await msg.reply(replyMsg);
        await chat.clearState();
        return;
    }

    const senderContact = await msg.getContact();
    const senderName = senderContact.pushname || senderContact.name || msg.author.split('@')[0];

    const mentionedId = msg.mentionedIds[0];
    const mentionedContact = await client.getContactById(mentionedId);
    // const mentionedUserName = mentionedContact.pushname || mentionedContact.name || mentionedId.split('@')[0];

    let replyMsg = theme.messages.interactiveCmd.kiss;
    replyMsg = replyMsg
        .replace('{SENDER}', senderName)
        .replace('{MENTIONED_USER}', `@${mentionedId.split('@')[0]}`);

    await client.sendMessage(msg.from, replyMsg, { mentions: [mentionedContact] });
    await chat.clearState();
}

module.exports = {
    handleKissCommand
};
