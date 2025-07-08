// Command: .block <@user_or_number>

async function handleBlockCommand(msg, args, client, theme, botPrefix, activeGames, isOwnerHelper) {
    // Owner check is done in index.js before calling this handler

    let targetUserId = "";
    if (msg.mentionedIds.length > 0) {
        targetUserId = msg.mentionedIds[0];
    } else if (args.length > 0) {
        targetUserId = args[0].replace(/[^0-9]/g, '') + '@c.us';
        if (targetUserId.length < 10 || !targetUserId.endsWith('@c.us')) { // Basic validation
            await msg.reply(theme.messages.ownerCmd.userNotFound.replace('{targetUser}', args[0]));
            return;
        }
    } else if (msg.hasQuotedMsg) {
        const quotedMsg = await msg.getQuotedMessage();
        if (quotedMsg.author) {
            targetUserId = quotedMsg.author;
        } else if (quotedMsg.from) { // If quoted message is from a user in a PM
            targetUserId = quotedMsg.from;
        }
    }

    if (!targetUserId) {
        await msg.reply(theme.messages.ownerCmd.noTarget);
        return;
    }

    try {
        const contact = await client.getContactById(targetUserId);
        if (!contact) {
            await msg.reply(theme.messages.ownerCmd.userNotFound.replace('{targetUser}', targetUserId.split('@')[0]));
            return;
        }

        const contactName = contact.pushname || contact.name || targetUserId.split('@')[0];

        if (contact.isBlocked) {
            await msg.reply(theme.messages.ownerCmd.block.alreadyBlocked.replace('{targetUser}', contactName));
            return;
        }

        await contact.block();
        await msg.reply(theme.messages.ownerCmd.block.success.replace('{targetUser}', contactName));

    } catch (error) {
        console.error("Error in .block command:", error);
        await msg.reply(theme.messages.ownerCmd.block.fail.replace('{targetUser}', targetUserId.split('@')[0]) + ` (Error: ${error.message})`);
    }
}

module.exports = {
    handleBlockCommand
};
