const axios = require('axios');

// Helper to format date nicely
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    try {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric'
        });
    } catch (e) {
        return dateString; // Return original if parsing fails
    }
}

async function handleGithubCommand(msg, args, client, theme, botPrefix) {
    const query = args.join(' ');
    if (!query) {
        await msg.reply(theme.messages.githubCmd.noQuery.replace('{prefix}', botPrefix));
        return;
    }

    const chat = await msg.getChat();
    await chat.sendStateTyping();

    try {
        if (query.includes('/')) { // Likely a repository: username/repo
            const [owner, repo] = query.split('/');
            if (!owner || !repo) {
                await msg.reply(theme.messages.githubCmd.notFound.replace('{query}', query) + " (Invalid repo format. Use owner/repo).");
                await chat.clearState();
                return;
            }
            await msg.reply(theme.messages.githubCmd.loadingRepo.replace('{repo}', query));
            const repoUrl = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`;
            const response = await axios.get(repoUrl, { timeout: 8000 });

            if (response.data) {
                const data = response.data;
                const repoInfo = theme.messages.githubCmd.repoInfo
                    .replace('{full_name}', data.full_name || 'N/A')
                    .replace('{description}', data.description || 'No description.')
                    .replace('{stargazers_count}', data.stargazers_count !== undefined ? data.stargazers_count : 'N/A')
                    .replace('{forks_count}', data.forks_count !== undefined ? data.forks_count : 'N/A')
                    .replace('{watchers_count}', data.watchers_count !== undefined ? data.watchers_count : 'N/A')
                    .replace('{language}', data.language || 'N/A')
                    .replace('{pushed_at}', formatDate(data.pushed_at))
                    .replace('{html_url}', data.html_url || 'N/A');

                // Try to get owner's avatar for the repo message if possible (optional enhancement)
                // const ownerAvatarUrl = data.owner && data.owner.avatar_url ? data.owner.avatar_url : null;
                // if (ownerAvatarUrl) { ... send with media ... } else { await msg.reply(repoInfo); }
                await msg.reply(repoInfo);

            } else {
                await msg.reply(theme.messages.githubCmd.notFound.replace('{query}', query));
            }

        } else { // Likely a username
            await msg.reply(theme.messages.githubCmd.loadingUser.replace('{username}', query));
            const userUrl = `https://api.github.com/users/${encodeURIComponent(query)}`;
            const response = await axios.get(userUrl, { timeout: 8000 });

            if (response.data) {
                const data = response.data;
                const userInfo = theme.messages.githubCmd.userInfo
                    .replace('{name}', data.name || 'N/A')
                    .replace('{login}', data.login || 'N/A')
                    .replace('{bio}', data.bio || 'No bio.')
                    .replace('{followers}', data.followers !== undefined ? data.followers : 'N/A')
                    .replace('{following}', data.following !== undefined ? data.following : 'N/A')
                    .replace('{public_repos}', data.public_repos !== undefined ? data.public_repos : 'N/A')
                    .replace('{html_url}', data.html_url || 'N/A');

                // Send with profile picture if available
                if (data.avatar_url) {
                    try {
                        const pfpResponse = await axios.get(data.avatar_url, { responseType: 'arraybuffer' });
                        const pfpBuffer = Buffer.from(pfpResponse.data, 'binary');
                        const { MessageMedia } = require('whatsapp-web.js'); // Local import
                        const profilePicMedia = new MessageMedia('image/jpeg', pfpBuffer.toString('base64'), 'github_profile.jpg');
                        await client.sendMessage(msg.from, profilePicMedia, { caption: userInfo });
                    } catch (pfpError) {
                        console.warn(`Could not fetch GitHub avatar for ${data.login}: ${pfpError.message}`);
                        await msg.reply(userInfo); // Send text info even if PFP fails
                    }
                } else {
                    await msg.reply(userInfo);
                }
            } else {
                await msg.reply(theme.messages.githubCmd.notFound.replace('{query}', query));
            }
        }
        await chat.clearState();

    } catch (error) {
        console.error(`Error in .github command for "${query}":`, error.message);
        if (error.response && error.response.status === 404) {
            await msg.reply(theme.messages.githubCmd.notFound.replace('{query}', query));
        } else if (error.response && error.response.data && error.response.data.message) {
            await msg.reply(theme.messages.githubCmd.apiError + ` (API: ${error.response.data.message})`);
        }
        else {
            await msg.reply(theme.messages.githubCmd.apiError);
        }
        await chat.clearState();
    }
}

module.exports = {
    handleGithubCommand
};
