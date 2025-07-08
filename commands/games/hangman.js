const fs = require('fs');
const path = require('path');

let wordCategories = {};
const MAX_INCORRECT_GUESSES = 7; // Adjust as needed

try {
    const wordsPath = path.join(__dirname, '../../resources/gamedata/hangman_words.json');
    const wordsData = fs.readFileSync(wordsPath, 'utf8');
    wordCategories = JSON.parse(wordsData);
} catch (error) {
    console.error("Failed to load hangman_words.json:", error);
}

function getRandomWord(category = 'general') {
    const categoryWords = wordCategories[category.toLowerCase()] || wordCategories['general'];
    if (!categoryWords || categoryWords.length === 0) {
        // Fallback if category is empty or general is also empty (should not happen with good data file)
        return wordCategories['general'][Math.floor(Math.random() * wordCategories['general'].length)];
    }
    return categoryWords[Math.floor(Math.random() * categoryWords.length)];
}

function getDisplayWord(word, guessedLetters) {
    return word.split('').map(letter => (guessedLetters.has(letter.toLowerCase()) ? letter : '_')).join(' ');
}

// Simple text representation of hangman state
function getHangmanVisual(incorrectGuesses) {
    const states = [
        "_______",
        "|     |",
        "|     O",
        "|    /|\\",
        "|    / \\",
        "|_______"
    ];
    // More detailed states can be added here for each incorrect guess count
    // For simplicity, just show guesses left for now, or a very basic visual.
    // This is a very rudimentary visual.
    let visual = "Guesses left: " + (MAX_INCORRECT_GUESSES - incorrectGuesses);
    if (incorrectGuesses > 0) visual += "\n O";
    if (incorrectGuesses > 1) visual += "\n |";
    if (incorrectGuesses > 2) visual = visual.replace("\n |","\n/|");
    if (incorrectGuesses > 3) visual = visual.replace("\n/|","\n/|\\");
    if (incorrectGuesses > 4) visual += "\n |";
    if (incorrectGuesses > 5) visual = visual.replace("\n |","\n/");
    if (incorrectGuesses > 6) visual = visual.replace("\n/","\n/ \\");

    return `\`\`\`\n${visual}\n\`\`\``; // Using backticks for monospace
}


