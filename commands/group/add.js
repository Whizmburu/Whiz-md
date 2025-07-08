// Add user to group command
const config = require('../../config');

module.exports = {
    name: 'add',
    description: 'Adds a user to the group. Bot must be admin.',
    usage: '<number1> [number2 ...]',
    groupAdminOnly: false, // Can be used by anyone, but bot needs to be admin
    botAdminOnly: true, // Custom property to check if bot is admin
    async execute(client, message, args) {
        const chat = await message.getChat();
        if (!chat.isGroup) {
            return message.reply('This command can only be used in a group.');
        }

        // Check if bot is an admin in the group
        const botParticipant = chat.participants.find(p => p.id._serialized === client.info.wid._serialized);
        if (!botParticipant || !botParticipant.isAdmin) {
            return message.reply('I need to be an admin in this group to add members.');
        }

        // User trying to use the command must be an admin
        const sender = await message.getContact();
        const senderParticipant = chat.participants.find(p => p.id._serialized === sender.id._serialized);
        if (!senderParticipant || !senderParticipant.isAdmin) {
            return message.reply('You need to be an admin in this group to add members.');
        }


        if (args.length === 0) {
            return message.reply(`Please provide the number(s) of the user(s) to add.\nExample: ${config.prefix}add 1234567890 0987654321`);
        }

        const numbersToAdd = args.map(arg => arg.replace(/[^0-9]/g, '') + '@c.us');
        const validNumbers = [];
        const invalidNumbers = [];

        for (const num of numbersToAdd) {
            // Basic validation, can be improved
            if (num.length > 10) { // Simple check for a reasonable length
                validNumbers.push(num);
            } else {
                invalidNumbers.push(num.replace('@c.us', ''));
            }
        }

        if (invalidNumbers.length > 0) {
            message.reply(`The following numbers seem invalid: ${invalidNumbers.join(', ')}`);
        }

        if (validNumbers.length === 0) {
            return message.reply('No valid numbers provided to add.');
        }

        try {
            const result = await chat.addParticipants(validNumbers);
            // result object structure:
            // {
            //   "status": 207, (HTTP status code, 207 means Multi-Status)
            //   "participants": {
            //     "number@c.us": {
            //       "code": 200, (Success)
            //       "message": "Not an error",
            //       "invite_code": null,
            //       "invite_code_exp": null
            //     },
            //     "anothernumber@c.us": {
            //       "code": 403, (Forbidden - e.g., user already in group, or privacy settings)
            //       "message": "User is already in group",
            //       ...
            //     }
            //   }
            // }
            // Or if all successful, might be a simpler success message or code.
            // If a single number fails, it might throw an error or return a specific status.

            let successReply = 'Addition results:\n';
            let someFailed = false;
            let allFailed = true;

            if (typeof result === 'object' && result.participants) { // Check for multi-status response
                 for (const num in result.participants) {
                    const res = result.participants[num];
                    const userNum = num.replace('@c.us', '');
                    if (res.code === 200) {
                        successReply += `✅ Successfully added ${userNum}\n`;
                        allFailed = false;
                    } else {
                        successReply += `❌ Failed to add ${userNum}: ${res.message || `Error code ${res.code}`}\n`;
                        someFailed = true;
                    }
                }
            } else if (typeof result === 'object' && result[validNumbers[0]]?.code === 200) { // Single add success (older wwebjs versions?)
                 successReply += `✅ Successfully added ${validNumbers[0].replace('@c.us', '')}\n`;
                 allFailed = false;
            } else if (result === true || (typeof result === 'object' && Object.values(result).every(status => status === "OK" || status === 200))) { // Generic success
                successReply = `✅ Successfully added: ${validNumbers.map(n => n.replace('@c.us', '')).join(', ')}`;
                allFailed = false;
            }
             else { // Generic failure or unexpected result
                console.error("Add participants result:", result);
                successReply = `⚠️ Could not add all participants. Some may have failed due to privacy settings, already being in the group, or other issues.`;
                someFailed = true; // Assume some failed if result is not clearly success
            }

            if (allFailed && validNumbers.length > 0) {
                 message.reply(`Failed to add any of the provided numbers. They might already be in the group, have privacy settings preventing adds, or the numbers are invalid.`);
            } else {
                 message.reply(successReply);
            }

        } catch (error) {
            console.error('Error adding participants:', error);
            message.reply(`An error occurred while trying to add participants: ${error.message}`);
        }
    },
};
