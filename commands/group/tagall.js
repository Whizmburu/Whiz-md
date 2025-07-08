// Tag all members in a group command
const config = require('../../config');

module.exports = {
    name: 'tagall',
    description: 'Tags all members in the group. Optionally include a message.',
    usage: '[message]',
    aliases: ['everyone', 'all'],
    // No specific admin check here, can be used by anyone by default.
    // Add groupAdminOnly: true if only admins should use it.
    async execute(client, message, args) {
        const chat = await message.getChat();
        if (!chat.isGroup) {
            return message.reply('This command can only be used in a group.');
        }

        let text = args.length > 0 ? args.join(' ') : 'Attention everyone!';
        let mentions = [];

        for (let participant of chat.participants) {
            // Don't tag the bot itself if it's a participant object from getContactById
            // For participant objects from chat.participants, id is { server, user, _serialized }
            if (participant.id._serialized !== client.info.wid._serialized) {
                 // Create a contact-like object for mentions if participant doesn't have getContactById
                const contact = await client.getContactById(participant.id._serialized);
                mentions.push(contact);
            }
        }

        if (mentions.length === 0) {
            return message.reply("No one else to tag in this group (besides me!).");
        }

        // Prepend a title or context to the user's message
        const fullMessage = `📣 *Tag All by ${message._data.notifyName || (await message.getContact()).pushname || 'User'}*\n\n${text}`;

        try {
            await chat.sendMessage(fullMessage, { mentions });
        } catch (error) {
            console.error('Error sending tagall message:', error);
            // Fallback if tagging too many fails (less common with wwebjs but possible)
            // Try sending without mentions if the above fails for some reason
            try {
                let fallbackText = `📣 *Tag All by ${message._data.notifyName || (await message.getContact()).pushname || 'User'}*\n\n${text}\n\n`;
                for(let participant of chat.participants){
                    if (participant.id._serialized !== client.info.wid._serialized) {
                        fallbackText += `@${participant.id.user} `;
                    }
                }
                await chat.sendMessage(fallbackText.trim());
                 message.reply("Used fallback tagging method as the primary one might have failed.");
            } catch (fallbackError) {
                console.error('Error sending fallback tagall message:', fallbackError);
                message.reply('Failed to tag everyone. There might be an issue with WhatsApp or too many participants.');
            }
        }
    },
};
