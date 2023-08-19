const fs = require('fs');
const { SlashCommandBuilder } = require('discord.js');
const voteOptions = require('./voteOptions.json');

// Functions to read and write the JSON file
function readJSONFile(filePath) {
    return new Promise((resolve, reject) => {
        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) {
                if (err.code === 'ENOENT') {
                    // Create an empty JSON file if it doesn't exist
                    fs.writeFile(filePath, JSON.stringify({}), 'utf8', (err) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve({});
                        }
                    });
                } else {
                    reject(err);
                }
            } else {
                resolve(JSON.parse(data));
            }
        });
    });
}

function writeJSONFile(filePath, data) {
    return new Promise((resolve, reject) => {
        fs.writeFile(filePath, JSON.stringify(data), 'utf8', (err) => {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
}

const votesFilePath = './votes.json';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('vote')
        .setDescription('Vote for the current event')
        .addStringOption((option) =>
            option
                .setName('chart')
                .setDescription('The chart you want to vote on')
                .addChoices(voteOptions.charts)
        )
        .addStringOption((option) =>
            option
                .setName('addorremove')
                .setDescription('Add or remove your vote')
                .addChoices([
                    { name: 'add', value: 'add' },
                    { name: 'remove', value: 'remove' }
                ])
        ),

    async execute(interaction) {
        const userId = interaction.user.id;
        const guildId = interaction.guild.id;

        try {
            const vote = interaction.options.getString('chart');

            if (!vote) {
                const votes = await readJSONFile(votesFilePath);
                const userVotes = votes[guildId] && votes[guildId][userId];

                if (!userVotes) {
                    return await interaction.reply({
                        content: 'You have not voted for any charts yet.',
                        ephemeral: true,
                    });
                } else {
                    const voteList = [];
                    for (const prefix in userVotes) {
                        if (userVotes[prefix].length > 0) {
                            voteList.push(`${prefix}: ${userVotes[prefix].join(', ')}`);
                        }
                    }
                    return await interaction.reply({
                        content: `Your current votes are: ${voteList.join(' | ')}`,
                        ephemeral: true,
                    });
                }
            }

            const addorremove = interaction.options.getString('addorremove') || 'add';
            const votes = await readJSONFile(votesFilePath);
            if (!votes[guildId]) votes[guildId] = {};
            if (!votes[guildId][userId]) votes[guildId][userId] = { M: [], S: [] };

            const userVotes = votes[guildId][userId];
            const prefix = vote[0];

            if (addorremove === 'add') {
                if (userVotes[prefix].length >= 2) {
                    return await interaction.reply({
                        content: `You have already voted for ${userVotes[prefix].join(', ')}. You may only vote for 2 charts per category.`,
                        ephemeral: true,
                    });
                }

                if (!userVotes[prefix].includes(vote)) {
                    userVotes[prefix].push(vote);
                }

                await interaction.reply({
                    content: `Your vote for ${vote} has been added.`,
                    ephemeral: true,
                });
            } else {
                const index = userVotes[prefix].indexOf(vote);

                if (index !== -1) {
                    userVotes[prefix].splice(index, 1);
                    await interaction.reply({
                        content: `Your vote for ${vote} has been removed.`,
                        ephemeral: true,
                    });
                } else {
                    await interaction.reply({
                        content: `You haven't voted for ${vote}.`,
                        ephemeral: true,
                    });
                }
            }

            await writeJSONFile(votesFilePath, votes);
        } catch (err) {
            console.error(err);
            await interaction.reply({
                content: 'There was an error while executing this command!',
                ephemeral: true,
            });
        }
    },
};
