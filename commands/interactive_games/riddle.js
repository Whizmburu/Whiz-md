// Placeholder or simple API for .riddle command
const config = require('../../config');
// const axios = require('axios'); // Example: for an external riddle API

module.exports = {
    name: 'riddle',
    description: 'Tells a random riddle. (Placeholder or local list)',
    category: 'interactive_games',
    aliases: ['iqtest'], // A bit of a misnomer, but fun
    async execute(client, message, args) {
        const riddles = [
            { question: "I speak without a mouth and hear without ears. I have no body, but I come alive with wind. What am I?", answer: "An echo" },
            { question: "What has keys but opens no locks?", answer: "A piano" },
            { question: "What is full of holes but still holds water?", answer: "A sponge" },
            { question: "What is always in front of you but can’t be seen?", answer: "The future" },
            { question: "What has an eye, but cannot see?", answer: "A needle" }
        ];

        // For a real game, you'd store the current riddle and wait for an answer.
        // This is a simplified version that just gives the riddle and answer.
        const randomRiddle = riddles[Math.floor(Math.random() * riddles.length)];

        // To make it slightly interactive:
        // 1. Send the riddle.
        // 2. Store the answer associated with the chatId.
        // 3. Wait for a user's guess (e.g., via a `.answer` command or just next message).
        // This is too complex for a "basic logic" step. So, just giving riddle + answer.

        message.reply(`*Riddle Me This!* 🕵️‍♂️\n\n${randomRiddle.question}\n\nThink about it...\n\n...\n\nAnswer: ||*${randomRiddle.answer}*|| \n\n_(Tap to reveal answer)_`);
    },
};
