// Command: .birthday <set|check|remove|list> [params...]

// Helper to validate DD/MM format
function isValidDDMM(dateStr) {
    if (!/^\d{1,2}\/\d{1,2}$/.test(dateStr)) return false;
    const parts = dateStr.split('/');
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    if (month < 1 || month > 12) return false;
    // Basic day check, not accounting for specific days in month like 30/31 or Feb 29
    if (day < 1 || day > 31) return false;
    return true;
}

// Helper to format DD/MM to ensure leading zeros if needed (e.g., 5/3 -> 05/03)
function formatDDMM(dateStr) {
    const parts = dateStr.split('/');
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    return `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}`;
}


async function handleBirthdayCommand(msg, args, client, theme, botPrefix, activeGames, isOwnerHelper, globalState) {
    // globalState is expected to have { birthdays }
    // isOwnerHelper is the function isOwner(authorId)

    const action = args[0] ? args[0].toLowerCase() : 'check'; // Default to 'check' if no action
    const chat = await msg.getChat();
    const senderId = msg.author || msg.from;
    const senderContact = await msg.getContact();
    const senderName = senderContact.pushname || senderContact.name || senderId.split('@')[0];
    const isGroup = chat.isGroup;
    const amOwner = isOwnerHelper(senderId);

    let targetUserId = senderId; // Default target is self
    let targetUserName = senderName;
    let mentionedUserArgIndex = -1;

    // Find if a user is mentioned for set/check/remove by owner
    if (args.length > 1) {
        if (action === 'set' && args.length > 2 && msg.mentionedIds.length > 0) { // .birthday set DD/MM @user
            mentionedUserArgIndex = 2;
        } else if (['check', 'remove'].includes(action) && args.length > 1 && msg.mentionedIds.length > 0) { // .birthday check/remove @user
            mentionedUserArgIndex = 1;
        }

        if (mentionedUserArgIndex !== -1 && msg.mentionedIds.length > 0) {
            const tempTargetId = msg.mentionedIds[0];
            if (amOwner) { // Only owner can set/check/remove for others by mention
                targetUserId = tempTargetId;
                const tempContact = await client.getContactById(tempTargetId);
                targetUserName = tempContact.pushname || tempContact.name || tempTargetId.split('@')[0];
            } else if (action === 'set' || action === 'remove') {
                // If not owner, and trying to set/remove for a mentioned user, it's an error.
                // For 'check', anyone can check a mentioned user's Bday if set.
                await msg.reply(theme.messages.ownerCmd.unauthorized + " (You can only set/remove your own birthday).");
                return;
            } else if (action === 'check') { // Non-owner checking mentioned user
                 targetUserId = tempTargetId;
                const tempContact = await client.getContactById(tempTargetId);
                targetUserName = tempContact.pushname || tempContact.name || tempTargetId.split('@')[0];
            }
        }
    }


    switch (action) {
        case 'set':
            const dateStr = args[1];
            if (!dateStr) {
                await msg.reply(theme.messages.birthdayCmd.usageSet.replace(/{prefix}/g, botPrefix));
                return;
            }
            if (!isValidDDMM(dateStr)) {
                await msg.reply(theme.messages.birthdayCmd.invalidDate);
                return;
            }
            const formattedDate = formatDDMM(dateStr);
            globalState.birthdays[targetUserId] = formattedDate;

            if (targetUserId === senderId) {
                await msg.reply(theme.messages.birthdayCmd.setSuccess.replace('{date}', formattedDate));
            } else { // Was set by owner for someone else
                await msg.reply(theme.messages.birthdayCmd.setForUserSuccess
                    .replace('{userName}', targetUserName)
                    .replace('{date}', formattedDate)
                );
            }
            break;

        case 'check':
            const birthday = globalState.birthdays[targetUserId];
            if (birthday) {
                await msg.reply(theme.messages.birthdayCmd.checkResult
                    .replace('{userName}', targetUserName)
                    .replace('{date}', birthday)
                );
            } else {
                if (targetUserId === senderId) {
                    await msg.reply(theme.messages.birthdayCmd.checkSelfNotSet.replace('{prefix}', botPrefix));
                } else {
                    await msg.reply(theme.messages.birthdayCmd.checkNotSet.replace('{userName}', targetUserName));
                }
            }
            break;

        case 'remove':
            if (!amOwner && targetUserId !== senderId) { // Should have been caught earlier, but double check
                 await msg.reply(theme.messages.ownerCmd.unauthorized + " (You can only remove your own birthday).");
                return;
            }
            if (globalState.birthdays[targetUserId]) {
                delete globalState.birthdays[targetUserId];
                await msg.reply(theme.messages.birthdayCmd.removedSuccess.replace('{userName}', targetUserName));
            } else {
                 if (targetUserId === senderId) {
                    await msg.reply(theme.messages.birthdayCmd.removeSelfNotSet);
                } else {
                    await msg.reply(theme.messages.birthdayCmd.removeUserNotSet.replace('{userName}', targetUserName));
                }
            }
            break;

        case 'list':
            let listOutput = "";
            let count = 0;
            if (isGroup) {
                listOutput = theme.messages.birthdayCmd.listHeaderGroup + "\n";
                // For groups, list birthdays of members present in the group
                for (const p of chat.participants) {
                    const pId = p.id._serialized;
                    if (globalState.birthdays[pId]) {
                        const pContact = await client.getContactById(pId);
                        const pName = pContact.pushname || pContact.name || pId.split('@')[0];
                        listOutput += theme.messages.birthdayCmd.listEntry
                            .replace('{userName}', pName)
                            .replace('{date}', globalState.birthdays[pId]) + "\n";
                        count++;
                    }
                }
                if (count === 0) listOutput = theme.messages.birthdayCmd.listEmptyChat;
            } else { // Private message
                const userBday = globalState.birthdays[senderId];
                if (userBday) {
                    listOutput = theme.messages.birthdayCmd.listHeaderPm + "\n";
                    listOutput += theme.messages.birthdayCmd.listEntry
                        .replace('{userName}', senderName)
                        .replace('{date}', userBday);
                } else {
                    listOutput = theme.messages.birthdayCmd.listEmptyUser;
                }
            }
            await msg.reply(listOutput.trim());
            break;

        default:
            // Show general help for .birthday or just for 'check' as default
            const usage = `${theme.messages.birthdayCmd.usageSet.replace(/{prefix}/g, botPrefix)}\n` +
                          `${theme.messages.birthdayCmd.usageCheck.replace(/{prefix}/g, botPrefix)}\n` +
                          `${theme.messages.birthdayCmd.usageRemove.replace(/{prefix}/g, botPrefix)}\n` +
                          `${theme.messages.birthdayCmd.usageList.replace(/{prefix}/g, botPrefix)}`;
            await msg.reply(usage);
            break;
    }
}

module.exports = {
    handleBirthdayCommand
};
