const eightBallResponses = [
    // Affirmative
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
    // Non-committal
    "Reply hazy, try again.",
    "Ask again later.",
    "Better not tell you now.",
    "Cannot predict now.",
    "Concentrate and ask again.",
    // Negative
    "Don't count on it.",
    "My reply is no.",
    "My sources say no.",
    "Outlook not so good.",
    "Very doubtful."
];

async function handle8BallCommand(msg, args, client, theme) {
    const question = args.join(' ');

    if (!question) {
        await msg.reply(theme.messages.eightBallCommand.noQuestion.replace('{prefix}', client.botPrefix || '.')); // Assuming botPrefix is on client or passed differently
        return;
    }

    const randomIndex = Math.floor(Math.random() * eightBallResponses.length);
    const response = eightBallResponses[randomIndex];

    await msg.reply(`${theme.messages.eightBallCommand.replyPrefix}${response}`);
}

module.exports = {
    handle8BallCommand
};
