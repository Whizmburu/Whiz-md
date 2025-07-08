// wanted poster command (placeholder or simple version)
const { MessageMedia } = require('whatsapp-web.js');
const config = require('../../config');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

// Path to a "wanted" poster template image (background with "WANTED" text, space for picture)
// You'll need to create/find this.
const wantedTemplatePath = path.join(__dirname, '../../assets/images/wanted_template.png');
// Ensure assets/images directory exists and you have a wanted_template.png in it.

module.exports = {
    name: 'wanted',
    description: 'Puts an image onto a "WANTED" poster (simple version).',
    async execute(client, message, args) {
        let mediaToOverlay;
        if (message.hasQuotedMsg) {
            const quotedMsg = await message.getQuotedMessage();
            if (quotedMsg.hasMedia && quotedMsg.type === 'image') {
                mediaToOverlay = await quotedMsg.downloadMedia();
            } else if (quotedMsg.author) { // If replying to a text message, try to get author's PFP
                 try {
                    const contact = await client.getContactById(quotedMsg.author);
                    const pfpUrl = await contact.getProfilePicUrl();
                    if (pfpUrl) {
                        // Download PFP - this is tricky, whatsapp-web.js doesn't directly give buffer for PFP
                        // May need an external fetch if MessageMedia.fromUrl doesn't work well for PFPs
                        // For now, this path is less reliable.
                        // mediaToOverlay = await MessageMedia.fromUrl(pfpUrl, { unsafeMime: true });
                         return message.reply("Fetching profile pictures for 'wanted' poster is not fully supported yet. Please reply to an image.");
                    } else {
                         return message.reply('User has no profile picture or it is private.');
                    }
                } catch (e) {
                    return message.reply('Could not fetch profile picture.');
                }

            } else {
                return message.reply('Quoted message does not contain an image.');
            }
        } else if (message.hasMedia && message.type === 'image') {
            mediaToOverlay = await message.downloadMedia();
        } else { // Try to get sender's PFP if no image is provided
            try {
                const contact = await message.getContact();
                const pfpUrl = await contact.getProfilePicUrl();
                 if (pfpUrl) {
                    // mediaToOverlay = await MessageMedia.fromUrl(pfpUrl, { unsafeMime: true });
                     return message.reply("Fetching profile pictures for 'wanted' poster is not fully supported yet. Please send an image directly or reply to one.");
                } else {
                     return message.reply(`You have no profile picture or it's private. Please send an image or reply to one with \`${config.prefix}wanted\`.`);
                }
            } catch (e) {
                 return message.reply(`Please reply to an image, send one with the command \`${config.prefix}wanted\`, or make sure your PFP is public.`);
            }
        }


        if (!mediaToOverlay || !mediaToOverlay.data) {
            return message.reply('Could not find an image to make a wanted poster from.');
        }

        if (!fs.existsSync(wantedTemplatePath)) {
            console.error("Wanted template asset not found at:", wantedTemplatePath);
            return message.reply("Sorry, the 'wanted' poster assets are missing. Please contact the bot owner.");
        }

        message.reply('Creating wanted poster... 📜');

        try {
            const imageToOverlayBuffer = Buffer.from(mediaToOverlay.data, 'base64');

            const templateImage = sharp(wantedTemplatePath);
            const templateMeta = await templateImage.metadata();

            // Define area on template where the user's image should go.
            // These are example coordinates/dimensions and MUST be adjusted for your template.
            const targetWidth = Math.floor(templateMeta.width * 0.6); // e.g., image takes 60% of template width
            const targetHeight = Math.floor(templateMeta.height * 0.5); // e.g., image takes 50% of template height
            const targetX = Math.floor((templateMeta.width - targetWidth) / 2); // Center X
            const targetY = Math.floor(templateMeta.height * 0.20); // e.g., starts 20% from top

            const resizedOverlay = await sharp(imageToOverlayBuffer)
                .resize(targetWidth, targetHeight, { fit: 'cover', position: 'attention' }) // crop to fit
                .sharpen() // A bit of sharpen for the "old photo" look
                .grayscale() // Make it grayscale
                .jpeg()
                .toBuffer();

            const finalImageBuffer = await templateImage
                .composite([{
                    input: resizedOverlay,
                    top: targetY,
                    left: targetX
                }])
                .jpeg()
                .toBuffer();

            const processedMedia = new MessageMedia('image/jpeg', finalImageBuffer.toString('base64'), `wanted-${mediaToOverlay.filename || 'poster.jpg'}`);
            await client.sendMessage(message.from, processedMedia, { caption: 'WANTED! Dead or Alive!' });

        } catch (error) {
            console.error('Error creating wanted poster:', error);
            message.reply(`Failed to create wanted poster. Error: ${error.message}`);
        }
    },
};
