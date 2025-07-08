// Demote user in group command
const config = require('../../config');

module.exports = {
    name: 'demote',
    description: 'Demotes an admin to a regular user in the group. Bot and command issuer must be admin.',
    usage: '<@user1> [@user2 ...]',
    // groupAdminOnly: true, // User issuing command must be admin
    // botAdminOnly: true,   // Bot must be admin
    async execute(client, message, args) {
        const chat = await message.getChat();
        if (!chat.isGroup) {
            return message.reply('This command can only be used in a group.');
        }

        const botParticipant = chat.participants.find(p => p.id._serialized === client.info.wid._serialized);
        if (!botParticipant || !botParticipant.isAdmin) {
            return message.reply('I need to be an admin in this group to demote members.');
        }

        const senderId = message.author || message.from;
        const senderParticipant = chat.participants.find(p => p.id._serialized === senderId);
        if (!senderParticipant || !senderParticipant.isAdmin) {
            return message.reply('You need to be an admin in this group to demote members.');
        }

        if (message.mentionedIds.length === 0 && !message.hasQuotedMsg) {
            return message.reply(`Please mention the admin(s) to demote or reply to their message.\nExample: ${config.prefix}demote @admin1 @admin2`);
        }

        let usersToDemote = [];
        if (message.hasQuotedMsg) {
            const quotedMsg = await message.getQuotedMessage();
            if (quotedMsg.author || quotedMsg.from) {
                 usersToDemote.push(quotedMsg.author || quotedMsg.from);
            } else {
                return message.reply("Could not identify user from quoted message.");
            }
        }
        usersToDemote = usersToDemote.concat(message.mentionedIds);
        usersToDemote = [...new Set(usersToDemote)]; // Remove duplicates


        if (usersToDemote.length === 0) {
            return message.reply('No users specified to demote.');
        }

        let successReply = 'Demotion results:\n';
        let attemptCount = 0;

        for (const userId of usersToDemote) {
            if (userId === client.info.wid._serialized) {
                successReply += `❌ Cannot demote myself (${config.botName}).\n`;
                continue;
            }
             if (userId === `${config.ownerNumber}@c.us`) {
                successReply += `❌ Cannot demote the bot owner.\n`;
                continue;
            }

            const targetParticipant = chat.participants.find(p => p.id._serialized === userId);
            if (!targetParticipant) {
                const contact = await client.getContactById(userId).catch(() => null);
                const userName = contact ? contact.pushname : userId.replace('@c.us','');
                successReply += `❌ User ${userName} is not in this group.\n`;
                continue;
            }
            if (!targetParticipant.isAdmin) {
                 const contact = await client.getContactById(userId).catch(() => null);
                const userName = contact ? contact.pushname : userId.replace('@c.us','');
                successReply += `⚠️ User ${userName} is not an admin.\n`;
                continue;
            }
            if (targetParticipant.isSuperAdmin) { // Group creator
                const contact = await client.getContactById(userId).catch(() => null);
                const userName = contact ? contact.pushname : userId.replace('@c.us','');
                successReply += `❌ Cannot demote the group creator (${userName}).\n`;
                continue;
            }

            attemptCount++;
            try {
                await chat.demoteParticipants([userId]);
                const contact = await client.getContactById(userId);
                successReply += `✅ Successfully demoted ${contact.pushname || userId.replace('@c.us','')}.\n`;
            } catch (error) {
                const contact = await client.getContactById(userId).catch(() => null);
                const userName = contact ? contact.pushname : userId.replace('@c.us','');
                console.error(`Error demoting participant ${userName}:`, error);
                successReply += `❌ Failed to demote ${userName}: ${error.message || 'Unknown error'}.\n`;
            }
        }

        if (attemptCount === 0 && usersToDemote.length > 0) {
             return message.reply(successReply.trim() || "No valid users found to attempt demoting.");
        }
        message.reply(successReply.trim());
    },
};
