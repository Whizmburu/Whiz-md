// .tiktok command
const { MessageMedia } = require('whatsapp-web.js');
const config = require('../../config');
const { tiktokdl } = require('ruhend-scraper'); // Using ruhend-scraper
const fs = require('fs');
const path = require('path');

// Ensure media/temp directory exists for temporary storage
const tempDir = path.join(__dirname, '../../media/temp');
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
}

module.exports = {
    name: 'tiktok',
    description: 'Downloads a TikTok video.',
    usage: '<TikTok URL>',
    aliases: ['tt', 'tkdl'],
    category: 'media',
    async execute(client, message, args) {
        if (args.length === 0) {
            return message.reply(`Please provide a TikTok URL. Usage: \`${config.prefix}tiktok <URL>\``);
        }

        const videoUrl = args[0];

        // Basic URL validation for TikTok
        if (!videoUrl.includes('tiktok.com/')) {
            return message.reply('Please provide a valid TikTok video URL.');
        }

        message.reply('📥 Downloading TikTok video... This might take a moment, please be patient. 🕺💃');

        try {
            const result = await tiktokdl(videoUrl);

            if (!result || !result.video || !result.video[0]) {
                // ruhend-scraper might return different structures based on version or content type
                // Check for alternative structures if the primary one fails
                if (result && result.media && result.media.length > 0 && result.media[0].url) {
                     // Assuming result.media[0].url is the video if result.video[0] is not present.
                } else {
                    console.debug("TikTokDL Result Structure:", JSON.stringify(result, null, 2));
                    return message.reply("Could not retrieve video download link from the TikTok URL. The video might be private, removed, or the API structure might have changed.");
                }
            }

            // Determine the download URL - check various possible result structures from scrapers
            let downloadUrl;
            let videoTitle = result.title || result.description || 'TikTok_Video';

            if (result.video && result.video[0]) { // Common structure for video URL
                downloadUrl = result.video[0];
            } else if (result.media && result.media.length > 0 && result.media[0].url && result.media[0].type === 'video') { // Another possible structure
                downloadUrl = result.media[0].url;
                videoTitle = result.media[0].title || videoTitle;
            } else if (result.url_server1) { // Some scrapers offer multiple servers
                 downloadUrl = result.url_server1;
            } else if (result.nowm) { // No watermark version
                downloadUrl = result.nowm;
            } else if (result.url) { // Generic url field
                downloadUrl = result.url;
            }
            // Add more checks if other scrapers have different output formats

            if (!downloadUrl) {
                console.debug("TikTokDL Result (no clear URL):", JSON.stringify(result, null, 2));
                return message.reply("Could not find a direct download link in the API response. The video might be unavailable or the API structure has changed.");
            }

            // Sanitize title for filename
            const safeTitle = videoTitle.replace(/[<>:"\/\\|?*]+/g, '').substring(0, 50);
            const tempFilePath = path.join(tempDir, `${safeTitle}_tiktok.mp4`);

            // Download the video using MessageMedia.fromUrl or a manual download if headers are needed.
            // MessageMedia.fromUrl is simpler if it works directly.
            message.reply(`Downloading "${videoTitle}"...`);

            const media = await MessageMedia.fromUrl(downloadUrl, { unsafeMime: true, filename: `${safeTitle}.mp4` });

            if(!media){
                return message.reply("Failed to download the video from the extracted URL. The link might have expired or is protected.");
            }

            await client.sendMessage(message.from, media, { caption: `🎬 TikTok: ${videoTitle}` });

            // No local temp file to clean up if MessageMedia.fromUrl streams directly or handles temp internally.
            // If manual download to tempFilePath was used:
            // fs.unlink(tempFilePath, (err) => {
            //     if (err) console.error(`Error deleting temporary TikTok file ${tempFilePath}:`, err);
            // });

        } catch (error) {
            console.error("Error downloading TikTok video:", error);
            let errorMsg = "Sorry, an error occurred while downloading the TikTok video.";
            if (error.message && error.message.toLowerCase().includes('not found')) {
                errorMsg = "Could not find the TikTok video. It might be private, deleted, or the URL is incorrect.";
            } else if (error.message && error.message.toLowerCase().includes('failed to fetch')) {
                errorMsg = "Failed to fetch the video data. The download link might be invalid or expired.";
            }
             else if (error.message) {
                errorMsg += ` Details: ${error.message.substring(0,100)}`; // Include part of the error
            }
            message.reply(errorMsg);
        }
    },
};
