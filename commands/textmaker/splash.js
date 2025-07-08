// Placeholder for .splash text to image command
const config = require('../../config');

module.exports = {
    name: 'splash',
    description: 'Generates an image with your text in a splash style. (Not Implemented)',
    usage: '<text>',
    category: 'textmaker',
    execute(client, message, args) {
        if (args.length === 0) {
            return message.reply(`Please provide text for the splash effect. Usage: ${config.prefix}splash <your text>`);
        }
        const text = args.join(' ');
        message.reply(`Splash text effect for "${text}" is not yet implemented. 💦`);
    },
};
