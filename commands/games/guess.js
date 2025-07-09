// This function will be called from index.js
// activeGames will be passed or accessed from a shared module if we refactor later.

async function handleGuessCommand(msg, args, client, theme, botPrefix, activeGames) {
    const chatId = msg.from;
    const commandArg = args[0] ? args[0].toLowerCase() : null;
    const game = activeGames[chatId];

    if (commandArg === 'start') {
        if (game && game.gameType === 'guess') {
            await msg.reply(theme.messages.gameCommand.alreadyPlaying
                .replace('{gameName}', 'Number Guessing')
                .replace('{prefix}', botPrefix)
                .replace('{stopCommand}', 'guess stop') + (theme.signatures.textOnlyAppend || "")
            );
            return;
        }

        const maxNumber = parseInt(args[1]) || 100;
        if (isNaN(maxNumber) || maxNumber <= 1 || maxNumber > 10000) {
            await msg.reply("⚠️ Please provide a valid maximum number between 2 and 10000 for the game." + (theme.signatures.textOnlyAppend || ""));
            return;
        }

        activeGames[chatId] = {
            gameType: 'guess',
            targetNumber: Math.floor(Math.random() * maxNumber) + 1,
            maxNumber: maxNumber,
            attempts: 0
        };
        await msg.reply(theme.messages.guessGame.start
            .replace('{maxNumber}', maxNumber)
            .replace('{prefix}', botPrefix) + (theme.signatures.textOnlyAppend || "")
        );
        return;
    }

    if (commandArg === 'stop') {
        if (game && game.gameType === 'guess') {
            const stoppedMessage = theme.messages.guessGame.stopped.replace('{number}', game.targetNumber);
            delete activeGames[chatId];
            await msg.reply(stoppedMessage + (theme.signatures.textOnlyAppend || ""));
        } else {
            await msg.reply(theme.messages.guessGame.noActiveGame.replace('{prefix}', botPrefix) + (theme.signatures.textOnlyAppend || ""));
        }
        return;
    }

    // If it's not 'start' or 'stop', it must be a guess
    if (!game || game.gameType !== 'guess') {
        await msg.reply(theme.messages.guessGame.noActiveGame.replace('{prefix}', botPrefix) + (theme.signatures.textOnlyAppend || ""));
        return;
    }

    const userGuess = parseInt(commandArg);
    if (isNaN(userGuess)) {
        await msg.reply(theme.messages.guessGame.invalidGuess + (theme.signatures.textOnlyAppend || ""));
        return;
    }

    game.attempts++;

    if (userGuess === game.targetNumber) {
        await msg.reply(theme.messages.guessGame.correct
            .replace('{number}', game.targetNumber)
            .replace('{attempts}', game.attempts) + (theme.signatures.textOnlyAppend || "")
        );
        delete activeGames[chatId]; // Game ends
    } else if (userGuess < game.targetNumber) {
        await msg.reply(theme.messages.guessGame.tooLow + (theme.signatures.textOnlyAppend || ""));
    } else { // userGuess > game.targetNumber
        await msg.reply(theme.messages.guessGame.tooHigh + (theme.signatures.textOnlyAppend || ""));
    }
}

module.exports = {
    handleGuessCommand
};
