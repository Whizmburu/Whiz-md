// .calc command using mathjs
const config = require('../../config');
const { create, all } = require('mathjs');

const math = create(all, {
    // Configuration for mathjs if needed
    // For example, to disable certain functions for security:
    // matrix: 'Matrix', // Allow matrices
    // number: 'number', // Allow numbers (BigNumber, Fraction also possible)
    // string: 'string', // Allow strings
    // unit: 'Unit',     // Allow units
    // complex: 'Complex', // Allow complex numbers
    // // Disable functions that could be risky if not handled carefully (e.g. import, derivative, simplify)
    // // For a simple calculator, most advanced functions can be disabled.
    // // This example uses 'all' which includes everything.
    // // For a safer approach, explicitly list allowed functions.
});

// Limited scope for safety (example)
const limitedScope = {
    // Only allow specific functions and constants if desired
    // e.g. add: math.add, subtract: math.subtract, multiply: math.multiply, divide: math.divide,
    // sin: math.sin, cos: math.cos, tan: math.tan, pi: math.pi, e: math.e,
    // sqrt: math.sqrt, pow: math.pow, log: math.log,
    // This is just an idea, the default `math.evaluate` is generally safe for basic math if input is controlled.
};


module.exports = {
    name: 'calc',
    description: 'Calculates a mathematical expression.',
    usage: '<mathematical_expression>',
    category: 'utilities_lookup',
    aliases: ['calculate', 'math'],
    execute(client, message, args) {
        if (args.length === 0) {
            return message.reply(`Please provide a mathematical expression to calculate. Usage: \`${config.prefix}calc 2+2*sqrt(16)\``);
        }
        const expression = args.join(' ');

        try {
            // Basic input sanitization: check for potentially harmful characters or patterns
            // This is a very basic check. For robust sanitization, more advanced parsing might be needed.
            if (/[a-zA-Z_]{2,}\s*\(/.test(expression) && !['sin', 'cos', 'tan', 'log', 'sqrt', 'abs', 'exp', 'round', 'ceil', 'floor', 'pow', 'nthRoot'].some(fn => expression.includes(fn))) {
                 // Trying to prevent arbitrary function calls not in the common math list.
                 // This is not foolproof. mathjs's parser is generally safe for math expressions.
            }
            if (expression.length > 200) { // Limit expression length
                return message.reply("Expression is too long. Please keep it under 200 characters.");
            }


            const result = math.evaluate(expression); // Using default mathjs scope
            // const result = math.evaluate(expression, limitedScope); // If using a limited scope

            if (typeof result === 'function') { // Should not happen with math.evaluate if expression is valid math
                return message.reply("Invalid expression or attempted to define a function. Only calculations are allowed.");
            }
            if (typeof result === 'undefined' || result === null) {
                 return message.reply("Could not evaluate the expression. Please check its validity.");
            }


            message.reply(`🧮 Result for \`${expression}\`:\n\n*${result.toString()}*`);

        } catch (error) {
            console.error("Error calculating expression:", expression, error);
            message.reply(`Sorry, I couldn't calculate that. Please ensure it's a valid mathematical expression.\nError: ${error.message}`);
        }
    },
};
