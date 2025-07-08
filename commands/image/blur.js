// blur command
const { MessageMedia } = require('whatsapp-web.js');
const config = require('../../config');
const sharp = require('sharp');

module.exports = {
    name: 'blur',
    description: 'Blurs an image. Optionally specify blur intensity (1-100).',
    usage: '[intensity (1-100)] (reply to image or send with command)',
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
            return message.reply(`Please reply to an image or send one with the command \`${config.prefix}blur [intensity]\`.`);
        }

        if (!media || !media.data) {
            return message.reply('Could not find media to process.');
        }

        let blurIntensity = 10; // Default blur intensity
        if (args.length > 0) {
            const intensityArg = parseInt(args[0]);
            if (!isNaN(intensityArg) && intensityArg >= 0.3 && intensityArg <= 1000) { // Sharp blur sigma range
                blurIntensity = intensityArg;
            } else {
                return message.reply('Invalid blur intensity. Please provide a number between 1 and 100 (approx mapping to sigma). Default is 10.');
            }
        }
         // Sharp's blur takes a sigma value. A sigma of 0.3 is barely perceptible, >10 is very blurry.
         // Let's map user input 1-100 to a sigma range, e.g. 0.3 to 50.
         // sigma = 0.3 + (userInput / 100) * 49.7
        const sigma = 0.3 + (Math.min(100, Math.max(1, blurIntensity)) / 100) * 49.7;


        message.reply('Applying blur... 🌫️');

        try {
            const imageBuffer = Buffer.from(media.data, 'base64');
            const blurredBuffer = await sharp(imageBuffer)
                .blur(sigma) // Apply gaussian blur with the specified sigma
                .toBuffer();

            const processedMedia = new MessageMedia(media.mimetype, blurredBuffer.toString('base64'), `blurred-${media.filename || 'image.jpg'}`);
            await client.sendMessage(message.from, processedMedia, { caption: `Image blurred (intensity ~${blurIntensity}).` });

        } catch (error) {
            console.error('Error blurring image:', error);
            message.reply(`Failed to blur image. Error: ${error.message}`);
        }
    },
};
