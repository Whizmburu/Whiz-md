// glitchimg command (placeholder or very simple effect)
const { MessageMedia } = require('whatsapp-web.js');
const config = require('../../config');
const sharp = require('sharp');

module.exports = {
    name: 'glitchimg',
    description: 'Applies a glitch effect to an image (simple version).',
    aliases: ['glitcheffect', 'imageglitch'],
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
            return message.reply(`Please reply to an image or send one with the command \`${config.prefix}glitchimg\`.`);
        }

        if (!media || !media.data) {
            return message.reply('Could not find media to process.');
        }

        message.reply('Applying glitch effect... 👾');

        try {
            const imageBuffer = Buffer.from(media.data, 'base64');
            const baseImage = sharp(imageBuffer);
            const metadata = await baseImage.metadata();

            // Simple glitch: Offset RGB channels slightly, add some noise
            // This is a VERY basic representation. Real glitch effects are more complex.
            // For a more convincing static glitch, one might:
            // 1. Create multiple slightly shifted versions of color channels.
            // 2. Randomly slice and displace parts of the image.
            // 3. Add scan lines or noise.

            // Example: shift R channel right, B channel left, add noise
            const channelShifted = await baseImage
                .recomb([ // Matrix for channel shifting (example, might not look great)
                    [1, 0, 0.1],  // R = R + 0.1*B (slight blue into red creating magenta-ish shift)
                    [0.1, 1, 0],  // G = G + 0.1*R
                    [0, 0.1, 1]   // B = B + 0.1*G
                ])
                .jpeg() // or png
                .toBuffer();

            // Add some noise
            const noiseAdded = await sharp(channelShifted)
                .noise(2.5, { type: 'gaussian' }) // Add some gaussian noise, adjust intensity
                .jpeg()
                .toBuffer();

            // Simple displacement: take a band and shift it.
            // This is harder with sharp without slicing and re-compositing.
            // For now, channel shift + noise is a starting point.

            const processedMedia = new MessageMedia(media.mimetype, noiseAdded.toString('base64'), `glitched-${media.filename || 'image.jpg'}`);
            await client.sendMessage(message.from, processedMedia, { caption: 'G̷l̵i̶t̴c̴h̸ ̶E̸f̴f̴e̵c̴t̸ Applied!' });

        } catch (error) {
            console.error('Error creating glitch image:', error);
            message.reply(`Failed to create glitch image. Error: ${error.message}. This is a simplified effect.`);
        }
    },
};
