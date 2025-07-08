// Unblock Command - Owner Only
const config = require('../../config');

module.exports = {
    name: 'unblock',
    description: 'Unblocks a user. Owner only.',
    ownerOnly: true,
    usage: '<@user or number>',
    async execute(client, message, args) {
        if (args.length === 0 && !message.hasQuotedMsg) {
            return message.reply(`Please mention a user or reply to their message to unblock, or provide their number.\nUsage: ${config.prefix}unblock @user OR ${config.prefix}unblock <number>`);
        }

        let targetUser;

        if (message.hasQuotedMsg) {
            const quotedMsg = await message.getQuotedMessage();
            targetUser = quotedMsg.author || quotedMsg.from;
        } else if (message.mentionedIds.length > 0) {
            targetUser = message.mentionedIds[0];
        } else {
            const number = args[0].replace(/[^0-9]/g, '');
            if (!number) return message.reply('Invalid number provided.');
            targetUser = `${number}@c.us`;
        }

        if (!targetUser) {
            return message.reply('Could not identify the user to unblock.');
        }

        try {
            const contact = await client.getContactById(targetUser);
            if (!contact) {
                return message.reply(`Could not find contact for ${targetUser}.`);
            }

            // whatsapp-web.js does not have a separate "isBlocked" check before unblocking.
            // It will just attempt to unblock. If they weren't blocked, it usually doesn't error.
            await contact.unblock();
            message.reply(`User ${contact.pushname || contact.number} (${targetUser}) has been unblocked.`);
            console.log(`User ${targetUser} unblocked by owner.`);

        } catch (error) {
            console.error('Error unblocking user:', error);
            message.reply(`Failed to unblock user ${targetUser}. Error: ${error.message}`);
        }
    },
};
