// Command: .numberinfo <phone_number>

async function handleNumberInfoCommand(msg, args, client, theme, botPrefix) {
    const chat = await msg.getChat(); // To send typing state
    const phoneNumberArg = args.join('').replace(/\D/g, ''); // Remove all non-digits

    if (!phoneNumberArg) {
        await msg.reply(theme.messages.numberInfoCmd.noNumber.replace('{prefix}', botPrefix));
        return;
    }

    // Basic validation for length, though WhatsApp IDs can vary slightly.
    // This is just a rough check.
    if (phoneNumberArg.length < 7 || phoneNumberArg.length > 15) {
        await msg.reply(theme.messages.numberInfoCmd.error.replace('{number}', args.join(' ')));
        return;
    }

    const whatsappId = `${phoneNumberArg}@c.us`;

    try {
        await chat.sendStateTyping();
        await msg.reply(theme.messages.numberInfoCmd.checking.replace('{number}', phoneNumberArg));

        const isRegistered = await client.isRegisteredUser(whatsappId);

        if (isRegistered) {
            // You can optionally try to get contact info if registered, but it might not always be available
            // or might return only basic info if not in bot's contacts.
            // For now, just confirming registration.
            // let contactInfo = "";
            // try {
            //     const contact = await client.getContactById(whatsappId);
            //     if (contact) {
            //         contactInfo = `\nName (if known): ${contact.pushname || contact.name || 'N/A'}`;
            //     }
            // } catch (contactError) { /* ignore if contact can't be fetched */ }

            await msg.reply(
                (theme.messages.numberInfoCmd.registered.replace('{number}', phoneNumberArg)) +
                // contactInfo +
                (theme.messages.numberInfoCmd.disclaimer)
            );
        } else {
            await msg.reply(
                (theme.messages.numberInfoCmd.notRegistered.replace('{number}', phoneNumberArg)) +
                (theme.messages.numberInfoCmd.disclaimer)
            );
        }
        await chat.clearState();

    } catch (error) {
        console.error(`Error in .numberinfo for ${whatsappId}:`, error);
        await msg.reply(theme.messages.numberInfoCmd.error.replace('{number}', phoneNumberArg));
        await chat.clearState();
    }
}

module.exports = {
    handleNumberInfoCommand
};
