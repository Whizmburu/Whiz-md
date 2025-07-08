// Placeholder for .comic text to image command
const config = require('../../config');

module.exports = {
    name: 'comic',
    description: 'Generates an image with your text in a comic book style. (Not Implemented)',
    usage: '<text>',
    category: 'textmaker',
    execute(client, message, args) {
        if (args.length === 0) {
            return message.reply(`Please provide text for the comic book effect. Usage: ${config.prefix}comic <your text>`);
        }
        const text = args.join(' ');
        message.reply(`Comic book text effect for "${text}" is not yet implemented. 💥🗯️`);
    },
};
