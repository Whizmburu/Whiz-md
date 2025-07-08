// Command: .add <@user_or_number_or_reply_to_contact>

async function handleAddCommand(msg, args, client, theme, botPrefix, activeGames, isUserAdmin, isBotAdmin, getChatParticipant) {
    const chat = await msg.getChat();

    if (!chat.isGroup) {
        await msg.reply(theme.messages.groupCmd.notGroup);
        return;
    }

    if (!await isBotAdmin(chat, client)) {
        await msg.reply(theme.messages.groupCmd.botNotAdmin);
        return;
    }

    // Also check if user sending command is admin
    const senderIsAdmin = await isUserAdmin(chat, msg.author || msg.from);
    if (!senderIsAdmin) {
        await msg.reply(theme.messages.groupCmd.userNotAdmin);
        return;
    }

    let usersToAdd = [];

    if (msg.mentionedIds.length > 0) {
        usersToAdd = msg.mentionedIds;
    } else if (args.length > 0) {
        // Assume args are numbers, try to format them as user IDs
        usersToAdd = args.map(arg => arg.replace(/[^0-9]/g, '') + '@c.us');
        // Basic validation if it looks like a number-based ID
        usersToAdd = usersToAdd.filter(id => id.length > 10 && id.endsWith('@c.us'));
    } else if (msg.hasQuotedMsg) {
        const quotedMsg = await msg.getQuotedMessage();
        if (quotedMsg.author) { // If quoting a user's message
             usersToAdd.push(quotedMsg.author);
        } else if (quotedMsg.type === 'vcard' && quotedMsg.vCards.length > 0) { // If quoting a contact card
            // Assuming the first vCard is the one to add.
            // vCard format: "BEGIN:VCARD\nVERSION:3.0\nN:;User Name;;;\nFN:User Name\nTEL;type=CELL;waid=12345678901:12345678901\nEND:VCARD"
            const vcard = quotedMsg.vCards[0];
            const match = vcard.match(/waid=(\d+):/);
            if (match && match[1]) {
                usersToAdd.push(`${match[1]}@c.us`);
            }
        }
    }

    if (usersToAdd.length === 0) {
        await msg.reply(theme.messages.groupCmd.noUserMentioned + " or reply to a user's message/contact card.");
        return;
    }

    // Filter out users already in the group
    const currentParticipantIds = new Set(chat.participants.map(p => p.id._serialized));
    const finalUsersToAdd = [];
    let alreadyInGroupUsers = [];

    for (const userId of usersToAdd) {
        if (currentParticipantIds.has(userId)) {
            const contact = await client.getContactById(userId);
            alreadyInGroupUsers.push(contact.pushname || userId.split('@')[0]);
        } else {
            finalUsersToAdd.push(userId);
        }
    }

    if (alreadyInGroupUsers.length > 0) {
        const names = alreadyInGroupUsers.join(', ');
        await msg.reply(theme.messages.groupCmd.add.alreadyInGroup.replace('{user}', names));
    }

    if (finalUsersToAdd.length === 0 && alreadyInGroupUsers.length > 0) {
        // All specified users were already in group, no one to add.
        return;
    }
    if (finalUsersToAdd.length === 0 && alreadyInGroupUsers.length === 0) {
         await msg.reply(theme.messages.groupCmd.noUserMentioned + " or provide valid numbers."); // Re-check if parsing failed
        return;
    }


    try {
        const result = await chat.addParticipants(finalUsersToAdd);
        // result object structure:
        // { 'userid@c.us': { code: 200, message: 'OK' } } for success
        // { 'invaliduserid@c.us': { code: 403, message: 'User privacy settings prevent adding to group' } } for failure

        let successfulAdds = 0;
        let failedAddsDetails = [];

        for (const userId in result) {
            if (result[userId].code === 200 || result[userId].message === 'OK') {
                successfulAdds++;
            } else {
                const contact = await client.getContactById(userId);
                failedAddsDetails.push(`${contact.pushname || userId.split('@')[0]} (Reason: ${result[userId].message || result[userId].code})`);
            }
        }

        if (successfulAdds > 0) {
            await msg.reply(theme.messages.groupCmd.add.success.replace('{userCount}', successfulAdds));
        }
        if (failedAddsDetails.length > 0) {
            await msg.reply(theme.messages.groupCmd.add.fail.replace('{userCount}', failedAddsDetails.length) + `\nDetails: ${failedAddsDetails.join(', ')}`);
        }

    } catch (error) {
        console.error("Error in .add command:", error);
        await msg.reply(theme.messages.groupCmd.add.fail.replace('{userCount}', finalUsersToAdd.length) + ` (Error: ${error.message})`);
    }
}

module.exports = {
    handleAddCommand
};
