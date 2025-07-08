// .qr command (Generate QR Code)
const { MessageMedia } = require('whatsapp-web.js');
const config = require('../../config');
const QRCode = require('qrcode'); // For generating QR code image data

module.exports = {
    name: 'qr',
    description: 'Generates a QR code from the given text.',
    usage: '<text_to_encode>',
    category: 'utilities_lookup',
    aliases: ['qrcode', 'makeqr'],
    async execute(client, message, args) {
        if (args.length === 0) {
            return message.reply(`Please provide text to encode into a QR code. Usage: \`${config.prefix}qr <your text or URL>\``);
        }
        const textToEncode = args.join(' ');

        if (textToEncode.length > 1024) { // QR codes have limits, especially for display/scanning ease
            return message.reply("The text is too long to reliably encode in a QR code. Please keep it under 1024 characters.");
        }

        message.reply('Generating QR code... 📲');

        try {
            // Generate QR code as a data URL (base64 encoded PNG)
            const qrDataURL = await QRCode.toDataURL(textToEncode, {
                errorCorrectionLevel: 'H', // High error correction
                type: 'image/png',
                margin: 2, // Margin around QR code
                scale: 8,  // Scale factor for size (pixels per module)
            });

            // Extract base64 data from the data URL
            const base64Data = qrDataURL.split(',')[1];
            if (!base64Data) {
                throw new Error("Failed to extract base64 data from QR code URL.");
            }

            const qrMedia = new MessageMedia('image/png', base64Data, 'qrcode.png');
            await client.sendMessage(message.from, qrMedia, { caption: `QR Code for:\n"${textToEncode.substring(0,100)}${textToEncode.length > 100 ? '...' : ''}"` });

        } catch (error) {
            console.error("Error generating QR code:", error);
            message.reply(`Sorry, I couldn't generate the QR code. Error: ${error.message}`);
        }
    },
};
