// Menu Command for WHIZ-MD Bot
const helpModule = require('./help.js'); // Import the help module
const config = require('../config'); // To get bot version

module.exports = {
    name: 'menu',
    description: 'Displays the full list of bot commands.',
    aliases: ['commands', 'cmdlist'],
    execute(client, message, args) {
        if (!helpModule || typeof helpModule.__getFullMenuText !== 'function') {
            console.error("Error: __getFullMenuText function not found in help.js or helpModule not loaded. Cannot display menu.");
            return message.reply("Sorry, there was an error displaying the menu. Please try `.help`.");
        }
        // Get version from config, which should have been set by bot.js
        const botVersion = config.getBotVersion();
        const menuText = helpModule.__getFullMenuText(botVersion); // Pass the version
        message.reply(menuText);
    },
};
