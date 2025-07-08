const axios = require('axios');

async function handleNpmCommand(msg, args, client, theme, botPrefix) {
    const packageName = args.join(' '); // Allows for scoped packages like @org/package
    if (!packageName) {
        await msg.reply(theme.messages.npmCmd.noPackage.replace('{prefix}', botPrefix));
        return;
    }

    const chat = await msg.getChat();
    await chat.sendStateTyping();

    try {
        await msg.reply(theme.messages.npmCmd.loading.replace('{packageName}', packageName));

        // NPM registry API URL needs URL encoding for the package name, especially for scoped packages
        const apiUrl = `https://registry.npmjs.org/${encodeURIComponent(packageName)}`;
        const response = await axios.get(apiUrl, { timeout: 8000 });

        if (response.data) {
            const data = response.data;
            const latestVersion = data['dist-tags'] ? data['dist-tags'].latest : 'N/A';
            const description = data.description || 'No description.';
            // Author can be an object or string
            let authorName = 'N/A';
            if (data.author) {
                authorName = typeof data.author === 'string' ? data.author : (data.author.name || 'N/A');
            } else if (data.maintainers && data.maintainers.length > 0) {
                authorName = data.maintainers.map(m => m.name).join(', ');
            }

            const license = data.license || 'N/A';
            const homepage = data.homepage || `https://www.npmjs.com/package/${data.name}`; // Fallback to npm page
            const npmLink = `https://www.npmjs.com/package/${data.name}`;

            const packageInfoMsg = theme.messages.npmCmd.packageInfo
                .replace(/{name}/g, data.name || packageName) // Use data.name if available, else original query
                .replace('{version}', latestVersion)
                .replace('{description}', description)
                .replace('{author}', authorName)
                .replace('{license}', license)
                .replace('{homepage}', homepage)
                .replace('{npmLink}', npmLink); // Though npmLink is already in the default theme message

            await msg.reply(packageInfoMsg);
        } else {
            // This case might not be hit if axios throws for 404
            await msg.reply(theme.messages.npmCmd.notFound.replace('{packageName}', packageName));
        }
        await chat.clearState();

    } catch (error) {
        console.error(`Error in .npm command for "${packageName}":`, error.message);
        if (error.response && error.response.status === 404) {
            await msg.reply(theme.messages.npmCmd.notFound.replace('{packageName}', packageName));
        } else if (error.response && error.response.data && (error.response.data.error || error.response.data.reason)) {
            const apiErrorMsg = error.response.data.error || error.response.data.reason;
            await msg.reply(theme.messages.npmCmd.apiError + ` (API: ${apiErrorMsg})`);
        }
        else {
            await msg.reply(theme.messages.npmCmd.apiError);
        }
        await chat.clearState();
    }
}

module.exports = {
    handleNpmCommand
};
