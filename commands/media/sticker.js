// Sticker command
const { MessageMedia } = require('whatsapp-web.js');
const config = require('../../config');

module.exports = {
    name: 'sticker',
    description: 'Creates a sticker from an image or GIF. Reply to an image/GIF or send it with the command.',
    aliases: ['s', 'makesticker'],
    usage: '[packname] [authorname] (replying to image/gif or send with caption)',
    async execute(client, message, args) {
        let media;

        if (message.hasQuotedMsg) {
            const quotedMsg = await message.getQuotedMessage();
            if (quotedMsg.hasMedia && (quotedMsg.type === 'image' || quotedMsg.type === 'video' || quotedMsg.type === 'gif')) {
                try {
                    media = await quotedMsg.downloadMedia();
                } catch (e) {
                    return message.reply("Failed to download media from quoted message.");
                }
            } else {
                return message.reply('Quoted message does not contain an image or GIF.');
            }
        } else if (message.hasMedia && (message.type === 'image' || message.type === 'video' || message.type === 'gif')) {
             try {
                media = await message.downloadMedia();
            } catch (e) {
                return message.reply("Failed to download media from your message.");
            }
        } else {
            return message.reply(`Please reply to an image/GIF or send one with the command \`${config.prefix}sticker\`.`);
        }

        if (!media) {
            return message.reply('Could not find media to process.');
        }

        // Sticker metadata (optional)
        // Args can be used for packname and authorname
        let stickerName = config.botName + " Stickers";
        let stickerAuthor = config.ownerName || "WHIZ-MD";
        let stickerCategories = ['🎉']; // Emoji categories for the sticker

        if (args.length > 0) {
            stickerName = args.join(' '); // Use all args for pack name if only one set
            if (args.length > 1 && args.includes('|')) { // crude split for pack|author
                const parts = args.join(' ').split('|');
                stickerName = parts[0].trim();
                stickerAuthor = parts[1].trim();
            }
        }

        try {
            // Sending sticker
            await message.reply(media, message.from, { // message.from might not be needed if replying to original message's chat
                sendMediaAsSticker: true,
                stickerName: stickerName,
                stickerAuthor: stickerAuthor,
                stickerCategories: stickerCategories
            });
            // No explicit success message needed as the sticker itself is the confirmation.
        } catch (error) {
            console.error('Error creating sticker:', error);
            message.reply(`Failed to create sticker. Error: ${error.message}\nMake sure the media is a valid image or short GIF/video.`);
        }
    },
};
