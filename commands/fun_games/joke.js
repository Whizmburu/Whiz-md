// Placeholder or simple API for .joke command
const config = require('../../config');
// Example API: https://v2.jokeapi.dev/
// const axios = require('axios');

module.exports = {
    name: 'joke',
    description: 'Tells a random joke. (Placeholder or simple API)',
    category: 'fun_games',
    async execute(client, message, args) {
        // try {
        //     // const response = await axios.get('https://v2.jokeapi.dev/joke/Any?blacklistFlags=nsfw,religious,political,racist,sexist,explicit&type=single'); // or 'twopart'
        //     // if (response.data.error) {
        //     //     message.reply("Sorry, couldn't fetch a joke right now. The API might be down.");
        //     // } else {
        //     //     if (response.data.type === 'single') {
        //     //         message.reply(response.data.joke);
        //     //     } else { // twopart
        //     //         message.reply(`${response.data.setup}\n\n...\n\n${response.data.delivery}`);
        //     //     }
        //     // }
        // } catch (error) {
        //     console.error("Error fetching joke:", error);
        //     message.reply("Sorry, couldn't fetch a joke right now. My funny bone is broken. 🦴");
        // }
        const jokes = [
            "Why did the scarecrow win an award? Because he was outstanding in his field!",
            "Why don't programmers like nature? It has too many bugs.",
            "What do you call fake spaghetti? An impasta!",
            "Why did the bicycle fall over? Because it was two tired!",
            "How does a penguin build its house? Igloos it together!"
        ];
        const randomJoke = jokes[Math.floor(Math.random() * jokes.length)];
        message.reply(randomJoke);
    },
};
