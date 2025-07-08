// Placeholder for .hangman command
const config = require('../../config');

// Very basic in-memory store for hangman games (for demonstration)
// Key: chatId, Value: { word: 'SECRET', guessedLetters: ['S', 'T'], incorrectGuesses: 0, maxIncorrect: 6, user: 'senderId' }
const activeHangmanGames = new Map();

module.exports = {
    name: 'hangman',
    description: 'Starts a game of Hangman. (Placeholder/Simple version)',
    usage: '[start <word_to_guess> OR start_random] OR [guess <letter>] OR [stop]',
    category: 'interactive_games',
    execute(client, message, args) {
        const chatId = message.from;
        const senderId = message.author || message.from;

        if (args.length > 0 && args[0].toLowerCase() === 'start_random') {
            if (activeHangmanGames.has(chatId)) {
                return message.reply("A Hangman game is already in progress. Use `.hangman guess <letter>` or `.hangman stop`.");
            }
            const randomWords = ["APPLE", "BANANA", "WHATSAPP", "JAVASCRIPT", "DEVELOPER", "PYTHON", "GITHUB"];
            const wordToGuess = randomWords[Math.floor(Math.random() * randomWords.length)];
            activeHangmanGames.set(chatId, {
                word: wordToGuess.toUpperCase(),
                guessedLetters: new Set(),
                incorrectGuesses: 0,
                maxIncorrect: 7, // Typically 6-7 for hangman
                user: senderId,
                displayWord: "_ ".repeat(wordToGuess.length).trim()
            });
            return message.reply(`Random Word Hangman started! 🕴️\nWord: ${activeHangmanGames.get(chatId).displayWord}\nGuess a letter with \`.hangman guess <letter>\`.`);

        } else if (args.length > 1 && args[0].toLowerCase() === 'start') {
             if (activeHangmanGames.has(chatId)) {
                return message.reply("A Hangman game is already in progress. Use `.hangman guess <letter>` or `.hangman stop`.");
            }
            const wordToGuess = args[1].toUpperCase();
            if (!/^[A-Z]+$/.test(wordToGuess) || wordToGuess.length < 3) {
                return message.reply("Please provide a valid word (letters only, at least 3 characters long) to start Hangman if not using random.");
            }
             activeHangmanGames.set(chatId, {
                word: wordToGuess,
                guessedLetters: new Set(),
                incorrectGuesses: 0,
                maxIncorrect: 7,
                user: senderId, // Person who knows the word if not playing against self
                displayWord: "_ ".repeat(wordToGuess.length).trim()
            });
            // In a group, the person who *didn't* start it should guess. This setup is basic.
            return message.reply(`Hangman started by ${senderId.split('@')[0]}! 🕴️\nWord: ${activeHangmanGames.get(chatId).displayWord}\nSomeone else guess a letter with \`.hangman guess <letter>\`.\n(If playing solo, you can guess too!)`);

        } else if (args.length > 1 && args[0].toLowerCase() === 'guess') {
            if (!activeHangmanGames.has(chatId)) {
                return message.reply("No Hangman game in progress. Start one with `.hangman start_random` or `.hangman start <word>`.");
            }
            const game = activeHangmanGames.get(chatId);
            const letter = args[1].toUpperCase();

            if (!/^[A-Z]$/.test(letter)) {
                return message.reply("Please guess a single letter.");
            }
            if (game.guessedLetters.has(letter)) {
                return message.reply(`You already guessed "${letter}". Try another!`);
            }

            game.guessedLetters.add(letter);
            let newDisplayWord = "";
            let letterFound = false;
            for (const char of game.word) {
                if (game.guessedLetters.has(char) || char === ' ') { // Also reveal spaces if any
                    newDisplayWord += char + " ";
                    if (char === letter) letterFound = true;
                } else {
                    newDisplayWord += "_ ";
                }
            }
            game.displayWord = newDisplayWord.trim();

            if (!letterFound) {
                game.incorrectGuesses++;
                message.reply(`"${letter}" is not in the word. Incorrect guesses: ${game.incorrectGuesses}/${game.maxIncorrect}. 😟`);
            } else {
                message.reply(`Good guess! "${letter}" is in the word. 👍`);
            }

            // Check for win/loss
            if (game.displayWord.replace(/ /g, '') === game.word) {
                message.reply(`🎉 You win! The word was: *${game.word}*`);
                activeHangmanGames.delete(chatId);
                return;
            }
            if (game.incorrectGuesses >= game.maxIncorrect) {
                message.reply(`💀 Game Over! You ran out of guesses. The word was: *${game.word}*`);
                activeHangmanGames.delete(chatId);
                return;
            }

            // Update game state
            activeHangmanGames.set(chatId, game);
            return message.reply(`Word: ${game.displayWord}\nGuessed: ${Array.from(game.guessedLetters).join(', ')}\nIncorrect: ${game.incorrectGuesses}/${game.maxIncorrect}`);


        } else if (args.length > 0 && args[0].toLowerCase() === 'stop') {
            if (activeHangmanGames.has(chatId)) {
                const game = activeHangmanGames.get(chatId);
                 // if (game.user !== senderId && !chat.isGroup) { // Optional: only starter can stop
                //    return message.reply("Only the game starter can stop it.");
                // }
                const word = game.word;
                activeHangmanGames.delete(chatId);
                return message.reply(`Hangman game stopped. The word was: *${word}*`);
            } else {
                return message.reply("No active Hangman game to stop.");
            }
        } else {
             message.reply(`Welcome to Hangman! 🕴️\nUse:\n  \`${config.prefix}hangman start_random\`\n  \`${config.prefix}hangman start <your_word_for_others_to_guess>\`\n  \`${config.prefix}hangman guess <letter>\`\n  \`${config.prefix}hangman stop\``);
        }
    },
};
