// circle crop command
const { MessageMedia } = require('whatsapp-web.js');
const config = require('../../config');
const sharp = require('sharp');

module.exports = {
    name: 'circle',
    description: 'Crops an image into a circle.',
    aliases: ['round', 'circularcrop'],
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
            return message.reply(`Please reply to an image or send one with the command \`${config.prefix}circle\`.`);
        }

        if (!media || !media.data) {
            return message.reply('Could not find media to process.');
        }

        message.reply('Cropping to circle... ✂️🟢');

        try {
            const imageBuffer = Buffer.from(media.data, 'base64');
            const image = sharp(imageBuffer);
            const metadata = await image.metadata();

            const diameter = Math.min(metadata.width, metadata.height);
            const radius = diameter / 2;

            // Create a circular mask
            const circleSvg = Buffer.from(
                `<svg><circle cx="${radius}" cy="${radius}" r="${radius}" fill="white"/></svg>`
            );

            // Composite the image with the circle mask
            // Ensure the output is PNG to support transparency
            const circleBuffer = await image
                .resize(diameter, diameter) // Ensure it's a square for a perfect circle from min dimension
                .composite([{
                    input: circleSvg,
                    blend: 'dest-in' // Use dest-in to make transparent where mask is black (or not white)
                }])
                .png() // Output as PNG for transparency
                .toBuffer();

            const processedMedia = new MessageMedia('image/png', circleBuffer.toString('base64'), `circle-${media.filename || 'image.png'}`);
            await client.sendMessage(message.from, processedMedia, { caption: 'Image cropped to a circle!' });

        } catch (error) {
            console.error('Error cropping image to circle:', error);
            message.reply(`Failed to crop image to circle. Error: ${error.message}`);
        }
    },
};
