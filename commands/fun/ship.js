async function handleShipCommand(msg, args, client, theme, botPrefix) {
    const chat = await msg.getChat();
    await chat.sendStateTyping();

    const mentionedCount = msg.mentionedIds.length;
    const senderContact = await msg.getContact();
    const senderName = senderContact.pushname || senderContact.name || msg.author.split('@')[0];

    let user1Name = senderName;
    let user1Contact = senderContact;
    let user2Name = "";
    let user2Contact;

    const mentionsToSend = [];

    if (mentionedCount === 0) {
        // Ship sender with a random concept or self? For now, require mention.
        let replyMsgContent = theme.messages.interactiveCmd.shipNoMention;
        await msg.reply(replyMsgContent.replace(/{prefix}/g, botPrefix) + (theme.signatures.textOnlyAppend || ""));
        await chat.clearState();
        return;
    } else if (mentionedCount === 1) {
        // Ship sender with the mentioned user
        const mentionedId = msg.mentionedIds[0];
        user2Contact = await client.getContactById(mentionedId);
        user2Name = user2Contact.pushname || user2Contact.name || mentionedId.split('@')[0];
        mentionsToSend.push(user1Contact); // Sender
        mentionsToSend.push(user2Contact); // Mentioned
        user1Name = `@${msg.author.split('@')[0]}`; // Tag sender
        user2Name = `@${mentionedId.split('@')[0]}`; // Tag mentioned
    } else { // mentionedCount >= 2
        // Ship the first two mentioned users
        const mentionedId1 = msg.mentionedIds[0];
        user1Contact = await client.getContactById(mentionedId1);
        user1Name = user1Contact.pushname || user1Contact.name || mentionedId1.split('@')[0];
        user1Name = `@${mentionedId1.split('@')[0]}`; // Tag user 1

        const mentionedId2 = msg.mentionedIds[1];
        user2Contact = await client.getContactById(mentionedId2);
        user2Name = user2Contact.pushname || user2Contact.name || mentionedId2.split('@')[0];
        user2Name = `@${mentionedId2.split('@')[0]}`; // Tag user 2

        mentionsToSend.push(user1Contact);
        mentionsToSend.push(user2Contact);
    }

    const percentage = Math.floor(Math.random() * 101); // 0-100%
    let heartEmoji = "❤️";
    if (percentage < 30) heartEmoji = "💔";
    else if (percentage < 60) heartEmoji = "💛";
    else if (percentage < 80) heartEmoji = "💚";
    else heartEmoji = "💖";


    let replyMsg = theme.messages.interactiveCmd.ship;
    replyMsg = replyMsg
        .replace('{USER1}', user1Name)
        .replace('{USER2}', user2Name)
        .replace('{PERCENTAGE}', percentage)
        .replace('{HEART_EMOJI}', heartEmoji);

    await client.sendMessage(msg.from, replyMsg + (theme.signatures.textOnlyAppend || ""), { mentions: mentionsToSend });
    await chat.clearState();
}

module.exports = {
    handleShipCommand
};
