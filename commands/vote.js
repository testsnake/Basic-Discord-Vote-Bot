const fs = require('fs');
const { SlashCommandBuilder, SlashCommandSubcommandBuilder } = require('discord.js');


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

// Define the votes file path
const votesFilePath = './votes.json';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('vote')
        .setDescription('vote for the current event')
        .setDescription('vote for the current event')
        .setDescriptionLocalizations({
            de: 'Stimmen Sie für das aktuelle Ereignis ab',
            'en-GB': 'vote for the current event',
            'en-US': 'vote for the current event',
            'es-ES': 'vota por el evento actual',
            fr: 'votez pour l\'événement en cours',
            nl: 'stem voor het huidige evenement',
            'pt-BR': 'vote para o evento atual',
            'zh-CN': '为当前事件投票',
            ja: '現在のイベントに投票する',
            'zh-TW': '為當前事件投票',
            ko: '현재 이벤트에 투표하십시오',
        })
        .addStringOption((option) =>
            option
                .setName('chart')
                .setDescription('the chart you want to vote on')
                .setChoices(
                    { name: '[C47] Puppet Theater of Twee-Box / トゥイー・ボックスの人形劇場', value: 'C9547' },
                    { name: '[C48] phony / フォニイ', value: 'C9548' },
                    { name: '[C49] Erai Erai Erai! / エライエライエライ！', value: 'C9549' },
                    { name: '[C50] Hitogawari / ヒトガワリ', value: 'C9550' },
                    { name: '[C51] Agatha\'s Revenge', value: 'C9551' },
                    { name: '[C52] Romance / 大正浪漫', value: 'C9552' },
                    { name: '[C53] Crazy Clown / クレイヂィ・クラウン', value: 'C9553' },
                    { name: '[C54] Yaminabe!/ ヤミナベ!', value: 'C9554' },
                    { name: '[C55] Ah, It\'s a Wonderful Cat Life / 嗚呼、素晴らしきニャン生', value: 'C9555' },
                    { name: '[C56] Crazy Beat / クレイジー・ビート', value: 'C9556' }
                ))

        .addStringOption((option) =>
            option
                .setName('addorremove')
                .setDescription('add or remove your vote')
                .addChoices(
                    { name: 'add', value: 'add' },
                    { name: 'remove', value: 'remove' },
                )
        ),

    async execute(interaction) {
        const userId = interaction.user.id;
        try {
            const vote = interaction.options.getString('chart');

            if (!vote) {
                // Return votes
                const votes = await readJSONFile(votesFilePath);
                if (!votes[userId]) {
                    return await interaction.reply({
                        content: 'You have not voted for any charts yet.',
                        ephemeral: true,
                    });
                } else {
                    const userVotes = votes[userId];
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

            // Read votes from the JSON file
            const votes = await readJSONFile(votesFilePath);

            // Initialize user's votes if not already in the database
            if (!votes[userId]) {
                votes[userId] = {
                    C: []
                };
            }

            const userVotes = votes[userId];
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

            // Save the updated votes to the JSON file
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


