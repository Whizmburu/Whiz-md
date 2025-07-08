// Placeholder for .connect4 command
const config = require('../../config');

module.exports = {
    name: 'connect4',
    description: 'Starts a game of Connect 4. (Placeholder - Full game is complex)',
    usage: '@opponent OR <difficulty (vs AI - not implemented)>',
    category: 'interactive_games',
    aliases: ['c4'],
    execute(client, message, args) {
        let opponentText = "";
        if (message.mentionedIds.length > 0) {
            opponentText = `with @${message.mentionedIds[0].split('@')[0]}`;
        } else if (args.length > 0) {
            opponentText = `(vs AI level: ${args[0]}) - AI not yet implemented.`;
        }

        message.reply(`Connect 4 game ${opponentText} would start here! 🔴🟡\n\nThis game is not yet fully implemented. Imagine a grid!\nUse \`${config.prefix}drop <column_number>\` (not implemented).`);
    },
};
