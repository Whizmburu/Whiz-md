// Shutdown Command - Owner Only
const config = require('../../config');

module.exports = {
    name: 'shutdown',
    description: 'Shuts down the bot. Owner only.',
    ownerOnly: true,
    aliases: ['kill', 'stopbot'],
    async execute(client, message, args) {
        await message.reply('🤖 WHIZ-MD is shutting down...');
        console.log('Shutdown command received from owner. Exiting process...');

        // Perform any cleanup tasks here if needed
        // e.g., saving session, closing database connections

        client.destroy() // Gracefully disconnect the client
            .then(() => {
                console.log("Client destroyed. Exiting now.");
                process.exit(0);
            })
            .catch(err => {
                console.error("Error destroying client during shutdown:", err);
                process.exit(1); // Exit with error if destroy fails
            });
    },
};
