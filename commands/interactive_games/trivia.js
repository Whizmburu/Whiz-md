// Placeholder for .trivia command
const config = require('../../config');
// Example API: https://opentdb.com/api_config.php
// const axios = require('axios');

module.exports = {
    name: 'trivia',
    description: 'Starts a trivia game or asks a trivia question. (Placeholder - API needed)',
    usage: '[category] [difficulty]',
    category: 'interactive_games',
    async execute(client, message, args) {
        // try {
        //     // const response = await axios.get('https://opentdb.com/api.php?amount=1&type=multiple'); // Fetch one multiple choice question
        //     // const questionData = response.data.results[0];
        //     // if (!questionData) {
        //     //     return message.reply("Sorry, couldn't fetch a trivia question right now.");
        //     // }
        //     // const question = he.decode(questionData.question); // he library for HTML entities decoding
        //     // const correctAnswer = he.decode(questionData.correct_answer);
        //     // const incorrectAnswers = questionData.incorrect_answers.map(ans => he.decode(ans));
        //     // const allAnswers = [correctAnswer, ...incorrectAnswers].sort(() => Math.random() - 0.5); // Shuffle

        //     // let replyText = `*Trivia Time!* 🧠\n\n${question}\n\n`;
        //     // allAnswers.forEach((ans, index) => {
        //     //     replyText += `${String.fromCharCode(65 + index)}. ${ans}\n`; // A, B, C, D
        //     // });
        //     // replyText += "\nReply with your answer (e.g., A, B, C, or D) in the next 30 seconds!";
        //     // message.reply(replyText);
        //     // Store correctAnswer and answers for checking later, manage game state
        // } catch (error) {
        //     console.error("Error fetching trivia:", error);
        //     message.reply("Sorry, couldn't fetch trivia right now. My brain is buffering. 😵‍💫");
        // }
        message.reply("Trivia time! 🧠 This command is under construction. \n\nHere's a sample question: What is the capital of France?\n A. London\n B. Paris\n C. Berlin\n D. Rome\n\n(Full game with answer checking coming soon!)");
    },
};
