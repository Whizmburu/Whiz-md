// Placeholder or simple API for .fact command
const config = require('../../config');
// Example API: https://uselessfacts.jsph.pl/random.json?language=en
// const axios = require('axios');

module.exports = {
    name: 'fact',
    description: 'Sends a random interesting fact. (Placeholder or simple API)',
    category: 'fun_games',
    async execute(client, message, args) {
        // try {
        //     // const response = await axios.get('https://uselessfacts.jsph.pl/random.json?language=en');
        //     // if (response.data.text) {
        //     //     message.reply(`*Did you know?* 🤔\n\n${response.data.text}`);
        //     // } else {
        //     //     message.reply("Sorry, couldn't fetch a fact right now.");
        //     // }
        // } catch (error) {
        //     console.error("Error fetching fact:", error);
        //     message.reply("Sorry, couldn't fetch a fact right now. My encyclopedia is dusty.  धूल");
        // }
        const facts = [
            "Honey never spoils. Archaeologists have found pots of honey in ancient Egyptian tombs that are over 3,000 years old and still perfectly edible.",
            "A single cloud can weigh more than a million pounds.",
            "Octopuses have three hearts.",
            "Bananas are berries, but strawberries aren't.",
            "The shortest war in history was between Britain and Zanzibar on August 27, 1896. Zanzibar surrendered after 38 minutes."
        ];
        const randomFact = facts[Math.floor(Math.random() * facts.length)];
        message.reply(`*Did you know?* 🤔\n\n${randomFact}`);
    },
};
