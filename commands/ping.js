// Example Ping Command
module.exports = {
    name: 'ping',
    description: 'Replies with Pong!',
    aliases: ['p'],
    execute(client, message, args) {
        const startTime = Date.now();
        message.reply('Pong!').then(() => {
            const endTime = Date.now();
            const latency = endTime - startTime;
            message.reply(`Latency: ${latency}ms`);
        });
    },
};
