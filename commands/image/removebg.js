// removebg command
const { MessageMedia } = require('whatsapp-web.js');
const config = require('../../config');
const { RemoveBgResult, RemoveBgError, removeBackgroundFromImageBase64 } = require('remove.bg'); // Using remove.bg library
const fs = require('fs');
const path = require('path');

// Ensure media directory exists for temporary storage if needed by API
const tempMediaDir = path.join(__dirname, '../../media/temp');
if (!fs.existsSync(tempMediaDir)) {
    fs.mkdirSync(tempMediaDir, { recursive: true });
}

module.exports = {
    name: 'removebg',
    description: 'Removes the background from an image. (Requires REMOVE_BG_API_KEY in .env or config)',
    aliases: ['nobg', 'transparent'],
    async execute(client, message, args) {
        const apiKey = process.env.REMOVE_BG_API_KEY || config.removeBgApiKey;

        if (!apiKey) {
            return message.reply('The Remove.bg API key is not configured. This command cannot be used. The bot owner needs to set `REMOVE_BG_API_KEY` in the environment variables.');
        }

        let media;
        if (message.hasQuotedMsg) {
            const quotedMsg = await message.getQuotedMessage();
            if (quotedMsg.hasMedia && quotedMsg.type === 'image') {
                media = await quotedMsg.downloadMedia();
            } else {
                return message.reply('Quoted message does not contain an image.');
            }
        } else if (message.hasMedia && message.type === 'image') {
            media = await message.downloadMedia();
        } else {
            return message.reply(`Please reply to an image or send one with the command \`${config.prefix}removebg\`.`);
        }

        if (!media || !media.data) {
            return message.reply('Could not find media to process.');
        }

        // The remove.bg library expects a base64 string, filepath, or URL.
        // media.data is already base64.

        message.reply('Removing background... This might take a moment. 🖼️✂️');

        try {
            const result = await removeBackgroundFromImageBase64({
                base64img: media.data,
                apiKey: apiKey,
                size: 'regular', // regular, hd, 4k, auto
                type: 'auto', // person, product, car, animal, auto
                outputFile: undefined // Let's handle buffer directly
            });

            // result.base64img contains the base64 of the image with background removed

            const processedMedia = new MessageMedia('image/png', result.base64img, 'removedbg.png');
            await client.sendMessage(message.from, processedMedia, { caption: 'Background removed! ✨' });

        } catch (error) {
            console.error('Error removing background:', error);
            let errorMessage = 'Failed to remove background.';
            if (Array.isArray(error) && error.length > 0 && error[0].title) { // Error structure from remove.bg library
                errorMessage += ` API Error: ${error[0].title}`;
                 if(error[0].title.toLowerCase().includes("credits")) {
                    errorMessage += " (Possibly out of API credits)";
                }
            } else if (error.message) {
                errorMessage += ` ${error.message}`;
            }
            message.reply(errorMessage);
        }
    },
};
