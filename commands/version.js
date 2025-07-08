// Version Command for WHIZ-MD Bot
const pjson = require('../package.json'); // Read version from package.json

module.exports = {
    name: 'version',
    description: 'Displays the bot\'s current version.',
    aliases: ['ver'],
    execute(client, message, args) {
        // Assuming your main bot version is tracked in package.json or a config file
        // For now, let's use a hardcoded version and then improve to read from package.json
        const botVersion = pjson.version || "1.0.0"; // Fallback if not in package.json
        const libraryVersion = pjson.dependencies['whatsapp-web.js'] ? pjson.dependencies['whatsapp-web.js'].replace('^', '') : 'N/A';


        message.reply(`🤖 WHIZ-MD Version: ${botVersion}\n📚 whatsapp-web.js Library: ${libraryVersion}`);
    },
};
