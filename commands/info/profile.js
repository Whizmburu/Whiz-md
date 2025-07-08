const { MessageMedia } = require('whatsapp-web.js');
const axios = require('axios'); // For downloading PFP

async function handleProfileCommand(msg, args, client, theme, botPrefix) {
    const chat = await msg.getChat();
    await chat.sendStateTyping();

    let targetContact;
    let targetId;

    if (msg.mentionedIds.length > 0) {
        targetId = msg.mentionedIds[0];
        targetContact = await client.getContactById(targetId);
    } else if (msg.hasQuotedMsg) {
        const quotedMsg = await msg.getQuotedMessage();
        // Quoted message author is the ID of the user who sent the quoted message
        targetId = quotedMsg.author || quotedMsg.from;
        targetContact = await client.getContactById(targetId);
    } else {
        targetId = msg.author || msg.from; // Sender of the command
        targetContact = await msg.getContact();
    }

    if (!targetContact) {
        await msg.reply(theme.messages.profileCmd.notFound || "❓ User not found.");
        await chat.clearState();
        return;
    }

    try {
        await msg.reply(theme.messages.profileCmd.loading || "👤 Fetching profile information...");

        const name = targetContact.pushname || targetContact.name || targetContact.shortName || targetId.split('@')[0];
        const about = await targetContact.getAbout() || (theme.messages.profileCmd.noAbout || "🚫 No status/about set.");
        const number = targetContact.number || targetId.split('@')[0]; // contact.number might not always be available
        const isBusiness = targetContact.isBusiness ? "Yes" : "No";
        const isMe = targetContact.isMe ? "Yes (This is me, the Bot!)" : "No";

        let profilePicMedia = null;
        try {
            const pfpUrl = await targetContact.getProfilePicUrl();
            if (pfpUrl) {
                const pfpResponse = await axios.get(pfpUrl, { responseType: 'arraybuffer' });
                const pfpBuffer = Buffer.from(pfpResponse.data, 'binary');
                profilePicMedia = new MessageMedia('image/jpeg', pfpBuffer.toString('base64'), 'profile.jpg');
            }
        } catch (pfpError) {
            console.warn(`Could not fetch profile picture for ${name}: ${pfpError.message}`);
        }

        const profileInfoMsg = theme.messages.profileCmd.info
            .replace('{name}', name)
            .replace('{about}', about)
            .replace('{number}', number)
            .replace('{isBusiness}', isBusiness)
            .replace('{isMe}', isMe);

        if (profilePicMedia) {
            await client.sendMessage(msg.from, profilePicMedia, { caption: profileInfoMsg });
        } else {
            await msg.reply(profileInfoMsg);
        }

        await chat.clearState();

    } catch (error) {
        console.error(`Error in .profile command for ${targetId}:`, error);
        await msg.reply(theme.messages.profileCmd.notFound || "❓ Error fetching profile.");
        await chat.clearState();
    }
}

module.exports = {
    handleProfileCommand
};
