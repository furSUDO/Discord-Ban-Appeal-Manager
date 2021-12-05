require('dotenv').config();
const mysql = require('mysql2');
const fs = require('fs');
const { Client, Collection } = require('discord.js');
const client = new Client({ intents: ['GUILDS', 'GUILD_MEMBERS', 'GUILD_BANS', 'GUILD_INTEGRATIONS', 'GUILD_INVITES', 'GUILD_MESSAGES', 'DIRECT_MESSAGES'] });
client.commands = new Collection();
const con = mysql.createConnection({
	host:process.env.SQL_HOST,
	user:process.env.SQL_USER,
	password:process.env.SQL_PASSWORD,
	database:process.env.SQL_DATABASE,
});
con.connect(function(err) {
	// Slash Commands Handling
	const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
	for (const file of commandFiles) {
		const command = require(`./commands/${file}`);
		// Set a new item in the Collection
		// With the key as the command name and the value as the exported module
		client.commands.set(command.data.name, command);
	}
	// Event Handling
	const eventFiles = fs.readdirSync('./events').filter(file => file.endsWith('.js'));
	for (const file of eventFiles) {
		const event = require(`./events/${file}`);
		if (event.once) {
			client.once(event.name, (...args) => event.execute(...args, client, con));
		}
		else {
			client.on(event.name, (...args) => event.execute(...args, client, con));
		}
	}

	if (err) throw err;
	client.on('interactionCreate', async interaction => {
		if (!interaction.isCommand()) return;

		const command = client.commands.get(interaction.commandName);

		if (!command) return;

		try {
			await command.execute(client, interaction, con);
		}
		catch (error) {
			console.error(error);
			await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
		}
	});
	console.log('Connected!');
	// Login
	client.login(process.env.DISCORD_TOKEN);
});
