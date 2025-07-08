// .truth command
const config = require('../../config');

module.exports = {
    name: 'truth',
    description: 'Gives a random truth question.',
    category: 'fun_games',
    execute(client, message, args) {
        const truths = [
            "What's the most embarrassing thing that's ever happened to you?",
            "Have you ever lied to get out of trouble? What was it?",
            "What's a secret you've never told anyone?",
            "What's your biggest fear?",
            "Who is your secret crush?",
            "What's the silliest thing you've ever done?",
            "If you could trade lives with someone for a day, who would it be and why?",
            "What's one thing you would change about yourself if you could?",
            "What's the last lie you told?",
            "What's something you're glad your family doesn't know about you?"
        ];

        const randomTruth = truths[Math.floor(Math.random() * truths.length)];
        message.reply(`*Truth Time!* 😮\n\n${randomTruth}`);
    },
};
