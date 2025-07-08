// .kiss command
const config = require('../../config');

module.exports = {
    name: 'kiss',
    description: 'Kisses a user (or users).',
    usage: '@user',
    category: 'fun_games',
    async execute(client, message, args) {
        let mentionedUsers = message.mentionedIds;
        let kissedUserText = "";

        if (mentionedUsers.length === 0) {
            return message.reply(`Who do you want to kiss? Mention them! Usage: \`${config.prefix}kiss @user\``);
        }

        const userNames = [];
        for (const userId of mentionedUsers) {
            const contact = await client.getContactById(userId);
            userNames.push(contact.pushname || contact.name || `@${userId.split('@')[0]}`);
        }

        kissedUserText = userNames.join(' and ');

        const senderContact = await message.getContact();
        const senderName = senderContact.pushname || senderContact.name || "Someone";

        // Check if sender is kissing themselves
        if (mentionedUsers.length === 1 && mentionedUsers[0] === senderContact.id._serialized) {
             const selfKissMessages = [
                `😘 *${senderName}* gives themselves a little smooch on the hand! Self-love!`,
                `💋 *${senderName}* blows a kiss to their reflection! Looking good!`,
            ];
            const randomSelfKiss = selfKissMessages[Math.floor(Math.random() * selfKissMessages.length)];
            return message.reply(randomSelfKiss);
        }


        const kissMessages = [
            `😘 *${senderName}* plants a sweet kiss on *${kissedUserText}*'s cheek! Mwah!`,
            `💋 *${senderName}* blows a kiss towards *${kissedUserText}*! Catch it!`,
            `😚 *${senderName}* gives *${kissedUserText}* a quick peck! So cute!`,
            `💕 *${senderName}* shares a loving kiss with *${kissedUserText}*. Aww!`,
        ];
        const randomKissMessage = kissMessages[Math.floor(Math.random() * kissMessages.length)];

        let mentions = [];
        for (const userId of mentionedUsers) {
            const contact = await client.getContactById(userId);
            mentions.push(contact);
        }
        await message.reply(randomKissMessage, undefined, { mentions });
    },
};
