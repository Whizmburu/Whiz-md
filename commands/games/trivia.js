const axios = require('axios');
const he = require('he'); // For decoding HTML entities

// Helper function to shuffle an array (Fisher-Yates shuffle)
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

async function fetchTriviaQuestion(difficulty, type) {
    let apiUrl = `https://opentdb.com/api.php?amount=1&encode=url3986`; // Use url3986 encoding
    if (difficulty && ['easy', 'medium', 'hard'].includes(difficulty.toLowerCase())) {
        apiUrl += `&difficulty=${difficulty.toLowerCase()}`;
    }
    if (type && ['multiple', 'boolean'].includes(type.toLowerCase())) {
        apiUrl += `&type=${type.toLowerCase()}`;
    }

    try {
        const response = await axios.get(apiUrl, { timeout: 8000 });
        if (response.data.response_code === 0 && response.data.results.length > 0) {
            const result = response.data.results[0];
            const decodedQuestion = he.decode(decodeURIComponent(result.question));
            const decodedCorrectAnswer = he.decode(decodeURIComponent(result.correct_answer));
            const decodedIncorrectAnswers = result.incorrect_answers.map(ans => he.decode(decodeURIComponent(ans)));

            let options = [];
            if (result.type === 'multiple') {
                options = shuffleArray([...decodedIncorrectAnswers, decodedCorrectAnswer]);
            } else { // boolean
                options = ["True", "False"]; // OpenTDB provides True/False as strings
            }

            return {
                question: decodedQuestion,
                category: he.decode(decodeURIComponent(result.category)),
                difficulty: he.decode(decodeURIComponent(result.difficulty)),
                type: result.type, // 'multiple' or 'boolean'
                options: options,
                correctAnswer: decodedCorrectAnswer,
                correctAnswerIndex: options.indexOf(decodedCorrectAnswer) // Store index for easy checking
            };
        } else {
            console.warn("Trivia API did not return a valid question. Code:", response.data.response_code, "Results:", response.data.results);
            return null; // Or throw an error
        }
    } catch (error) {
        console.error("Error fetching trivia question:", error.message);
        throw error; // Re-throw to be caught by command handler
    }
}


async function handleTriviaCommand(msg, args, client, theme, botPrefix, activeGames) {
    const chatId = msg.from;
    const subCommand = args[0] ? args[0].toLowerCase() : null; // difficulty or type
    const chat = await msg.getChat();

    // Stop current game if any
    if (subCommand === 'stop' || subCommand === 'skipquiz' || subCommand === 'stopquiz') {
        if (activeGames[chatId] && activeGames[chatId].gameType === 'trivia') {
            const game = activeGames[chatId];
            let stopMsg = theme.messages.gameCommand.stopped;
            if (game.question) { // If a question was active
                 stopMsg += ` The answer to the last question was: ${game.correctAnswer}`;
            }
            delete activeGames[chatId];
            await msg.reply(stopMsg);
        } else {
            await msg.reply(theme.messages.gameCommand.notPlaying);
        }
        return;
    }

    // If already playing trivia, don't start a new one unless they stop
    if (activeGames[chatId] && activeGames[chatId].gameType === 'trivia' && activeGames[chatId].question) {
         await msg.reply(theme.messages.gameCommand.alreadyPlaying
            .replace('{gameName}', 'Trivia')
            .replace('{prefix}', botPrefix)
            .replace('{stopCommand}', 'trivia stop')
        );
        return;
    }

    try {
        await chat.sendStateTyping();
        await msg.reply(theme.messages.triviaGame.loading);

        let difficulty = null;
        let type = null;

        args.forEach(arg => {
            const lowerArg = arg.toLowerCase();
            if (['easy', 'medium', 'hard'].includes(lowerArg)) difficulty = lowerArg;
            if (['multiple', 'boolean'].includes(lowerArg)) type = lowerArg;
        });

        const triviaData = await fetchTriviaQuestion(difficulty, type);

        if (!triviaData) {
            await msg.reply(theme.messages.triviaGame.apiError + " (No question received)");
            await chat.clearState();
            return;
        }

        activeGames[chatId] = {
            gameType: 'trivia',
            question: triviaData.question,
            options: triviaData.options,
            correctAnswer: triviaData.correctAnswer,
            correctAnswerIndex: triviaData.correctAnswerIndex, // 0-based index
            questionType: triviaData.type,
            category: triviaData.category,
            difficulty: triviaData.difficulty,
            answered: false
        };

        let optionsString = "";
        if (triviaData.type === 'multiple') {
            optionsString = triviaData.options.map((opt, index) => `${String.fromCharCode(65 + index)}. ${opt}`).join('\n'); // A. Option1, B. Option2
        } else { // boolean
            optionsString = triviaData.options.map((opt, index) => `${index + 1}. ${opt}`).join('\n'); // 1. True, 2. False
        }

        let questionMsg = theme.messages.triviaGame.newQuestion
            .replace('{difficulty}', triviaData.difficulty.charAt(0).toUpperCase() + triviaData.difficulty.slice(1))
            .replace('{category}', triviaData.category)
            .replace('{question}', triviaData.question)
            .replace('{options}', optionsString)
            .replace('{prefix}', botPrefix);

        await msg.reply(questionMsg);
        await chat.clearState();

    } catch (error) {
        console.error("Error in .trivia command:", error.message);
        await msg.reply(theme.messages.triviaGame.apiError);
        await chat.clearState();
    }
}

