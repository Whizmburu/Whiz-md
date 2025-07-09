const fs = require('fs');
const path = require('path');

let truths = [];
try {
    const truthsPath = path.join(__dirname, '../../resources/data/truths.json');
    const truthsData = fs.readFileSync(truthsPath, 'utf8');
    truths = JSON.parse(truthsData);
} catch (error) {
    console.error("Failed to load truths.json:", error);
    // Bot will reply with loadError if truths array is empty
}

async function handleTruthCommand(msg, args, client, theme) {
    if (truths.length === 0) {
        await msg.reply(theme.messages.truthOrDareCommand.loadError + (theme.signatures.textOnlyAppend || ""));
        return;
    }

    const randomIndex = Math.floor(Math.random() * truths.length);
    const question = truths[randomIndex];
    const replyText = theme.messages.truthOrDareCommand.truth.replace('{question}', question);

    await msg.reply(replyText + (theme.signatures.textOnlyAppend || ""));
}

module.exports = {
    handleTruthCommand
};
