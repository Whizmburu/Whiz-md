const axios = require('axios');

async function handleQuoteCommand(msg, args, client, theme) {
    const chat = await msg.getChat();
    try {
        await chat.sendStateTyping();
        await msg.reply(theme.messages.quoteCommand.loading);

        const response = await axios.get('https://api.quotable.io/random', { timeout: 7000 });

        if (response.data && response.data.content && response.data.author) {
            await msg.reply(`"${response.data.content}"\n\n— *${response.data.author}*`);
        } else {
            await msg.reply(theme.messages.quoteCommand.error + " (Invalid API response structure)");
        }
        await chat.clearState();
    } catch (error) {
        console.error("Error fetching quote:", error.message);
        await msg.reply(theme.messages.quoteCommand.error);
        await chat.clearState();
    }
}

module.exports = {
    handleQuoteCommand
};
