// Broadcast Command - Owner Only
const config = require('../../config');

module.exports = {
    name: 'broadcast',
    description: 'Sends a message to all chats (groups and individual). Owner only.',
    ownerOnly: true,
    usage: '<message to broadcast>',
    aliases: ['bc'],
    async execute(client, message, args) {
        if (args.length === 0) {
            return message.reply('Please provide a message to broadcast.');
        }

        const broadcastMessage = args.join(' ');
        let successfulBroadcasts = 0;
        let failedBroadcasts = 0;

        try {
            const chats = await client.getChats();
            message.reply(`Starting broadcast to ${chats.length} chats. This might take a while...`);

            for (const chat of chats) {
                // Optional: Add filters here, e.g., don't broadcast to muted chats, or only to groups, etc.
                // if (chat.isMuted || !chat.isGroup) continue;
                try {
                    await chat.sendMessage(`*📣 WHIZ-MD Broadcast 📣*\n\n${broadcastMessage}\n\n_${config.botName}_`);
                    successfulBroadcasts++;
                    // Add a small delay to avoid rate limiting, though whatsapp-web.js handles some of this.
                    await new Promise(resolve => setTimeout(resolve, 500));
                } catch (err) {
                    console.warn(`Failed to send broadcast to chat ${chat.id.user || chat.name}: ${err.message}`);
                    failedBroadcasts++;
                }
            }

            message.reply(`Broadcast finished.\nSuccessfully sent to: ${successfulBroadcasts} chats.\nFailed to send to: ${failedBroadcasts} chats.`);

        } catch (error) {
            console.error('Error during broadcast:', error);
            message.reply(`An error occurred during broadcast: ${error.message}`);
        }
    },
};
