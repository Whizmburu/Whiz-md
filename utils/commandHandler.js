// Command Handler for WHIZ-MD Bot
const fs = require('fs');
const path = require('path');
const config = require('../config');

const commands = new Map();
let totalCommandsLoaded = 0;
let totalAliasesLoaded = 0;

function loadCommandsRecursive(directory) {
    const entries = fs.readdirSync(directory, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(directory, entry.name);
        if (entry.isDirectory()) {
            loadCommandsRecursive(fullPath);
        } else if (entry.isFile() && entry.name.endsWith('.js')) {
            try {
                const command = require(fullPath);
                if (command.name && command.execute) {
                    if(commands.has(command.name)) {
                        console.warn(`[COMMAND_HANDLER] Warning: Duplicate command name '${command.name}' from file ${entry.name}. Previous one will be overwritten.`);
                    }
                    commands.set(command.name, command);
                    totalCommandsLoaded++;
                    if (command.aliases && Array.isArray(command.aliases)) {
                        command.aliases.forEach(alias => {
                            if(commands.has(alias)) {
                                console.warn(`[COMMAND_HANDLER] Warning: Alias '${alias}' for command '${command.name}' (from ${entry.name}) conflicts with an existing command or alias. Previous one will be overwritten.`);
                            }
                            commands.set(alias, command);
                            totalAliasesLoaded++;
                        });
                    }
                } else {
                    console.warn(`[COMMAND_HANDLER] Warning: Command file ${entry.name} at ${fullPath} is missing 'name' or 'execute' property.`);
                }
            } catch (error) {
                console.error(`[COMMAND_HANDLER] Error loading command from file ${entry.name} at ${fullPath}:`, error);
            }
        }
    }
}

// Load commands from all subdirectories within 'commands'
const commandsBaseDir = path.join(__dirname, '../commands');
loadCommandsRecursive(commandsBaseDir);

console.log(`[COMMAND_HANDLER] Loaded ${totalCommandsLoaded} commands with ${totalAliasesLoaded} aliases. Total map size: ${commands.size}.`);

async function handleMessage(client, message) {
    console.log(`[COMMAND_HANDLER] handleMessage called with body: "${message.body}"`);
    const body = message.body;

    if (!body || typeof body !== 'string' || !body.startsWith(config.prefix)) {
        // console.log(`[COMMAND_HANDLER] Message does not start with prefix or body is invalid. Prefix: '${config.prefix}', Body: '${body}'`);
        return;
    }

    const args = body.slice(config.prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    const command = commands.get(commandName);

    if (!command) {
        console.log(`[COMMAND_HANDLER] Command not found for: "${commandName}" (Full map size: ${commands.size})`);
        // Optional: reply if command is not found
        // message.reply(`Command not found: ${commandName}`);
        return;
    }
    console.log(`[COMMAND_HANDLER] Command "${command.name}" found for "${commandName}". Executing...`);

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
