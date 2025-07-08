// Placeholder for .steel text to image command
const config = require('../../config');

module.exports = {
    name: 'steel',
    description: 'Generates an image with your text in a steel style. (Not Implemented)',
    usage: '<text>',
    category: 'textmaker', // Optional: for organizing help menu
    execute(client, message, args) {
        if (args.length === 0) {
            return message.reply(`Please provide text for the steel effect. Usage: ${config.prefix}steel <your text>`);
        }
        const text = args.join(' ');
        message.reply(`Steel text effect for "${text}" is not yet implemented. 쇠`);
    },
};