// The .answer command needs to be handled in index.js and routed here if a trivia game is active
async function handleTriviaAnswer(msg, args, client, theme, botPrefix, activeGames) {
    const chatId = msg.from;
    const game = activeGames[chatId];

    if (!game || game.gameType !== 'trivia' || !game.question || game.answered) {
        await msg.reply(theme.messages.triviaGame.noActiveQuestion.replace('{prefix}', botPrefix));
        return;
    }

    const userAnswerStr = args.join('').toLowerCase();
    if (!userAnswerStr) {
        await msg.reply("⚠️ Please provide an answer (e.g., A, B, 1, 2, True, False).");
        return;
    }

    let userAnswerIndex = -1;

    if (game.questionType === 'multiple') { // A, B, C, D
        if (userAnswerStr.length === 1 && userAnswerStr.match(/[a-d]/i)) {
            userAnswerIndex = userAnswerStr.charCodeAt(0) - 'a'.charCodeAt(0);
        } else { // Try matching full option text
            const directMatchIndex = game.options.findIndex(opt => opt.toLowerCase() === userAnswerStr);
            if (directMatchIndex !== -1) userAnswerIndex = directMatchIndex;
        }
    } else { // boolean: 1 for True, 2 for False, or "true"/"false"
        if (userAnswerStr === '1' || userAnswerStr === 'true') userAnswerIndex = game.options.indexOf("True");
        else if (userAnswerStr === '2' || userAnswerStr === 'false') userAnswerIndex = game.options.indexOf("False");
         else { // Try matching full option text
            const directMatchIndex = game.options.findIndex(opt => opt.toLowerCase() === userAnswerStr);
            if (directMatchIndex !== -1) userAnswerIndex = directMatchIndex;
        }
    }

    game.answered = true; // Mark as answered to prevent multiple attempts on same Q

    if (userAnswerIndex === game.correctAnswerIndex) {
        await msg.reply(theme.messages.triviaGame.correct);
    } else {
        await msg.reply(theme.messages.triviaGame.incorrect.replace('{correctAnswer}', game.correctAnswer));
    }

    // Clear the question for this chat, or wait for next .trivia command
    // For now, let's clear it so they have to type .trivia for a new one.
    delete activeGames[chatId].question;
    // A more advanced system might have rounds or auto-continue.
}


module.exports = {
    handleTriviaCommand,
    handleTriviaAnswer // Export this to be used by .answer command in index.js
};
