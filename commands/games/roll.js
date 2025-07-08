// Simple dice notation parser: XdY+Z or XdY-Z
// X: number of dice (optional, default 1)
// Y: number of sides per die (required)
// Z: modifier (optional, default 0)
function parseDiceNotation(notation) {
    notation = notation.toLowerCase().trim();
    if (!notation) return { count: 1, sides: 6, modifier: 0, error: null }; // Default to 1d6

    const match = notation.match(/^(?:(\d+)d)?(\d+)(?:([+-])(\d+))?$/);
    if (!match) {
        return { error: "Invalid dice notation. Use format like '2d6', 'd20', '1d10+5'." };
    }

    const count = match[1] ? parseInt(match[1]) : 1;
    const sides = parseInt(match[2]);
    const sign = match[3];
    const modValue = match[4] ? parseInt(match[4]) : 0;
    const modifier = sign === '-' ? -modValue : modValue;

    if (sides < 2) return { error: "Dice must have at least 2 sides." };
    if (count < 1) return { error: "Must roll at least 1 die." };
    if (count > 100) return { error: "Cannot roll more than 100 dice at once." }; // Limit
    if (sides > 1000) return { error: "Dice cannot have more than 1000 sides." }; // Limit

    return { count, sides, modifier, error: null };
}

function rollDie(sides) {
    return Math.floor(Math.random() * sides) + 1;
}

async function handleRollCommand(msg, args, client, theme, botPrefix) {
    const notation = args.join('') || '1d6'; // Default to 1d6 if no args

    const parsed = parseDiceNotation(notation);

    if (parsed.error) {
        await msg.reply(`⚠️ ${parsed.error}`);
        return;
    }

    const { count, sides, modifier } = parsed;
    const rolls = [];
    let sum = 0;

    for (let i = 0; i < count; i++) {
        const roll = rollDie(sides);
        rolls.push(roll);
        sum += roll;
    }
    sum += modifier;

    const rollsString = rolls.join(', ');
    let resultMessage = theme.messages.rollCommand.result
        .replace('{rolls}', rollsString)
        .replace('{total}', sum);

    if (count > 1 || modifier !== 0) { // Only show individual rolls if more than one or if there's a modifier that makes total different
        // The default theme message already includes both rolls and total
    } else if (count === 1 && modifier === 0) {
        resultMessage = `🎲 You rolled: ${sum}`; // Simpler message for single die, no mod
    }


    await msg.reply(resultMessage);
}

module.exports = {
    handleRollCommand
};
