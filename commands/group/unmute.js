// Unmute group command (set group to send messages: all participants)
const config = require('../../config');

module.exports = {
    name: 'unmute',
    description: 'Sets group message sending to "all participants". Bot and command issuer must be admin.',
    aliases: ['unsilence', 'allcanpost'],
    // groupAdminOnly: true,
    // botAdminOnly: true,
    async execute(client, message, args) {
        const chat = await message.getChat();
        if (!chat.isGroup) {
            return message.reply('This command can only be used in a group.');
        }

        const botParticipant = chat.participants.find(p => p.id._serialized === client.info.wid._serialized);
        if (!botParticipant || !botParticipant.isAdmin) {
            return message.reply('I need to be an admin in this group to change message settings.');
        }

        const senderId = message.author || message.from;
        const senderParticipant = chat.participants.find(p => p.id._serialized === senderId);
        if (!senderParticipant || !senderParticipant.isAdmin) {
            return message.reply('You need to be an admin in this group to change message settings.');
        }

        try {
            // true for "admins only", false for "all participants"
            await chat.setMessagesAdminsOnly(false);
            message.reply(`🔊 Group unmuted. All participants can send messages now.`);
        } catch (error) {
            console.error('Error unmuting group:', error);
            message.reply(`Failed to unmute group. Error: ${error.message}`);
        }
    },
};
