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
            await client.sendMessage(msg.from, media, { caption: theme.signatures.downloadedBy });

        } else {
            const replyText = (theme.messages.memeCommand.error + " (Invalid API response structure or no meme URL)") + (theme.signatures.textOnlyAppend || "");
            await msg.reply(replyText);
        }
        await chat.clearState();
    } catch (error) {
        console.error("Error fetching meme:", error.message);
        let errorReplyText = theme.messages.memeCommand.error;
        if (error.code === 'ECONNABORTED') {
             errorReplyText += " (API request timed out)";
        }
        await msg.reply(errorReplyText + (theme.signatures.textOnlyAppend || ""));
        await chat.clearState();
    }
}

module.exports = {
    handleMemeCommand
};
