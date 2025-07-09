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
        const replyText = theme.messages.eightBallCommand.noQuestion.replace('{prefix}', botPrefix || '.');
        await msg.reply(replyText + (theme.signatures.textOnlyAppend || ""));
        return;
    }

    const randomIndex = Math.floor(Math.random() * eightBallResponses.length);
    const response = eightBallResponses[randomIndex];
    const fullReply = `${theme.messages.eightBallCommand.replyPrefix}${response}`;

    await msg.reply(fullReply + (theme.signatures.textOnlyAppend || ""));
}

module.exports = {
    handle8BallCommand
};
