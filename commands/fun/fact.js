const axios = require('axios');

async function handleFactCommand(msg, args, client, theme) {
    const chat = await msg.getChat();
    try {
        await chat.sendStateTyping();
        await msg.reply(theme.messages.factCommand.loading + (theme.signatures.textOnlyAppend || ""));

        // API: https://uselessfacts.jsph.pl/random.json?language=en
        // Alternative: https://nekos.life/api/v2/fact (returns { "fact": "..."})
        const response = await axios.get('https://uselessfacts.jsph.pl/random.json?language=en', { timeout: 7000 });

        if (response.data && response.data.text) {
            const factText = `💡 **Did you know?**\n\n${response.data.text}`;
            await msg.reply(factText + (theme.signatures.textOnlyAppend || ""));
        } else {
            await msg.reply((theme.messages.factCommand.error + " (No fact found in API response)") + (theme.signatures.textOnlyAppend || ""));
        }
        await chat.clearState();
    } catch (error) {
        console.error("Error fetching fact:", error.message);
        await msg.reply(theme.messages.factCommand.error + (theme.signatures.textOnlyAppend || ""));
        await chat.clearState();
    }
}

module.exports = {
    handleFactCommand
};
