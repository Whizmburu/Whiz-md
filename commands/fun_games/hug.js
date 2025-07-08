// .hug command
const config = require('../../config');

module.exports = {
    name: 'hug',
    description: 'Hugs a user (or users).',
    usage: '@user',
    category: 'fun_games',
    async execute(client, message, args) {
        let mentionedUsers = message.mentionedIds;
        let huggedUserText = "";

        if (mentionedUsers.length === 0) {
            return message.reply(`Who do you want to hug? Mention them! Usage: \`${config.prefix}hug @user\``);
        }

        const userNames = [];
        for (const userId of mentionedUsers) {
            const contact = await client.getContactById(userId);
            userNames.push(contact.pushname || contact.name || `@${userId.split('@')[0]}`);
        }

        huggedUserText = userNames.join(' and ');

        const senderContact = await message.getContact();
        const senderName = senderContact.pushname || senderContact.name || "Someone";

        const hugMessages = [
            `🤗 *${senderName}* gives *${huggedUserText}* a big, warm hug!`,
            `🫂 *${senderName}* embraces *${huggedUserText}* tightly! So sweet!`,
            `🥰 *${senderName}* sends a comforting hug to *${huggedUserText}*.`,
            `껴안다! *${senderName}* is hugging *${huggedUserText}* with lots of love!`,
        ];
        const randomHugMessage = hugMessages[Math.floor(Math.random() * hugMessages.length)];

        let mentions = [];
        for (const userId of mentionedUsers) {
            const contact = await client.getContactById(userId);
            mentions.push(contact);
        }
        // await client.sendMessage(message.from, randomHugMessage, { mentions });
        // Replying to the original message for context, and mentioning in the text for now.
        // Sending with mentions object is better for actual tagging.
        await message.reply(randomHugMessage, undefined, { mentions }); // Send as reply, with mentions
    },
};
