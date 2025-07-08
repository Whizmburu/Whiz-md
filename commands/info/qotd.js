const axios = require('axios');

async function handleQotdCommand(msg, args, client, theme, botPrefix) {
    const chat = await msg.getChat();
    await chat.sendStateTyping();

    try {
        await msg.reply(theme.messages.qotdCmd.loading);

        // API: https://zenquotes.io/api/today (returns an array with one quote object)
        // Response format: [{ q: "quote text", a: "author", h: "html formatted quote" }]
        const response = await axios.get('https://zenquotes.io/api/today', { timeout: 7000 });

        if (response.data && response.data.length > 0 && response.data[0].q && response.data[0].a) {
            const quoteData = response.data[0];
            const quoteText = quoteData.q;
            const authorText = quoteData.a;

            const qotdMessage = theme.messages.qotdCmd.quoteFormat
                .replace('{quote}', quoteText)
                .replace('{author}', authorText);

            await msg.reply(qotdMessage);
        } else {
            await msg.reply(theme.messages.qotdCmd.apiError + " (Invalid API response structure)");
        }
        await chat.clearState();
    } catch (error) {
        console.error("Error fetching Quote of the Day:", error.message);
        if (error.code === 'ECONNABORTED') {
            await msg.reply(theme.messages.qotdCmd.apiError + " (API request timed out)");
        } else {
            await msg.reply(theme.messages.qotdCmd.apiError);
        }
        await chat.clearState();
    }
}

module.exports = {
    handleQotdCommand
};
