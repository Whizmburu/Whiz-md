// Placeholder or simple API for .quote command
const config = require('../../config');
// Example API: https://api.quotable.io/random
// const axios = require('axios');

module.exports = {
    name: 'quote',
    description: 'Sends a random inspirational quote. (Placeholder or simple API)',
    category: 'fun_games',
    async execute(client, message, args) {
        // try {
        //     // const response = await axios.get('https://api.quotable.io/random');
        //     // if (response.data.content && response.data.author) {
        //     //     message.reply(`"${response.data.content}"\n\n— ${response.data.author}`);
        //     // } else {
        //     //     message.reply("Sorry, couldn't fetch a quote right now.");
        //     // }
        // } catch (error) {
        //     console.error("Error fetching quote:", error);
        //     message.reply("Sorry, couldn't fetch a quote right now. My wisdom is on vacation. 🧘");
        // }
        const quotes = [
            { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
            { text: "Strive not to be a success, but rather to be of value.", author: "Albert Einstein" },
            { text: "The mind is everything. What you think you become.", author: "Buddha" },
            { text: "Your time is limited, so don’t waste it living someone else’s life.", author: "Steve Jobs" },
            { text: "The best way to predict the future is to create it.", author: "Peter Drucker" }
        ];
        const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
        message.reply(`"${randomQuote.text}"\n\n— ${randomQuote.author}`);
    },
};
