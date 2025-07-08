// .pat command
const config = require('../../config');

module.exports = {
    name: 'pat',
    description: 'Pats a user (or users).',
    usage: '@user',
    category: 'fun_games',
    async execute(client, message, args) {
        let mentionedUsers = message.mentionedIds;
        let pattedUserText = "";

        if (mentionedUsers.length === 0) {
            return message.reply(`Who do you want to pat? Mention them! Usage: \`${config.prefix}pat @user\``);
        }

        const userNames = [];
        for (const userId of mentionedUsers) {
            const contact = await client.getContactById(userId);
            userNames.push(contact.pushname || contact.name || `@${userId.split('@')[0]}`);
        }

        pattedUserText = userNames.join(' and ');

        const senderContact = await message.getContact();
        const senderName = senderContact.pushname || senderContact.name || "Someone";

        const patMessages = [
            `✋ *${senderName}* gently pats *${pattedUserText}* on the head. Good job!`,
            `👍 *${senderName}* gives *${pattedUserText}* an encouraging pat on the back!`,
            `😊 *${senderName}* pats *${pattedUserText}* reassuringly. You got this!`,
            `撫でる! *${senderName}* pats *${pattedUserText}*. Well done!`,
        ];
        const randomPatMessage = patMessages[Math.floor(Math.random() * patMessages.length)];

        let mentions = [];
        for (const userId of mentionedUsers) {
            const contact = await client.getContactById(userId);
            mentions.push(contact);
        }
        await message.reply(randomPatMessage, undefined, { mentions });
    },
};
