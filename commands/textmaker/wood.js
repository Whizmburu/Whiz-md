// Placeholder for .wood text to image command
const config = require('../../config');

module.exports = {
    name: 'wood',
    description: 'Generates an image with your text in a wood style. (Not Implemented)',
    usage: '<text>',
    category: 'textmaker',
    execute(client, message, args) {
        if (args.length === 0) {
            return message.reply(`Please provide text for the wood effect. Usage: ${config.prefix}wood <your text>`);
        }
        const text = args.join(' ');
        message.reply(`Wood text effect for "${text}" is not yet implemented. 🪵`);
    },
};
