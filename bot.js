//Dev branch
//Required Stuff
const mysql = require('mysql');
const fs = require('fs');
const {Client} = require('discord.js');
const Discord = require('discord.js');
const client = new Client({intents:['GUILDS','GUILD_MEMBERS','GUILD_BANS','GUILD_INTEGRATIONS','GUILD_INVITES','GUILD_MESSAGES','DIRECT_MESSAGES']});
const wait = require('util').promisify(setTimeout);
const {prefix, token, sqlHost, sqlUser, sqlPassword} = require('./config.json');

//establish DB connection
const con = mysql.createConnection({
	host:sqlHost,
	user:sqlUser,
	password:sqlPassword,
	database:'DBAM'
});

//Cooldowns and commands collections
client.commands = new Discord.Collection();
client.cooldowns = new Discord.Collection();

//Command Handler
const commandFolders = fs.readdirSync('./commands');
for (const folder of commandFolders) {
	const commandFiles = fs.readdirSync(`./commands/${folder}`).filter(file => file.endsWith('.js'));
	for (const file of commandFiles) {
		const command = require(`./commands/${folder}/${file}`);
		client.commands.set(command.name, command);
	}
}


//connects to DB
con.connect(function(err) {
	if (err) throw err;
	//Event Handler
	const eventFiles = fs.readdirSync('./events').filter(file => file.endsWith('.js'));
	for (const file of eventFiles) {
		const event = require(`./events/${file}`);
		if (event.once) {
			client.once(event.name, (...args) => event.execute(...args, client, con));
		} else {
			client.on(event.name, (...args) => event.execute(...args, client, con));
		}
	}
	

	//message event
	client.on('message', async message => {
		if (!message.content.startsWith(prefix) || message.author.bot) return;
		const args = message.content.slice(prefix.length).trim().split(/ +/);
		const commandName = args.shift().toLowerCase();

		const command = client.commands.get(commandName)
			|| client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));

		if (!command) return;

		if (command.guildOnly && message.channel.type === 'dm') {
			return message.reply('I can\'t execute that command inside DMs!');
		}

		if (command.permissions) {
			const authorPerms = message.channel.permissionsFor(message.author);
			if (!authorPerms || !authorPerms.has(command.permissions)) {
				return message.reply('You cannot use that!');
			}
		}

		if (command.args && !args.length) {
			let reply = `You didn't provide any arguments, ${message.author}!`;

			if (command.usage) {
				reply += `\nThe proper usage would be: \`${prefix}${command.name} ${command.usage}\``;
			}

			return message.channel.send(reply);
		}

		const { cooldowns } = client;

		if (!cooldowns.has(command.name)) {
			cooldowns.set(command.name, new Discord.Collection());
		}

		const now = Date.now();
		const timestamps = cooldowns.get(command.name);
		const cooldownAmount = (command.cooldown || 3) * 1000;

		if (timestamps.has(message.author.id)) {
			const expirationTime = timestamps.get(message.author.id) + cooldownAmount;

			if (now < expirationTime) {
				const timeLeft = (expirationTime - now) / 1000;
				return message.reply(`please wait ${timeLeft.toFixed(1)} more second(s) before reusing the \`${command.name}\` command.`);
			}
		}

		timestamps.set(message.author.id, now);
		setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);

		try {
			command.execute(client, message, args, con);
		} catch (error) {
			console.error(error);
			message.reply('There was an error trying to execute that command!');
		}
	});

	console.log("Connected!");
});


client.login(token);
