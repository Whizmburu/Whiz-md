// Command: .priorityview <add|remove|list> [@user]

async function handlePriorityViewCommand(msg, args, client, theme, botPrefix, activeGames, isOwnerHelper, statusAutomation, globalState) {
    // Owner check is done in index.js
    // globalState will be an object like { priorityViewList } passed from index.js
    // to allow modification of the main list.

    const action = args[0] ? args[0].toLowerCase() : 'list';
    const mentionedUserId = msg.mentionedIds.length > 0 ? msg.mentionedIds[0] : null;
    let targetUserContact;
    let targetUserName = "Unknown User";

    if (['add', 'remove'].includes(action) && !mentionedUserId) {
        await msg.reply(theme.messages.priorityViewCmd.noUserMentioned);
        return;
    }

    if (mentionedUserId) {
        try {
            targetUserContact = await client.getContactById(mentionedUserId);
            targetUserName = targetUserContact.pushname || targetUserContact.name || mentionedUserId.split('@')[0];
        } catch (e) {
            await msg.reply(theme.messages.ownerCmd.userNotFound.replace('{targetUser}', mentionedUserId));
            return;
        }
    }

    switch (action) {
        case 'add':
            if (!globalState.priorityViewList.includes(mentionedUserId)) {
                globalState.priorityViewList.push(mentionedUserId);
                await msg.reply(theme.messages.priorityViewCmd.added.replace('{userName}', targetUserName));
            } else {
                await msg.reply(theme.messages.priorityViewCmd.alreadyExists.replace('{userName}', targetUserName));
            }
            break;

        case 'remove':
            const indexToRemove = globalState.priorityViewList.indexOf(mentionedUserId);
            if (indexToRemove > -1) {
                globalState.priorityViewList.splice(indexToRemove, 1);
                await msg.reply(theme.messages.priorityViewCmd.removed.replace('{userName}', targetUserName));
            } else {
                await msg.reply(theme.messages.priorityViewCmd.notInList.replace('{userName}', targetUserName));
            }
            break;

        case 'list':
            if (globalState.priorityViewList.length === 0) {
                await msg.reply(theme.messages.priorityViewCmd.listEmpty);
            } else {
                let listMessage = theme.messages.priorityViewCmd.listHeader.replace('{count}', globalState.priorityViewList.length) + "\n";
                for (const userId of globalState.priorityViewList) {
                    try {
                        const contact = await client.getContactById(userId);
                        const name = contact.pushname || contact.name || userId.split('@')[0];
                        listMessage += theme.messages.priorityViewCmd.listEntry
                            .replace('{userName}', name)
                            .replace('{userId}', userId) + "\n";
                    } catch (e) {
                        listMessage += theme.messages.priorityViewCmd.listEntry
                            .replace('{userName}', 'Unknown/Left')
                            .replace('{userId}', userId) + "\n";
                    }
                }
                await msg.reply(listMessage.trim());
            }
            break;

        default:
            await msg.reply(theme.messages.priorityViewCmd.usage.replace('{prefix}', botPrefix));
            break;
    }
}

module.exports = {
    handlePriorityViewCommand
};
