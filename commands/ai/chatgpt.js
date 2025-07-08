// Placeholder for ChatGPT Command
module.exports = {
    name: 'chatgpt',
    description: 'Chats with an AI (ChatGPT). (Not Implemented)',
    aliases: ['ai', 'ask'],
    usage: '<your question>',
    execute(client, message, args) {
        if (args.length === 0) {
            return message.reply('Please ask a question for ChatGPT!');
        }
        message.reply('🤖 ChatGPT integration is not yet implemented. I cannot answer your question right now.');
    },
};
