// Kick user from group command
const config = require('../../config');

module.exports = {
    name: 'kick',
    description: 'Removes a user from the group. Bot and command issuer must be admin.',
    usage: '<@user1> [@user2 ...]',
    aliases: ['remove'],
    // groupAdminOnly: true, // User issuing command must be admin
    // botAdminOnly: true,   // Bot must be admin
    async execute(client, message, args) {
        const chat = await message.getChat();
        if (!chat.isGroup) {
            return message.reply('This command can only be used in a group.');
        }

        // Check if bot is an admin
        const botParticipant = chat.participants.find(p => p.id._serialized === client.info.wid._serialized);
        if (!botParticipant || !botParticipant.isAdmin) {
            return message.reply('I need to be an admin in this group to remove members.');
        }

        // Check if sender is an admin
        const senderId = message.author || message.from;
        const senderParticipant = chat.participants.find(p => p.id._serialized === senderId);
        if (!senderParticipant || !senderParticipant.isAdmin) {
            return message.reply('You need to be an admin in this group to remove members.');
        }

        if (message.mentionedIds.length === 0 && !message.hasQuotedMsg) {
            return message.reply(`Please mention the user(s) to kick or reply to their message.\nExample: ${config.prefix}kick @user1 @user2`);
        }

        let usersToKick = [];
        if (message.hasQuotedMsg) {
            const quotedMsg = await message.getQuotedMessage();
            if (quotedMsg.author || quotedMsg.from) {
                 usersToKick.push(quotedMsg.author || quotedMsg.from);
            } else {
                return message.reply("Could not identify user from quoted message.");
            }
        }

        usersToKick = usersToKick.concat(message.mentionedIds);
        usersToKick = [...new Set(usersToKick)]; // Remove duplicates

        if (usersToKick.length === 0) {
            return message.reply('No users specified to kick.');
        }

        let successReply = 'Kick results:\n';
        let someFailed = false;
        let attemptCount = 0;

        for (const userId of usersToKick) {
            if (userId === client.info.wid._serialized) {
                successReply += `❌ Cannot kick myself (${config.botName}).\n`;
                someFailed = true;
                continue;
            }
            if (userId === `${config.ownerNumber}@c.us`) {
                successReply += `❌ Cannot kick the bot owner.\n`;
                someFailed = true;
                continue;
            }
            // Check if target user is also an admin (and not the group creator if that logic exists)
            // Some WhatsApp versions/libraries might prevent kicking other admins unless you are creator
            const targetParticipant = chat.participants.find(p => p.id._serialized === userId);
            if (targetParticipant && targetParticipant.isAdmin && !targetParticipant.isSuperAdmin) { // isSuperAdmin for creator
                 // Allow kicking other admins if sender is also admin (already checked)
                 // However, some platforms restrict this.
            }
            if (targetParticipant && targetParticipant.isSuperAdmin) {
                successReply += `❌ Cannot kick the group creator (${targetParticipant.id.user}).\n`;
                someFailed = true;
                continue;
            }


            attemptCount++;
            try {
                await chat.removeParticipants([userId]);
                const contact = await client.getContactById(userId);
                successReply += `✅ Successfully kicked ${contact.pushname || userId.replace('@c.us','')}.\n`;
            } catch (error) {
                const contact = await client.getContactById(userId).catch(() => null);
                const userName = contact ? contact.pushname : userId.replace('@c.us','');
                console.error(`Error kicking participant ${userName}:`, error);
                successReply += `❌ Failed to kick ${userName}: ${error.message || 'Unknown error'}.\n`;
                someFailed = true;
            }
        }

        if (attemptCount === 0 && usersToKick.length > 0) {
             return message.reply(successReply.trim() || "No valid users found to attempt kicking.");
        }


        message.reply(successReply.trim());
    },
};
