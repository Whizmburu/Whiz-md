// toimg command (sticker to image)
const { MessageMedia } = require('whatsapp-web.js');
const config = require('../../config');
const sharp = require('sharp'); // Using sharp, though for webp to png/jpg it might be direct

module.exports = {
    name: 'toimg',
    description: 'Converts a sticker to an image.',
    aliases: ['stickertoimage', 'img'],
    async execute(client, message, args) {
        if (!message.hasQuotedMsg) {
            return message.reply('Please reply to a sticker to convert it to an image.');
        }

        const quotedMsg = await message.getQuotedMessage();

        if (quotedMsg.type !== 'sticker') {
            return message.reply('The replied message is not a sticker.');
        }

        try {
            const media = await quotedMsg.downloadMedia();
            if (!media || !media.data) {
                return message.reply('Failed to download sticker media.');
            }

            // Stickers are often in webp format. We want to send as png or jpeg.
            // whatsapp-web.js might handle this conversion automatically when sending MessageMedia
            // if the mimetype is set correctly. Sharp can also be used for explicit conversion.

            const imageBuffer = Buffer.from(media.data, 'base64');

            // Let's try to convert to PNG using sharp for consistency and control
            const pngBuffer = await sharp(imageBuffer).png().toBuffer();

            const imageMedia = new MessageMedia('image/png', pngBuffer.toString('base64'), 'sticker.png');

            await client.sendMessage(message.from, imageMedia, { caption: 'Here is your image from the sticker!' });

        } catch (error) {
            console.error('Error converting sticker to image:', error);
            message.reply(`Failed to convert sticker to image. Error: ${error.message}`);
        }
    },
};
