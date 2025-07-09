const OpenAI = require('openai');
const axios = require('axios');
const { MessageMedia } = require('whatsapp-web.js');

let openaiClient;
if (process.env.OPENAI_API_KEY) {
    openaiClient = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
    });
}

async function handleImageCommand(msg, args, client, theme, botPrefix) {
    const prompt = args.join(' ');
    const chat = await msg.getChat();

    if (!process.env.OPENAI_API_KEY || !openaiClient) {
        await msg.reply(theme.messages.aiImageCmd.noApiKey + (theme.signatures.textOnlyAppend || ""));
        return;
    }

    if (!prompt) {
        await msg.reply(theme.messages.aiImageCmd.noPrompt.replace('{prefix}', botPrefix) + (theme.signatures.textOnlyAppend || ""));
        return;
    }

    try {
        await chat.sendStateTyping();
        await msg.reply(theme.messages.aiImageCmd.generating.replace('{prompt}', truncateText(prompt, 50)) + (theme.signatures.textOnlyAppend || ""));

        // Using DALL-E 2 as a common default, DALL-E 3 might be 'dall-e-3'
        // Check OpenAI documentation for the latest model identifiers if issues arise.
        const imageResponse = await openaiClient.images.generate({
            model: "dall-e-2", // Or "dall-e-3" if your key/plan supports it
            prompt: prompt,
            n: 1, // Number of images to generate
            size: "1024x1024", // Common size, others: "256x256", "512x512"
            response_format: "url", // Get a URL for the image
        });

        if (imageResponse.data && imageResponse.data.length > 0 && imageResponse.data[0].url) {
            const imageUrl = imageResponse.data[0].url;

            // Download the image from the URL
            const downloadedImage = await axios.get(imageUrl, { responseType: 'arraybuffer' });
            const imageBuffer = Buffer.from(downloadedImage.data, 'binary');

            // Infer mimetype, default to image/png if not obvious from URL (though OpenAI usually gives good URLs)
            let mimeType = 'image/png';
            if (imageUrl.endsWith('.jpg') || imageUrl.endsWith('.jpeg')) {
                mimeType = 'image/jpeg';
            }

            const media = new MessageMedia(mimeType, imageBuffer.toString('base64'), `dalle_image.${mimeType.split('/')[1]}`);

            // const caption = theme.messages.aiImageCmd.successCaption.replace('{prompt}', truncateText(prompt, 100)); // Old caption
            await client.sendMessage(msg.from, media, { caption: theme.signatures.generatedByBot });

        } else {
            console.warn("OpenAI DALL-E response did not contain expected image data:", imageResponse);
            await msg.reply(theme.messages.aiImageCmd.noResults + (theme.signatures.textOnlyAppend || ""));
        }

        await chat.clearState();

    } catch (error) {
        console.error("Error in .image (DALL-E) command:", error);
        let errorReplyText = "";
        if (error.response && error.response.data && error.response.data.error) {
            const apiError = error.response.data.error;
            if (apiError.code === 'content_policy_violation') {
                errorReplyText = theme.messages.aiImageCmd.contentPolicyViolation;
            } else {
                errorReplyText = theme.messages.aiImageCmd.apiError.replace('{errorDetails}', (apiError.message || 'Unknown API error.').substring(0,150));
            }
        } else if (error.code === 'insufficient_quota') {
            errorReplyText = "❌ API request failed: Insufficient quota. Please check your OpenAI plan and billing details.";
        } else {
            errorReplyText = theme.messages.aiImageCmd.apiError.replace('{errorDetails}', error.message.substring(0,150));
        }

        await msg.reply(errorReplyText + (theme.signatures.textOnlyAppend || ""));
        await chat.clearState();
    }
}

// Helper function (can be moved to a utils file if used elsewhere)
function truncateText(text, maxLength) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + "...";
}


module.exports = {
    handleImageCommand
};
