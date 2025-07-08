const axios = require('axios');
const { MessageMedia } = require('whatsapp-web.js');

async function handleMemeCommand(msg, args, client, theme) {
    const chat = await msg.getChat();
    try {
        await chat.sendStateTyping();
        await msg.reply(theme.messages.memeCommand.loading);

        // API: https://meme-api.com/gimme  (returns JSON with url, title, author, etc.)
        // Alternative: https://some-random-api.com/meme (check exact endpoint and response structure)
        const response = await axios.get('https://meme-api.com/gimme', { timeout: 10000 });

        if (response.data && response.data.url && response.data.title) {
            const memeUrl = response.data.url;
            const memeTitle = response.data.title;
            const memeAuthor = response.data.author || "Unknown"; // author might not always be present

            // Download the image
            const imageResponse = await axios.get(memeUrl, { responseType: 'arraybuffer' });
            const imageBuffer = Buffer.from(imageResponse.data, 'binary');
            const mimeType = imageResponse.headers['content-type'] || 'image/jpeg';

            // Determine filename extension
            let extension = 'jpg';
            if (mimeType === 'image/png') extension = 'png';
            else if (mimeType === 'image/gif') extension = 'gif';
            else if (mimeType === 'image/webp') extension = 'webp';


            const media = new MessageMedia(mimeType, imageBuffer.toString('base64'), `meme.${extension}`);
            await client.sendMessage(msg.from, media, { caption: `${memeTitle}\n_Source: r/${response.data.subreddit || 'meme'}_` });

        } else {
            await msg.reply(theme.messages.memeCommand.error + " (Invalid API response structure or no meme URL)");
        }
        await chat.clearState();
    } catch (error) {
        console.error("Error fetching meme:", error.message);
        if (error.code === 'ECONNABORTED') {
             await msg.reply(theme.messages.memeCommand.error + " (API request timed out)");
        } else {
            await msg.reply(theme.messages.memeCommand.error);
        }
        await chat.clearState();
    }
}

module.exports = {
    handleMemeCommand
};
