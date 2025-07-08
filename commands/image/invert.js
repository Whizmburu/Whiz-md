// invert command
const { MessageMedia } = require('whatsapp-web.js');
const config = require('../../config');
const sharp = require('sharp');

module.exports = {
    name: 'invert',
    description: 'Inverts the colors of an image.',
    aliases: ['negative'],
    async execute(client, message, args) {
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
            return message.reply(`Please reply to an image or send one with the command \`${config.prefix}invert\`.`);
        }

        if (!media || !media.data) {
            return message.reply('Could not find media to process.');
        }

        message.reply('Inverting colors... 🎨🔄');

        try {
            const imageBuffer = Buffer.from(media.data, 'base64');
            const invertedBuffer = await sharp(imageBuffer)
                .negate() // Inverts the image colors
                .toBuffer();

            const processedMedia = new MessageMedia(media.mimetype, invertedBuffer.toString('base64'), `inverted-${media.filename || 'image.jpg'}`);
            await client.sendMessage(message.from, processedMedia, { caption: 'Image colors inverted!' });

        } catch (error) {
            console.error('Error inverting image colors:', error);
            message.reply(`Failed to invert image colors. Error: ${error.message}`);
        }
    },
};
