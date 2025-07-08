// .slap command
const config = require('../../config');

module.exports = {
    name: 'slap',
    description: 'Slaps a user (or users).',
    usage: '@user [optional_item_to_slap_with]',
    category: 'fun_games',
    async execute(client, message, args) {
        let mentionedUsers = message.mentionedIds;
        let slappedUserText = "";
        let item = "a large trout 🐟"; // Default item

        if (mentionedUsers.length === 0) {
            // If no one is mentioned, slap the sender? Or ask to mention someone.
            // For now, let's make it require a mention.
            return message.reply(`Who do you want to slap? Mention them! Usage: \`${config.prefix}slap @user\``);
        }

        const userNames = [];
        for (const userId of mentionedUsers) {
            const contact = await client.getContactById(userId);
            userNames.push(contact.pushname || contact.name || `@${userId.split('@')[0]}`);
        }

        slappedUserText = userNames.join(' and ');

        // Check if there are args after mentions for the item
        let potentialItemArgs = [];
        if (args.length > mentionedUsers.length) {
            // This logic assumes mentions are typically at the start.
            // A more robust way is to filter out @-prefixed args if they are actual mentions.
            // For simplicity now:
             let firstNonMentionArgIndex = 0;
             for(let i=0; i<args.length; i++){
                 if(!args[i].startsWith('@') || !mentionedUsers.some(m => args[i].includes(m.split('@')[0]))){
                     firstNonMentionArgIndex = i;
                     break;
                 }
                 if (i === args.length -1 && args[i].startsWith('@')) firstNonMentionArgIndex = args.length; // all args were mentions
             }
            potentialItemArgs = args.slice(firstNonMentionArgIndex);
        }


        if (potentialItemArgs.length > 0) {
            item = potentialItemArgs.join(' ');
        }

        const senderContact = await message.getContact();
        const senderName = senderContact.pushname || senderContact.name || "Someone";

        const slapMessage = `💥 *${senderName}* slaps *${slappedUserText}* around a bit with *${item}*! Ouch!`;

        // To actually mention users in the reply:
        let mentions = [];
        for (const userId of mentionedUsers) {
            const contact = await client.getContactById(userId);
            mentions.push(contact);
        }
        // Also mention sender if not already part of the slapped users
        if (!mentionedUsers.includes(senderContact.id._serialized)) {
             // mentions.push(senderContact); // Or not, depends on desired output
        }


        await client.sendMessage(message.from, slapMessage, { mentions });
    },
};
