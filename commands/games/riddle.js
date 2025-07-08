const fs = require('fs');
const path = require('path');

let riddles = [];
try {
    const riddlesPath = path.join(__dirname, '../../resources/gamedata/riddles.json');
    const riddlesData = fs.readFileSync(riddlesPath, 'utf8');
    riddles = JSON.parse(riddlesData);
} catch (error) {
    console.error("Failed to load riddles.json:", error);
}

async function handleRiddleCommand(msg, args, client, theme, botPrefix, activeGames) {
    const chatId = msg.from;
    const game = activeGames[chatId];

    if (riddles.length === 0) {
        await msg.reply(theme.messages.riddleGame.loadError);
        return;
    }

    // If a riddle is active and user types .riddle again, maybe show answer or just give new one.
    // For now, giving a new one will overwrite the old one.
    // A sub-command like .riddle answer <text> is handled by .answer command.

    const randomIndex = Math.floor(Math.random() * riddles.length);
    const newRiddle = riddles[randomIndex];

    activeGames[chatId] = {
        gameType: 'riddle',
        currentRiddleQuestion: newRiddle.question,
        currentRiddleAnswer: newRiddle.answer,
        answered: false // To track if it has been answered
    };

    await msg.reply(theme.messages.riddleGame.newRiddle
        .replace('{riddle}', newRiddle.question)
        .replace('{prefix}', botPrefix)
    );
}

async function handleAnswerCommand(msg, args, client, theme, botPrefix, activeGames) {
    const chatId = msg.from;
    const game = activeGames[chatId];

    if (!game || game.gameType !== 'riddle' || game.answered) {
        await msg.reply(theme.messages.riddleGame.noActiveRiddle.replace('{prefix}', botPrefix));
        return;
    }

    const userAnswer = args.join(' ').trim().toLowerCase();
    const correctAnswer = game.currentRiddleAnswer.toLowerCase();

    if (!userAnswer) {
        await msg.reply("⚠️ Please provide an answer after the command. Example: `.answer Your Guess`");
        return;
    }

    if (userAnswer === correctAnswer) {
        await msg.reply(theme.messages.riddleGame.correctAnswer.replace('{answer}', game.currentRiddleAnswer));
        game.answered = true; // Mark as answered
        // Optionally, clear the game: delete activeGames[chatId];
        // For now, let's keep it so they can't answer again until new riddle.
    } else {
        await msg.reply(theme.messages.riddleGame.wrongAnswer);
    }
}


module.exports = {
    handleRiddleCommand,
    handleAnswerCommand // We'll need to register .answer in index.js too
};
