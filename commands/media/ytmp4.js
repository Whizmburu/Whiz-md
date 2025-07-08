// .ytmp4 command
const { MessageMedia } = require('whatsapp-web.js');
const config = require('../../config');
const ytdl = require('ytdl-core');
const fs = require('fs');
const path = require('path');

// Ensure media/temp directory exists for temporary storage
const tempDir = path.join(__dirname, '../../media/temp');
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
}

module.exports = {
    name: 'ytmp4',
    description: 'Downloads a YouTube video.',
    usage: '<YouTube URL or search query>',
    aliases: ['ytv', 'ytvideo'],
    category: 'media',
    async execute(client, message, args) {
        if (args.length === 0) {
            return message.reply(`Please provide a YouTube URL or search query. Usage: \`${config.prefix}ytmp4 <URL or query>\``);
        }
        const query = args.join(' ');

        let videoUrl = query;
        if (!ytdl.validateURL(query) && !ytdl.validateID(query)) {
            // As with ytmp3, search is not implemented here for simplicity.
            // const ytsr = require('youtube-sr').default;
            // const searchResults = await ytsr.search(query, { limit: 1 });
            // if (!searchResults || searchResults.length === 0) {
            //     return message.reply(`Could not find any YouTube video for "${query}".`);
            // }
            // videoUrl = searchResults[0].url;
            // message.reply(`Searching for "${query}"... Found: ${searchResults[0].title}. Starting download.`);
            return message.reply("Direct YouTube search not implemented yet. Please provide a valid YouTube video URL or Video ID for now.");
        }

        message.reply('📥 Downloading video... This can take some time depending on video size and length. Please wait. 🎬');

        try {
            const info = await ytdl.getInfo(videoUrl);
            const title = info.videoDetails.title.replace(/[<>:"\/\\|?*]+/g, ''); // Sanitize title
            const videoLengthSeconds = parseInt(info.videoDetails.lengthSeconds);

            // Optional: Add a length check (e.g., max 5-10 minutes for videos due to WhatsApp limits)
            // WhatsApp Web has a general media limit of 64MB, and for videos, it's often around 16MB for auto-play/sending.
            // Longer/larger videos might fail or not be viewable directly.
            if (videoLengthSeconds > 480) { // 8 minutes limit as an example
                return message.reply(`Video is too long (${Math.floor(videoLengthSeconds / 60)} minutes). Please choose a video shorter than 8 minutes for direct sending.`);
            }

            // Choose a format that's likely to be mp4 and not too large.
            // 'highestvideo' might pick WebM. We prefer mp4 for broader compatibility.
            // Filter for mp4, then choose based on quality.
            const videoFormat = ytdl.chooseFormat(info.formats, {
                quality: 'highestvideo', // Start with highest
                filter: (format) => format.container === 'mp4' && format.hasAudio && format.hasVideo // Ensure it's mp4 with audio
            });

            if (!videoFormat) {
                 // Fallback if no mp4 with audio is found, try any with video (might be webm)
                const fallbackFormat = ytdl.chooseFormat(info.formats, { quality: 'highestvideo', filter: 'videoandaudio' });
                if(!fallbackFormat){
                    return message.reply("Could not find a suitable video format for this video.");
                }
                console.warn("Could not find MP4 with audio, falling back to best video format which might be WebM:", fallbackFormat.container);
                // videoFormat = fallbackFormat; // This line was missing, if we intended to use fallbackFormat
                 return message.reply("Could not find a suitable MP4 video format with audio. Other formats might not send correctly.");

            }

            // Check estimated size if possible (ytdl-core doesn't always provide this easily before download)
            // If format.contentLength is available, use it.
            if (videoFormat.contentLength) {
                const sizeMB = (parseInt(videoFormat.contentLength) / (1024 * 1024)).toFixed(2);
                message.reply(`Video found: ${title}. Estimated size: ${sizeMB} MB. Proceeding with download...`);
                if (parseInt(videoFormat.contentLength) > 60 * 1024 * 1024) { // 60MB limit
                     return message.reply(`Video is too large (${sizeMB} MB). Max allowed size is ~60MB.`);
                }
            }


            const filePath = path.join(tempDir, `${title}.${videoFormat.container || 'mp4'}`);
            const videoStream = ytdl(videoUrl, { format: videoFormat });
            const fileWriteStream = fs.createWriteStream(filePath);

            await new Promise((resolve, reject) => {
                videoStream.pipe(fileWriteStream);
                fileWriteStream.on('finish', resolve);
                fileWriteStream.on('error', (err) => {
                     console.error("Error writing video file:", err);
                     reject(new Error("Failed to save video file locally."));
                });
                 videoStream.on('error', (err) => {
                    console.error("Error in ytdl video stream:", err);
                    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
                    reject(new Error("Failed to download video stream from YouTube."));
                });
            });

            const media = MessageMedia.fromFilePath(filePath);
            await client.sendMessage(message.from, media, { caption: `🎬 Video: ${title}` });

            fs.unlink(filePath, (err) => {
                if (err) console.error(`Error deleting temporary video file ${filePath}:`, err);
            });

        } catch (error) {
            console.error("Error downloading YouTube video:", error);
            let replyMsg = "Sorry, an error occurred while downloading the YouTube video.";
             if (error.message.includes("Status code: 410")) {
                replyMsg = "This video is unavailable or restricted, I can't download it. (Error 410)";
            } else if (error.message.includes("No suitable format found")) {
                 replyMsg = "Could not find a suitable MP4 video format for this video.";
            } else if (error.message.toLowerCase().includes("private video") || error.message.toLowerCase().includes("members-only")) {
                replyMsg = "This video is private or members-only, I can't access it.";
            }
            message.reply(replyMsg);
        }
    },
};
