const axios = require('axios');

async function handleJokeCommand(msg, args, client, theme) {
    const chat = await msg.getChat();
    try {
        await chat.sendStateTyping();
        await msg.reply(theme.messages.jokeCommand.loading);

        const response = await axios.get('https://icanhazdadjoke.com/', {
            headers: { 'Accept': 'application/json' },
            timeout: 7000 // 7 seconds
        });

        if (response.data && response.data.joke) {
            await msg.reply(`😂 ${response.data.joke}`);
        } else {
            await msg.reply(theme.messages.jokeCommand.error + " (No joke found in API response)");
        }
        await chat.clearState();
    } catch (error) {
        console.error("Error fetching joke:", error.message);
        await msg.reply(theme.messages.jokeCommand.error);
        await chat.clearState();
    }
}

module.exports = {
    handleJokeCommand
};
