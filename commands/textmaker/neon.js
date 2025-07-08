// Placeholder for .neon text to image command
const config = require('../../config');

module.exports = {
    name: 'neon',
    description: 'Generates an image with your text in a neon style. (Not Implemented)',
    usage: '<text>',
    category: 'textmaker',
    execute(client, message, args) {
        if (args.length === 0) {
            return message.reply(`Please provide text for the neon effect. Usage: ${config.prefix}neon <your text>`);
        }
        const text = args.join(' ');
        message.reply(`Neon text effect for "${text}" is not yet implemented. 💡`);
    },
};
