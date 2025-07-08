const axios = require('axios');
const { MessageMedia } = require('whatsapp-web.js');

// Helper to truncate text
function truncateText(text, maxLength) {
    if (!text) return 'N/A';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + "...";
}

// Helper to format date range
function formatDateRange(from, to) {
    let dateRange = "N/A";
    if (from) {
        try {
            dateRange = new Date(from).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
            if (to) {
                dateRange += ` to ${new Date(to).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}`;
            } else {
                dateRange += " to Present";
            }
        } catch (e) { /* use default N/A */ }
    }
    return dateRange;
}


async function handleAnimeCommand(msg, args, client, theme, botPrefix) {
    const query = args.join(' ');
    if (!query) {
        await msg.reply(theme.messages.animeCmd.noQuery.replace('{prefix}', botPrefix));
        return;
    }

    const chat = await msg.getChat();
    await chat.sendStateTyping();

    try {
        await msg.reply(theme.messages.animeCmd.searching.replace('{query}', query));

        const apiUrl = `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&limit=1&sfw=true`; // sfw=true for safe for work results
        const response = await axios.get(apiUrl, { timeout: 10000 }); // 10s timeout

        if (response.data && response.data.data && response.data.data.length > 0) {
            const anime = response.data.data[0];

            const title_english = anime.title_english || anime.title || 'N/A';
            const title_japanese = anime.title_japanese || 'N/A';
            const type = anime.type || 'N/A';
            const episodes = anime.episodes || 'N/A';
            const status = anime.status || 'N/A';
            const score = anime.score || 'N/A';
            const aired_from = anime.aired ? anime.aired.from : null;
            const aired_to = anime.aired ? anime.aired.to : null;
            const synopsis = truncateText(anime.synopsis, 300) || 'No synopsis available.'; // Truncate synopsis
            const url = anime.url || 'N/A';
            const imageUrl = anime.images && anime.images.jpg ? anime.images.jpg.large_image_url || anime.images.jpg.image_url : null;

            const airedDateRange = formatDateRange(aired_from, aired_to);

            let animeInfoMsg = theme.messages.animeCmd.result
                .replace('{title_english}', title_english)
                .replace('{title_japanese}', title_japanese)
                .replace('{type}', type)
                .replace('{episodes}', episodes)
                .replace('{status}', status)
                .replace('{score}', score)
                .replace('{aired_from_to}', airedDateRange) // Combined for simplicity in theme
                .replace('{synopsis}', synopsis)
                .replace('{url}', url);

            // Jikan API sometimes returns aired_from and aired_to inside anime.aired.prop.from.day/month/year
            // The above simplified aired_from, aired_to might need adjustment based on exact Jikan response structure if `anime.aired.from` is not a direct date string.
            // For now, assuming `anime.aired.from` and `anime.aired.to` are parsable date strings or null.


            if (imageUrl) {
                try {
                    const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
                    const imageBuffer = Buffer.from(imageResponse.data, 'binary');
                    const mimeType = imageResponse.headers['content-type'] || 'image/jpeg';
                    const animePosterMedia = new MessageMedia(mimeType, imageBuffer.toString('base64'), 'anime_poster.jpg');
                    await client.sendMessage(msg.from, animePosterMedia, { caption: animeInfoMsg });
                } catch (imgError) {
                    console.warn(`Could not fetch anime poster for ${title_english}: ${imgError.message}`);
                    await msg.reply(animeInfoMsg); // Send text info even if image fails
                }
            } else {
                await msg.reply(animeInfoMsg);
            }

        } else {
            await msg.reply(theme.messages.animeCmd.notFound.replace('{query}', query));
        }
        await chat.clearState();

    } catch (error) {
        console.error(`Error in .anime command for "${query}":`, error.message);
        if (error.response && (error.response.status === 404 || error.response.status === 400)) { // Jikan might use 400 for bad query
            await msg.reply(theme.messages.animeCmd.notFound.replace('{query}', query));
        } else if (error.response && error.response.data && error.response.data.message) {
            await msg.reply(theme.messages.animeCmd.apiError + ` (API: ${error.response.data.message})`);
        } else if (error.code === 'ECONNABORTED') {
            await msg.reply(theme.messages.animeCmd.apiError + " (API request timed out)");
        }
        else {
            await msg.reply(theme.messages.animeCmd.apiError);
        }
        await chat.clearState();
    }
}

module.exports = {
    handleAnimeCommand
};
