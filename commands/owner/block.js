// Block Command - Owner Only
const config = require('../../config');

module.exports = {
    name: 'block',
    description: 'Blocks a user from using the bot. Owner only.',
    ownerOnly: true,
    usage: '<@user or number>',
    async execute(client, message, args) {
        if (args.length === 0 && !message.hasQuotedMsg) {
            return message.reply(`Please mention a user or reply to their message to block, or provide their number.\nUsage: ${config.prefix}block @user OR ${config.prefix}block <number>`);
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
            return message.reply('Could not identify the user to block.');
        }

        // Prevent blocking self or owner
        if (targetUser === client.info.wid._serialized) {
            return message.reply("You can't block the bot itself.");
        }
        if (targetUser === `${config.ownerNumber}@c.us`) {
            return message.reply("You can't block the bot owner.");
        }


        try {
            const contact = await client.getContactById(targetUser);
            if (!contact) {
                return message.reply(`Could not find contact for ${targetUser}. They might not be in your contacts or it's an invalid ID.`);
            }

            await contact.block();
            message.reply(`User ${contact.pushname || contact.number} (${targetUser}) has been blocked.`);
            console.log(`User ${targetUser} blocked by owner.`);

            // Optional: Add to a persistent block list if you want to maintain blocks across sessions
            // or prevent unblocking by others if you implement an unblock command for mods.

        } catch (error) {
            console.error('Error blocking user:', error);
            message.reply(`Failed to block user ${targetUser}. Error: ${error.message}`);
        }
    },
};
