// Placeholder for .glitch (text style) text to image command
// Named glitchtext.js to differentiate from image glitch effect.
const config = require('../../config');

module.exports = {
    name: 'glitchtext',
    description: 'Generates an image with your text in a glitch style. (Not Implemented)',
    usage: '<text>',
    category: 'textmaker',
    aliases: ['glitchtxt', 'textglitch'], // Renamed alias to avoid clash
    execute(client, message, args) {
        if (args.length === 0) {
            return message.reply(`Please provide text for the glitch text effect. Usage: ${config.prefix}glitchtxt <your text>`);
        }
        const text = args.join(' ');
        message.reply(`Glitch text style effect for "${text}" is not yet implemented. 👾`);
    },
};
