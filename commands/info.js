// Info Command for WHIZ-MD Bot
const config = require('../config');

module.exports = {
    name: 'info',
    description: 'Displays information about the bot.',
    aliases: ['botinfo', 'about'],
    execute(client, message, args) {
        const infoMessage = `*WHIZ-MD Bot Information* 🌟

*Version:* 1.0.0 (Alpha)
*Creator:* ${config.ownerName} (GitHub: whizmburu)
*Repository:* github.com/whizmburu/WHIZ-MD
*Library:* whatsapp-web.js
*Description:* WHIZ-MD is an advanced WhatsApp bot with 119+ planned commands, designed for creativity and automation.

*Key Features (Planned/In Development):*
- Media downloading & searching
- AI text and image generation
- Group management tools
- Status saving and auto-interaction
- Fun games and utilities

Type \`${config.prefix}menu\` to see all available commands.
Type \`${config.prefix}status\` for current operational status.

Thanks for using WHIZ-MD! 💮`;
        message.reply(infoMessage);
    },
};
