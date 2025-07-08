// sepia command
const { MessageMedia } = require('whatsapp-web.js');
const config = require('../../config');
const sharp = require('sharp');

module.exports = {
    name: 'sepia',
    description: 'Applies a sepia filter to an image.',
    aliases: ['vintagify'],
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
            return message.reply(`Please reply to an image or send one with the command \`${config.prefix}sepia\`.`);
        }

        if (!media || !media.data) {
            return message.reply('Could not find media to process.');
        }

        message.reply('Applying sepia filter... 🎞️');

        try {
            const imageBuffer = Buffer.from(media.data, 'base64');

            // Sharp doesn't have a direct .sepia() function.
            // Sepia is achieved by first converting to grayscale, then tinting with a brownish color.
            // Example: tint with a sepia-like color #704214 (adjust as needed)
            // Or apply a color matrix if Sharp supports it, or use a more specific sepia algorithm.
            // A common way is grayscale then recombine with specific R,G,B multipliers or add specific values.
            // Sharp's .tint() can be used.
            // Another approach is a specific linear transformation:
            // R' = R*0.393 + G*0.769 + B*0.189
            // G' = R*0.349 + G*0.686 + B*0.168
            // B' = R*0.272 + G*0.534 + B*0.131
            // This is complex with .linear().
            // Simpler: Grayscale then tint.
            const sepiaBuffer = await sharp(imageBuffer)
                .grayscale()
                .tint({ r: 112, g: 66, b: 20 }) // RGB for a sepia tone like #704214
                .toBuffer();

            const processedMedia = new MessageMedia(media.mimetype, sepiaBuffer.toString('base64'), `sepia-${media.filename || 'image.jpg'}`);
            await client.sendMessage(message.from, processedMedia, { caption: 'Sepia filter applied!' });

        } catch (error) {
            console.error('Error applying sepia filter:', error);
            message.reply(`Failed to apply sepia filter. Error: ${error.message}`);
        }
    },
};
