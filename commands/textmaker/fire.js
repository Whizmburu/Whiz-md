// Placeholder for .fire text to image command
const config = require('../../config');

module.exports = {
    name: 'fire',
    description: 'Generates an image with your text in a fire style. (Not Implemented)',
    usage: '<text>',
    category: 'textmaker',
    execute(client, message, args) {
        if (args.length === 0) {
            return message.reply(`Please provide text for the fire effect. Usage: ${config.prefix}fire <your text>`);
        }
        const text = args.join(' ');
        message.reply(`Fire text effect for "${text}" is not yet implemented. 🔥`);
    },
};
