// Promote user in group command
const config = require('../../config');

module.exports = {
    name: 'promote',
    description: 'Promotes a user to admin in the group. Bot and command issuer must be admin.',
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
            return message.reply('I need to be an admin in this group to promote members.');
        }

        const senderId = message.author || message.from;
        const senderParticipant = chat.participants.find(p => p.id._serialized === senderId);
        if (!senderParticipant || !senderParticipant.isAdmin) {
            return message.reply('You need to be an admin in this group to promote members.');
        }

        if (message.mentionedIds.length === 0 && !message.hasQuotedMsg) {
            return message.reply(`Please mention the user(s) to promote or reply to their message.\nExample: ${config.prefix}promote @user1 @user2`);
        }

        let usersToPromote = [];
        if (message.hasQuotedMsg) {
            const quotedMsg = await message.getQuotedMessage();
             if (quotedMsg.author || quotedMsg.from) {
                 usersToPromote.push(quotedMsg.author || quotedMsg.from);
            } else {
                return message.reply("Could not identify user from quoted message.");
            }
        }
        usersToPromote = usersToPromote.concat(message.mentionedIds);
        usersToPromote = [...new Set(usersToPromote)]; // Remove duplicates

        if (usersToPromote.length === 0) {
            return message.reply('No users specified to promote.');
        }

        let successReply = 'Promotion results:\n';
        let attemptCount = 0;

        for (const userId of usersToPromote) {
            const targetParticipant = chat.participants.find(p => p.id._serialized === userId);
            if (!targetParticipant) {
                const contact = await client.getContactById(userId).catch(() => null);
                const userName = contact ? contact.pushname : userId.replace('@c.us','');
                successReply += `❌ User ${userName} is not in this group.\n`;
                continue;
            }
            if (targetParticipant.isAdmin) {
                const contact = await client.getContactById(userId).catch(() => null);
                const userName = contact ? contact.pushname : userId.replace('@c.us','');
                successReply += `⚠️ User ${userName} is already an admin.\n`;
                continue;
            }

            attemptCount++;
            try {
                await chat.promoteParticipants([userId]);
                const contact = await client.getContactById(userId);
                successReply += `✅ Successfully promoted ${contact.pushname || userId.replace('@c.us','')}.\n`;
            } catch (error) {
                const contact = await client.getContactById(userId).catch(() => null);
                const userName = contact ? contact.pushname : userId.replace('@c.us','');
                console.error(`Error promoting participant ${userName}:`, error);
                successReply += `❌ Failed to promote ${userName}: ${error.message || 'Unknown error'}.\n`;
            }
        }

        if (attemptCount === 0 && usersToPromote.length > 0) {
             return message.reply(successReply.trim() || "No valid users found to attempt promoting.");
        }

        message.reply(successReply.trim());
    },
};
