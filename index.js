const { Client, GatewayIntentBits, REST, Routes } = require('discord.js');
const { token, clientId, guilds } = require('./config.json');
const commands = require('./path-to-your-module'); // Replace with the path to your module

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const commandsData = [];
commandsData.push(commands.data.toJSON());

const registerCommands = async () => {
    try {
        console.log('Started refreshing application (/) commands.');

        const rest = new REST({ version: '10' }).setToken(token);

        for (const gid of guilds) {
            await rest.put(
                Routes.applicationGuildCommands(clientId, gid),
                { body: commandsData }
            );
            console.log(`Commands registered for guild: ${gid}`);
        }

        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error);
    }
};

client.once('ready', () => {
    console.log('Bot is online!');
    registerCommands();
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()) return;

    const { commandName } = interaction;

    if (commandName === 'vote') {
        await commands.execute(interaction);
    }
});

client.login(token);
