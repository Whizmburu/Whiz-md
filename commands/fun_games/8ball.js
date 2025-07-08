// .8ball command (Magic 8-Ball)
const config = require('../../config');

module.exports = {
    name: '8ball',
    description: 'Asks the Magic 8-Ball a question.',
    usage: '<your question>',
    category: 'fun_games',
    execute(client, message, args) {
        if (args.length === 0) {
            return message.reply('🎱 Please ask the Magic 8-Ball a question!');
        }

        const responses = [
            "It is certain.",
            "It is decidedly so.",
            "Without a doubt.",
            "Yes – definitely.",
            "You may rely on it.",
            "As I see it, yes.",
            "Most likely.",
            "Outlook good.",
            "Yes.",
            "Signs point to yes.",
            "Reply hazy, try again.",
            "Ask again later.",
            "Better not tell you now.",
            "Cannot predict now.",
            "Concentrate and ask again.",
            "Don't count on it.",
            "My reply is no.",
            "My sources say no.",
            "Outlook not so good.",
            "Very doubtful."
        ];

        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        const question = args.join(' ');

        message.reply(`You asked: "${question}"\n🎱 Magic 8-Ball says: *${randomResponse}*`);
    },
};
