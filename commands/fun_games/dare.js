// .dare command
const config = require('../../config');

module.exports = {
    name: 'dare',
    description: 'Gives a random dare (text-based for a bot).',
    category: 'fun_games',
    execute(client, message, args) {
        const dares = [
            "Send a funny voice message to the third person in your chat list.",
            "Change your WhatsApp status to 'I love potatoes' for the next hour.",
            "Post 'I'm a unicorn' in the group chat (if in one, otherwise to a friend).",
            "Try to lick your elbow.",
            "Sing the chorus of your favorite song out loud (or send a voice note of it).",
            "Talk in a funny accent for the next 5 messages you send.",
            "Send a selfie making the silliest face you can to the person who sent this dare (or the bot if PM).",
            "Tell a cheesy pickup line to a random contact.",
            "Do 10 jumping jacks right now.",
            "Spell your name backwards in the chat."
        ];

        const randomDare = dares[Math.floor(Math.random() * dares.length)];
        message.reply(`*Dare Time!* 🔥\n\n${randomDare}\n\n_(Remember to be safe and respectful!)_`);
    },
};
