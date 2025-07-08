// Menu Command for WHIZ-MD Bot
// This command will now use the shared menu text generation function from help.js
const { __getFullMenuText } = require('./help.js'); // Import the function

module.exports = {
    name: 'menu',
    description: 'Displays the full list of bot commands.',
    aliases: ['commands', 'cmdlist'],
    execute(client, message, args) {
        if (!__getFullMenuText) {
            console.error("Error: __getFullMenuText function not found in help.js. Cannot display menu.");
            return message.reply("Sorry, there was an error displaying the menu. Please try `.help`.");
        }
        const menuText = __getFullMenuText();
        message.reply(menuText);
    },
};
