// .ytmp3 command
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
    name: 'ytmp3',
    description: 'Downloads audio from a YouTube video.',
    usage: '<YouTube URL or search query>',
    aliases: ['yta', 'ytaudio'],
    category: 'media',
    async execute(client, message, args) {
        if (args.length === 0) {
            return message.reply(`Please provide a YouTube URL or search query. Usage: \`${config.prefix}ytmp3 <URL or query>\``);
        }
        const query = args.join(' ');

        // Basic URL validation
        let videoUrl = query;
        if (!ytdl.validateURL(query) && !ytdl.validateID(query)) {
            // If not a valid URL or ID, treat as search query (not implemented here, ytdl-core doesn't search)
            // For search, you'd use a library like 'youtube-sr' or the YouTube API
            // For now, we'll just inform the user if it's not a direct URL/ID.
            // A more robust solution would integrate search.
            // This is a simplified version focusing on direct URL downloads.
             // Let's try to assume it might be a search query and use a placeholder for search functionality.
            // For a real search:
            // const ytsr = require('youtube-sr').default;
            // const searchResults = await ytsr.search(query, { limit: 1 });
            // if (!searchResults || searchResults.length === 0) {
            //     return message.reply(`Could not find any YouTube video for "${query}".`);
            // }
            // videoUrl = searchResults[0].url;
            // message.reply(`Searching for "${query}"... Found: ${searchResults[0].title}. Starting download.`);
            return message.reply("Direct YouTube search not implemented yet. Please provide a valid YouTube video URL or Video ID for now.");
        }

        message.reply('📥 Downloading audio... This might take a few moments, please be patient. 🎶');

        try {
            const info = await ytdl.getInfo(videoUrl);
            const title = info.videoDetails.title.replace(/[<>:"\/\\|?*]+/g, ''); // Sanitize title for filename
            const videoLengthSeconds = parseInt(info.videoDetails.lengthSeconds);

            // Optional: Add a length check (e.g., max 10 minutes = 600 seconds)
            if (videoLengthSeconds > 600) { // 10 minutes limit
                return message.reply(`Video is too long (${Math.floor(videoLengthSeconds / 60)} minutes). Please choose a video shorter than 10 minutes.`);
            }

            const audioFormat = ytdl.chooseFormat(info.formats, { quality: 'highestaudio', filter: 'audioonly' });
            if (!audioFormat) {
                return message.reply("Could not find a suitable audio format for this video.");
            }

            const filePath = path.join(tempDir, `${title}.mp3`);
            const videoStream = ytdl(videoUrl, { format: audioFormat });

            const fileWriteStream = fs.createWriteStream(filePath);

            await new Promise((resolve, reject) => {
                videoStream.pipe(fileWriteStream);
                fileWriteStream.on('finish', resolve);
                fileWriteStream.on('error', (err) => {
                    console.error("Error writing audio file:", err);
                    reject(new Error("Failed to save audio file locally."));
                });
                videoStream.on('error', (err) => { // Catch errors on the read stream too
                    console.error("Error in ytdl stream:", err);
                    // Clean up partial file if write stream was opened
                    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
                    reject(new Error("Failed to download audio stream from YouTube."));
                });
            });

            const media = MessageMedia.fromFilePath(filePath);
            await client.sendMessage(message.from, media, { caption: `🎧 Audio: ${title}`, sendAudioAsVoice: false }); // sendAudioAsVoice: false to send as audio file

            // Clean up the temporary file
            fs.unlink(filePath, (err) => {
                if (err) console.error(`Error deleting temporary audio file ${filePath}:`, err);
            });

        } catch (error) {
            console.error("Error downloading YouTube audio:", error);
            let replyMsg = "Sorry, an error occurred while downloading the YouTube audio.";
            if (error.message.includes("Status code: 410")) { // Common error for unavailable videos
                replyMsg = "This video is unavailable or restricted, I can't download it. (Error 410)";
            } else if (error.message.includes("No suitable format found")) {
                 replyMsg = "Could not find a suitable audio format for this video.";
            } else if (error.message.toLowerCase().includes("private video") || error.message.toLowerCase().includes("members-only")) {
                replyMsg = "This video is private or members-only, I can't access it.";
            }
            message.reply(replyMsg);
        }
    },
};
