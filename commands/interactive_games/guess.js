// .guess (Number Guessing Game) command
const config = require('../../config');

// Simple in-memory store for active games.
// For a more robust bot, use a database or persistent store.
const activeGames = new Map(); // Key: chatId, Value: { numberToGuess, attempts, user }

module.exports = {
    name: 'guess',
    description: 'Starts a number guessing game (1-100).',
    usage: '[start/stop] OR [your_guess_number]',
    category: 'interactive_games',
    aliases: ['guessthenumber'],
    execute(client, message, args) {
        const chatId = message.from; // Game is per chat/user
        const senderId = message.author || message.from; // Who is playing

        if (args.length > 0 && args[0].toLowerCase() === 'start') {
            if (activeGames.has(chatId)) {
                return message.reply('A guessing game is already in progress in this chat! Use `.guess <number>` to play or `.guess stop` to end it.');
            }
            const numberToGuess = Math.floor(Math.random() * 100) + 1;
            activeGames.set(chatId, { numberToGuess, attempts: 0, user: senderId });
            return message.reply('🎲 Number Guessing Game Started! 🎲\nI\'m thinking of a number between 1 and 100. Try to guess it!\nUse `.guess <your_number>`.');
        }

        if (args.length > 0 && args[0].toLowerCase() === 'stop') {
            if (activeGames.has(chatId)) {
                const game = activeGames.get(chatId);
                 if (game.user !== senderId && !chat.isGroup) { // Only the starter can stop in PM
                    return message.reply("Only the person who started the game can stop it.");
                }
                activeGames.delete(chatId);
                return message.reply('Game stopped. The number was... well, it\'s a secret now! 😉');
            } else {
                return message.reply('No active guessing game to stop in this chat. Start one with `.guess start`.');
            }
        }

        if (!activeGames.has(chatId)) {
            return message.reply('No guessing game is currently active in this chat. Start one with `.guess start`.');
        }

        const game = activeGames.get(chatId);

        // In groups, allow anyone to guess? Or only the starter? For now, anyone.
        // if (game.user !== senderId && !chat.isGroup) {
        //     return message.reply("It's not your turn or you didn't start this game in PM.");
        // }


        const userGuess = parseInt(args[0]);
        if (isNaN(userGuess) || userGuess < 1 || userGuess > 100) {
            return message.reply('Please enter a valid number between 1 and 100 for your guess.');
        }

        game.attempts++;

        if (userGuess === game.numberToGuess) {
            const attempts = game.attempts;
            activeGames.delete(chatId);
            return message.reply(`🎉 Congratulations! You guessed the number ${game.numberToGuess} in ${attempts} attempts! 🎉\nStart a new game with \`.guess start\`.`);
        } else if (userGuess < game.numberToGuess) {
            activeGames.set(chatId, game); // Update attempts
            return message.reply('Too low! Try a higher number. 👇');
        } else {
            activeGames.set(chatId, game); // Update attempts
            return message.reply('Too high! Try a lower number. 👆');
        }
    },
};
