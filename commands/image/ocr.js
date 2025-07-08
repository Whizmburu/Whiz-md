// ocr command (Optical Character Recognition)
const { MessageMedia } = require('whatsapp-web.js');
const config = require('../../config');
const Tesseract = require('tesseract.js');

module.exports = {
    name: 'ocr',
    description: 'Extracts text from an image.',
    aliases: ['readtext', 'extracttext'],
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
            return message.reply(`Please reply to an image or send one with the command \`${config.prefix}ocr\`.`);
        }

        if (!media || !media.data) {
            return message.reply('Could not find media to process.');
        }

        message.reply('Reading text from image... 🧐 This might take a moment.');

        try {
            const imageBuffer = Buffer.from(media.data, 'base64');

            // Tesseract.js works with image paths, URLs, or Buffers.
            // It will download language data on first use for a language.
            // Default is English ('eng'). More languages can be specified.
            const { data: { text } } = await Tesseract.recognize(
                imageBuffer,
                'eng', // Language code(s), e.g., 'eng+ara' for English and Arabic
                {
                    logger: m => { // Optional logger
                        if (m.status === 'recognizing text') {
                            // console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
                            // Avoid spamming user with progress, but good for console
                        }
                    }
                }
            );

            if (text && text.trim().length > 0) {
                message.reply(`*Extracted Text:*\n\n${text}`);
            } else {
                message.reply('Could not extract any text from the image, or the image contains no discernible text.');
            }

        } catch (error) {
            console.error('Error during OCR process:', error);
            let errorMsg = `Failed to extract text from image. Error: ${error.message || 'Unknown Tesseract error'}`;
            if (error.message && error.message.toLowerCase().includes("langdata")) {
                errorMsg += "\n(It might be downloading language data for the first time. Please try again in a moment.)";
            }
            message.reply(errorMsg);
        }
    },
};
