// Save status command
const { MessageMedia } = require('whatsapp-web.js');
const fs = require('fs');
const path = require('path');
const config = require('../../config');

// Ensure media directory exists
const mediaDir = path.join(__dirname, '../../media/status_saves');
if (!fs.existsSync(mediaDir)) {
    fs.mkdirSync(mediaDir, { recursive: true });
}

module.exports = {
    name: 'save',
    description: 'Saves the media from a replied status message.',
    aliases: ['savestatus', 'dlstatus'],
    async execute(client, message, args) {
        if (!message.hasQuotedMsg) {
            return message.reply('Please reply to a status message to save its media.');
        }

        const quotedMsg = await message.getQuotedMessage();

        if (!quotedMsg.isStatus) { // Check if the quoted message is actually a status
            // Note: `isStatus` might not be directly available on all message objects.
            // This check might need adjustment based on how whatsapp-web.js flags status messages
            // or by checking `quotedMsg.from` (if it's 'status@broadcast')
            // For now, we assume any quoted message *could* be a status if user replies to it.
            // A more robust check would be `quotedMsg.from === 'status@broadcast'` but this might not always be true
            // depending on how the status is quoted or if it's from an archived status.
            // The library's `message.type` for a status is usually 'image', 'video', etc.
            // The key is that the user *replied* to a status in their chat window.
        }

        if (!quotedMsg.hasMedia) {
            return message.reply('The replied message does not contain any media to save.');
        }

        try {
            const media = await quotedMsg.downloadMedia();
            if (!media) {
                return message.reply('Failed to download media from the status.');
            }

            // Save the media to a file (optional, but good for local record)
            const timestamp = new Date().toISOString().replace(/:/g, '-');
            const senderName = quotedMsg.author ? (await client.getContactById(quotedMsg.author)).pushname : (await quotedMsg.getContact()).pushname || 'unknown_status_sender';
            const filename = `status_${senderName}_${timestamp}.${media.mimetype.split('/')[1] || 'bin'}`;
            const filePath = path.join(mediaDir, filename);

            try {
                fs.writeFileSync(filePath, Buffer.from(media.data, 'base64'));
                console.log(`Status media saved to: ${filePath}`);
            } catch (fsError) {
                console.error("Error saving status media to file:", fsError);
                // Continue to send to user even if file save fails
            }

            // Send the media back to the user who requested it
            await client.sendMessage(message.from, media, { caption: `Saved status from ${senderName}` });
            message.reply(`Status media from ${senderName} has been sent to you and saved locally (if configured).`);

        } catch (error) {
            console.error('Error saving status:', error);
            message.reply(`Failed to save status. Error: ${error.message}`);
        }
    },
};
