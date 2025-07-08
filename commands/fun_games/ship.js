// .ship command (Love calculator / compatibility)
const config = require('../../config');

module.exports = {
    name: 'ship',
    description: 'Calculates the "shipping" compatibility between two names.',
    usage: '<name1> <name2> OR @user1 @user2 OR @user <text_name>',
    category: 'fun_games',
    aliases: ['lovecalc', 'compatibility'],
    async execute(client, message, args) {
        let name1, name2;
        let mentionedUsers = message.mentionedIds;

        if (mentionedUsers.length >= 2) {
            const contact1 = await client.getContactById(mentionedUsers[0]);
            const contact2 = await client.getContactById(mentionedUsers[1]);
            name1 = contact1.pushname || contact1.name || "Person 1";
            name2 = contact2.pushname || contact2.name || "Person 2";
        } else if (mentionedUsers.length === 1 && args.length > 1) {
            const contact1 = await client.getContactById(mentionedUsers[0]);
            name1 = contact1.pushname || contact1.name || "Person 1";
            // Remove mention from args to get the second name
            const name2Arg = args.filter(arg => !arg.startsWith('@')).join(' ');
            name2 = name2Arg || "Person 2";
        } else if (args.length >= 2) {
            name1 = args[0];
            name2 = args[1];
        } else {
            return message.reply(`Please provide two names or mention two users to ship!\nUsage: \`${config.prefix}ship Name1 Name2\` or \`${config.prefix}ship @user1 @user2\``);
        }

        if (!name1 || !name2) return message.reply("Couldn't determine both names for shipping.");


        // Simple "love calculation" algorithm (for fun, not scientific!)
        const combinedNames = (name1.toLowerCase() + name2.toLowerCase()).replace(/[^a-z]/g, '');
        let sum = 0;
        for (let i = 0; i < combinedNames.length; i++) {
            sum += combinedNames.charCodeAt(i);
        }
        const percentage = (sum % 100) + 1; // Ensure it's between 1 and 100

        let reaction = "❤️";
        let comment = "";

        if (percentage < 20) comment = "Hmm, maybe just friends? 🤔";
        else if (percentage < 40) comment = "There's a slight spark! ✨";
        else if (percentage < 60) comment = "Looking pretty good! 😊";
        else if (percentage < 80) comment = "Wow, strong connection! 🥰";
        else if (percentage < 95) comment = "It's a match made in heaven! 💖";
        else comment = "SOULMATES! 💍💐";

        if (percentage === 69) { // Special case for fun
            reaction = "😏";
            comment = "Nice. ( ͡° ͜ʖ ͡°)"
        }


        const shipMessage = `*Love Compatibility Meter* 💕\n\n${reaction} Shipping *${name1}* and *${name2}* ${reaction}\n\nCompatibility: *${percentage}%*\n\n${comment}`;
        message.reply(shipMessage);
    },
};