async function handleHangmanCommand(msg, args, client, theme, botPrefix, activeGames) {
    const chatId = msg.from;
    const subCommand = args[0] ? args[0].toLowerCase() : 'word'; // Default to showing word/status
    let game = activeGames[chatId];
    const chat = await msg.getChat();

    if (subCommand === 'start') {
        if (game && game.gameType === 'hangman' && !game.gameOver) {
            await msg.reply(theme.messages.gameCommand.alreadyPlaying
                .replace('{gameName}', 'Hangman')
                .replace('{prefix}', botPrefix)
                .replace('{stopCommand}', 'hangman stop')
            );
            return;
        }
        if (Object.keys(wordCategories).length === 0 || !wordCategories['general'] || wordCategories['general'].length === 0) {
            await msg.reply(theme.messages.hangmanGame.loadError);
            return;
        }

        await chat.sendStateTyping();
        const category = args[1] || 'general';
        const wordToGuess = getRandomWord(category).toLowerCase();

        activeGames[chatId] = {
            gameType: 'hangman',
            wordToGuess: wordToGuess,
            displayWordArr: Array(wordToGuess.length).fill('_'),
            guessedLetters: new Set(),
            incorrectGuesses: 0,
            gameOver: false,
            category: category
        };
        game = activeGames[chatId]; // refresh game variable

        const display = getDisplayWord(game.wordToGuess, game.guessedLetters);
        await msg.reply(theme.messages.hangmanGame.start
            .replace('{length}', game.wordToGuess.length)
            .replace('{displayWord}', display)
            .replace('{guessesLeft}', MAX_INCORRECT_GUESSES - game.incorrectGuesses)
            .replace('{prefix}', botPrefix)
        );
        // await msg.reply(getHangmanVisual(game.incorrectGuesses)); // Show initial visual
        await chat.clearState();
        return;
    }

    if (!game || game.gameType !== 'hangman') {
        await msg.reply(theme.messages.gameCommand.notPlaying + ` Start a new game with \`${botPrefix}hangman start\`.`);
        return;
    }

    if (subCommand === 'stop') {
        const wordWas = game.wordToGuess;
        delete activeGames[chatId];
        await msg.reply(theme.messages.gameCommand.stopped + ` The word was: ${wordWas}`);
        return;
    }

    if (subCommand === 'word') { // Display current status
        const display = getDisplayWord(game.wordToGuess, game.guessedLetters);
        const visual = getHangmanVisual(game.incorrectGuesses);
        await msg.reply(`${visual}\nWord: \`${display}\`\nGuessed: ${Array.from(game.guessedLetters).join(', ') || 'None'}`);
        return;
    }


    if (subCommand === 'guess') {
        if (game.gameOver) {
            await msg.reply(theme.messages.gameCommand.gameOver + ` The word was: ${game.wordToGuess}. Start a new game.`);
            return;
        }

        const letter = args[1] ? args[1].toLowerCase() : null;
        if (!letter || letter.length !== 1 || !letter.match(/[a-z]/i)) {
            await msg.reply(theme.messages.hangmanGame.invalidLetter);
            return;
        }

        if (game.guessedLetters.has(letter)) {
            await msg.reply(theme.messages.hangmanGame.alreadyGuessed
                .replace('{letter}', letter)
                .replace('{guessedLetters}', Array.from(game.guessedLetters).join(', '))
            );
            return;
        }

        await chat.sendStateTyping();
        game.guessedLetters.add(letter);

        if (game.wordToGuess.includes(letter)) {
            const newDisplayWord = getDisplayWord(game.wordToGuess, game.guessedLetters);
            if (!newDisplayWord.includes('_')) { // Win condition
                game.gameOver = true;
                await msg.reply(theme.messages.hangmanGame.win.replace('{word}', game.wordToGuess));
                delete activeGames[chatId];
            } else {
                await msg.reply(theme.messages.hangmanGame.guessCorrect
                    .replace('{displayWord}', newDisplayWord)
                    .replace('{guessesLeft}', MAX_INCORRECT_GUESSES - game.incorrectGuesses)
                    .replace('{guessedLetters}', Array.from(game.guessedLetters).join(', '))
                );
            }
        } else {
            game.incorrectGuesses++;
            if (game.incorrectGuesses >= MAX_INCORRECT_GUESSES) { // Lose condition
                game.gameOver = true;
                await msg.reply(theme.messages.hangmanGame.lose.replace('{word}', game.wordToGuess));
                await msg.reply(getHangmanVisual(game.incorrectGuesses)); // Show final hangman
                delete activeGames[chatId];
            } else {
                await msg.reply(theme.messages.hangmanGame.guessIncorrect
                    .replace('{displayWord}', getDisplayWord(game.wordToGuess, game.guessedLetters))
                    .replace('{guessesLeft}', MAX_INCORRECT_GUESSES - game.incorrectGuesses)
                    .replace('{guessedLetters}', Array.from(game.guessedLetters).join(', '))
                );
            }
        }
        if (!game.gameOver) { // Show visual only if game continues
             await msg.reply(getHangmanVisual(game.incorrectGuesses));
        }
        await chat.clearState();
        return;
    }

    // If no valid Hangman subcommand
    await msg.reply(`Invalid .hangman command. Use \`${botPrefix}hangman start\`, \`${botPrefix}hangman guess <letter>\`, \`${botPrefix}hangman word\`, or \`${botPrefix}hangman stop\`.`);
}

module.exports = {
    handleHangmanCommand
};
