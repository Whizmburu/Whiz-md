// Group link command
const config = require('../../config');

module.exports = {
    name: 'link',
    description: 'Gets the invite link for the current group. Bot and command issuer must be admin.',
    aliases: ['grouplink', 'invitelink'],
    // groupAdminOnly: true, // User issuing command must be admin
    // botAdminOnly: true,   // Bot must be admin
    async execute(client, message, args) {
        const chat = await message.getChat();
        if (!chat.isGroup) {
            return message.reply('This command can only be used in a group.');
        }

        const botParticipant = chat.participants.find(p => p.id._serialized === client.info.wid._serialized);
        if (!botParticipant || !botParticipant.isAdmin) {
            return message.reply('I need to be an admin in this group to get the invite link.');
        }

        const senderId = message.author || message.from;
        const senderParticipant = chat.participants.find(p => p.id._serialized === senderId);
        if (!senderParticipant || !senderParticipant.isAdmin) {
            // Allow non-admins to get link if group settings permit, but problem asks for admin only.
            // For now, sticking to admin only for link generation/retrieval by user.
            // If group has "all participants" can edit group info, they might be able to get link.
            // However, `getInviteCode` is usually an admin action.
            return message.reply('You need to be an admin in this group to get the invite link.');
        }

        try {
            const inviteCode = await chat.getInviteCode();
            const groupInviteLink = `https://chat.whatsapp.com/${inviteCode}`;
            message.reply(`🔗 *Group Invite Link for ${chat.name}:*\n${groupInviteLink}`);
        } catch (error) {
            console.error('Error getting group invite code:', error);
            message.reply(`Failed to get group invite link. Error: ${error.message}\nMake sure I have admin rights and the group allows invite links.`);
        }
    },
};
