// triggered meme command (placeholder or simple version)
const { MessageMedia } = require('whatsapp-web.js');
const config = require('../../config');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

// Path to a "triggered" label image. You'll need to create/find this.
// e.g., a red bar with white "TRIGGERED" text.
const triggeredLabelPath = path.join(__dirname, '../../assets/images/triggered_label.png');
// Ensure assets/images directory exists and you have a triggered_label.png in it.

module.exports = {
    name: 'triggered',
    description: 'Adds a "TRIGGERED" label to an image and applies a red tint/shake effect (simple version).',
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
            return message.reply(`Please reply to an image or send one with the command \`${config.prefix}triggered\`.`);
        }

        if (!media || !media.data) {
            return message.reply('Could not find media to process.');
        }

        if (!fs.existsSync(triggeredLabelPath)) {
            console.error("Triggered label asset not found at:", triggeredLabelPath);
            return message.reply("Sorry, the 'triggered' effect assets are missing. Please contact the bot owner.");
        }

        message.reply('Getting triggered... 💥');

        try {
            const imageBuffer = Buffer.from(media.data, 'base64');
            const baseImage = sharp(imageBuffer);
            const metadata = await baseImage.metadata();

            // 1. Add red tint to the base image
            const redTintedImage = await baseImage
                .tint({ r: 255, g: 0, b: 0, alpha: 0.3 }) // Apply a red tint with some transparency
                .jpeg() // Output as jpeg
                .toBuffer();

            // 2. Simple "shake" effect: create slightly offset composites (very basic)
            // This is a very simplified shake. Real shake is animated (GIF).
            // For a static image, we can make it look a bit chaotic.
            // Let's try a slight horizontal offset and overlay
            const finalImage = await sharp(redTintedImage)
                .composite([
                    { input: triggeredLabelPath, gravity: 'south' }, // Add TRIGGERED label at the bottom
                    // Basic "shake" - overlay slightly offset versions with transparency
                    // This is more of a visual distortion than a shake for a static image.
                    // A true animated GIF shake is much more complex.
                    // For simplicity, we'll focus on the red tint and label for now.
                    // More advanced: create several frames with slight random offsets and compile into a GIF.
                ])
                .sharpen() // A bit of sharpen can make it look more "intense"
                .jpeg()
                .toBuffer();


            const processedMedia = new MessageMedia(media.mimetype, finalImage.toString('base64'), `triggered-${media.filename || 'image.jpg'}`);
            await client.sendMessage(message.from, processedMedia, { caption: 'TRIGGERED!!!' });

        } catch (error) {
            console.error('Error creating triggered image:', error);
            message.reply(`Failed to create triggered image. Error: ${error.message}`);
        }
    },
};
