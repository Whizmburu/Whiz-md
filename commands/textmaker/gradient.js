// Placeholder for .gradient text to image command
const config = require('../../config');

module.exports = {
    name: 'gradient',
    description: 'Generates an image with your text in a gradient style. (Not Implemented)',
    usage: '<color1> <color2> <text> OR <text> (uses default gradient)',
    category: 'textmaker',
    execute(client, message, args) {
        if (args.length === 0) {
            return message.reply(`Please provide text for the gradient effect. Usage: ${config.prefix}gradient <text> or ${config.prefix}gradient <color1> <color2> <text>`);
        }
        const text = args.join(' ');
        message.reply(`Gradient text effect for "${text}" is not yet implemented. 🌈`);
    },
};
