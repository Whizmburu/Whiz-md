// Placeholder for .ice text to image command
const config = require('../../config');

module.exports = {
    name: 'ice',
    description: 'Generates an image with your text in an ice style. (Not Implemented)',
    usage: '<text>',
    category: 'textmaker',
    execute(client, message, args) {
        if (args.length === 0) {
            return message.reply(`Please provide text for the ice effect. Usage: ${config.prefix}ice <your text>`);
        }
        const text = args.join(' ');
        message.reply(`Ice text effect for "${text}" is not yet implemented. ❄️`);
    },
};
