//Dev branch
//Required Stuff
const fs = require('fs');
const { Client } = require('discord.js');
const Discord = require('discord.js');
const client = new Client({ ws: { intents: ['GUILDS', 'GUILD_MESSAGES', 'GUILD_MEMBERS', 'GUILD_MESSAGE_REACTIONS'] } });
const { prefix, token, appealID, masterID, masterInvite } = require('./config.json');
const wait = require('util').promisify(setTimeout);

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



//Event Handler
const eventFiles = fs.readdirSync('./events').filter(file => file.endsWith('.js'));
for (const file of eventFiles) {
	const event = require(`./events/${file}`);
	if (event.once) {
		client.once(event.name, (...args) => event.execute(...args, client));
	} else {
		client.on(event.name, (...args) => event.execute(...args, client));
	}
}


client.on("guildMemberAdd", async (member) => {
	//fetch ban state from master Server
	if (member.guild.id === appealID) {
		const masterGuild = client.guilds.cache.find(guilds => guilds.id === masterID);
		masterGuild.fetchBan(member).then(memberState => {
			if (!memberState.user.bot) {
				let caseCategory = member.guild.channels.cache.find(c => c.name === "Open Cases")
    			let appealManager = member.guild.roles.cache.find(r => r.name === "Appeal Manager")
    			member.guild.channels.create(`case #${member.id}`, {
        			parent: caseCategory,
        			permissionOverwrites: [{
        	    		id: member.guild.roles.everyone.id,
        	    		deny: ['VIEW_CHANNEL'],
        			},{
        	    		id: member.id,
        	    		allow: ['VIEW_CHANNEL'],
        			},{
        	    		id: appealManager,
        	    		allow: ['VIEW_CHANNEL'],
        			}],
					rateLimitPerUser:60,
					topic:`${member.id}`
    			}).then(caseChannel => {
        			member.client.api.channels(caseChannel.id).messages.post({
        	    		data: {
        	        		embed: {
        	            		color: 3092790,
        	            		title: `Ban Appeal for ${member.displayName}`,
        	            		description: `Hi there ${member.displayName}\nPlease substanciate why you should be unbanned.\nAn <@&${appealManager.id}> will be here shortly.`,
        	            		image:{url:'https://cdn.discordapp.com/attachments/756644176795533334/847276996564353054/Embed_width.png'} ,
        	        		},
        	    		},
        			});
    			})
			}
		}).catch(async error => {
			if (error.httpStatus = 404) {
				await member.send(`You Aren't banned from ${masterGuild.name}\nMain server: ${masterInvite}`)
            	member.kick();
			}
		})
	}
});

client.on('message', message => {
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
			return message.reply('You can not do this!');
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
		command.execute(client, message, args, appealID, masterID, masterInvite);
	} catch (error) {
		console.error(error);
		message.reply('there was an error trying to execute that command!');
	}
});

client.login(token);