const fs = require('fs');
const path = require('path');

let dares = [];
try {
    const daresPath = path.join(__dirname, '../../resources/data/dares.json');
    const daresData = fs.readFileSync(daresPath, 'utf8');
    dares = JSON.parse(daresData);
} catch (error) {
    console.error("Failed to load dares.json:", error);
    // Bot will reply with loadError if dares array is empty
}

async function handleDareCommand(msg, args, client, theme) {
    if (dares.length === 0) {
        await msg.reply(theme.messages.truthOrDareCommand.loadError + (theme.signatures.textOnlyAppend || ""));
        return;
    }

    const randomIndex = Math.floor(Math.random() * dares.length);
    const challenge = dares[randomIndex];
    const replyText = theme.messages.truthOrDareCommand.dare.replace('{challenge}', challenge);

    await msg.reply(replyText + (theme.signatures.textOnlyAppend || ""));
}

module.exports = {
    handleDareCommand
};
