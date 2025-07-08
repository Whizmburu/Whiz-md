// Command Handler for WHIZ-MD Bot
const fs = require('fs');
const path = require('path');
const config = require('../config');

const commands = new Map();
const commandFiles = fs.readdirSync(path.join(__dirname, '../commands')).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    try {
        const command = require(`../commands/${file}`);
        if (command.name && command.execute) {
            commands.set(command.name, command);
            if (command.aliases && Array.isArray(command.aliases)) {
                command.aliases.forEach(alias => commands.set(alias, command));
            }
        } else {
            console.warn(`Warning: Command file ${file} is missing 'name' or 'execute' property.`);
        }
    } catch (error) {
        console.error(`Error loading command from file ${file}:`, error);
    }
}

console.log(`Loaded ${commands.size} commands/aliases.`);

async function handleMessage(client, message) {
    const body = message.body;
    if (!body || !body.startsWith(config.prefix)) return;

    const args = body.slice(config.prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    const command = commands.get(commandName);

    if (!command) {
        // Optional: reply if command is not found
        // message.reply(`Command not found: ${commandName}`);
        return;
    }

    // Permission checks (e.g., ownerOnly, groupAdminOnly) can be added here
    if (command.ownerOnly && message.from !== `${config.ownerNumber}@c.us` && message.author !== `${config.ownerNumber}@c.us`) {
         // If message is from a group, message.author will be the sender. If PM, message.from.
        const senderId = message.author || message.from;
        if (senderId !== `${config.ownerNumber}@c.us`) {
            return message.reply('This command can only be used by the bot owner.');
        }
    }

    // Example for group admin check (requires more context if command is group specific)
    // if (command.groupAdminOnly) {
    //     const chat = await message.getChat();
    //     if (chat.isGroup) {
    //         const participant = chat.participants.find(p => p.id._serialized === (message.author || message.from));
    //         if (!participant || !participant.isAdmin) {
    //             return message.reply('This command can only be used by group admins.');
    //         }
    //     } else {
    //         return message.reply('This command can only be used in a group.');
    //     }
    // }


    try {
        await command.execute(client, message, args);
    } catch (error) {
        console.error(`Error executing command ${commandName}:`, error);
        message.reply(`An error occurred while trying to execute that command: ${error.message}`);
    }
}

module.exports = {
    handleMessage,
    commands // Expose commands map if needed elsewhere
};
