/* eslint-disable max-nested-callbacks */
const { SlashCommandBuilder } = require('@discordjs/builders');
const requiredUserPermissions = ['MANAGE_MESSAGES'];
module.exports = {
	data: new SlashCommandBuilder()
		.setName('init')
		.setDescription('Initial setup of appeal server.'),
	async execute(client, interaction, con) {
		await interaction.deferReply({ ephemeral: true });
		// Check if server is in Database
		const sql = `SELECT * FROM servers WHERE serverID = ${interaction.guild.id}`;
		con.query(sql, function(err, res1) {
			// Check if server is linked
			if (res1.length !== 0) {
				// Fetch parent and appeal IDs from Database
				const sql2 = `SELECT * FROM linkedservers WHERE parentServer = '${interaction.guild.id}' OR appealServer = '${interaction.guild.id}'`;
				con.query(sql2, async function(err, res2) {
					if (res2.length !== 0) {
						if (!interaction.member.permissions.has(requiredUserPermissions)) {
							interaction.editReply({
								embeds: [{
									color: 3092790,
									title: 'Invalid Permissions',
									description: 'You do not have the permissions required to run this command!',
									fields: [{ name: 'Required Permissions', value: `${requiredUserPermissions}` }],
									image: { url: 'https://cdn.discordapp.com/attachments/756644176795533334/847276996564353054/Embed_width.png' },
									timestamp: new Date(),
									footer: { text: 'Discord Ban Appeal Manager', icon_url: interaction.client.user.avatarURL({ dynamic: true }) },
								}], ephemeral: true,
							});
							return;
						}
						if (res2[0].appealServer === interaction.guild.id) {
							if (!(interaction.guild.me.permissions.has(['MANAGE_CHANNELS', 'MANAGE_ROLES', 'MANAGE_GUILD', 'BAN_MEMBERS', 'KICK_MEMBERS', 'MANAGE_MESSAGES', 'CREATE_INSTANT_INVITE']))) {
								interaction.editReply({
									embeds: [{
										color: 15088700,
										title:'<:warning:847479424583729213> WARNING <:warning:847479424583729213>',
										description:'Please make sure I have all of the following permissions enabled:',
										image:{ url:'https://media.discordapp.net/attachments/756644176795533334/910842822603730944/DBAM_REQUIRED_PERMISSION_SCOPE.png' },
									}],
								});
								return;
							}
							if (interaction.guild.roles.highest.position > interaction.guild.me.roles.botRole.position) {
								interaction.editReply({
									embeds: [{
										color: 15088700,
										title:'<:warning:847479424583729213> WARNING <:warning:847479424583729213>',
										description:'Please make sure I have the top-most role in the role hierarchy!',
										image:{ url:'https://cdn.discordapp.com/attachments/756644176795533334/858372642468528148/unknown.png' },
									}],
								}).catch(e => {});
								return;
							}
							// interaction.editReply({embeds: [{color: 4437377,title:`<:verified:847476592837263361> Sucsessfully linked`}],})
							// cleans server
							const botRole = interaction.guild.me.roles.botRole.name;
							const everyoneRole = interaction.guild.roles.everyone;
							await interaction.guild.channels.cache.filter(channel => channel.name !== 'welcome').filter(channel => channel.name !== 'logs').filter(channel => channel.name !== 'invite').each(channel => channel.delete());
							await interaction.guild.roles.cache.filter(role => role.name !== botRole).filter(role => role.name !== everyoneRole.name).each(role => role.delete());
							// Creates Appeal Manager Role
							const appealManager = interaction.guild.roles.create({
								name: 'Appeal Manager',
								permissions: ['MANAGE_MESSAGES', 'KICK_MEMBERS'],
								color: 'RED',
								hoist: true,
								mentionable: true,
								reason: 'we needed a role for Super Cool People',
							}).catch(error => {});
							// Checks for pre-existing
							const welcomeChannelState = interaction.guild.channels.cache.find(cn => cn.name === 'welcome');
							if ((typeof welcomeChannelState === 'undefined')) {

								// Creates Welcome Channel
								const welcomeChannel = interaction.guild.channels.create('welcome', {
									type: 'text',
									permissionOverwrites: [
										{ id:everyoneRole.id, deny:['SEND_MESSAGES'] },
										{ id:interaction.guild.me.id, allow: ['SEND_MESSAGES'] },
									],
									position:0,
									reason: 'New channel added for welcome message' },
								).catch(error => {});

								// Creates Invite Channel
								appealManager.then(appealManager => {
									const inviteChannel = interaction.guild.channels.create('invite', {
										type: 'text',
										permissionOverwrites: [
											{ id:everyoneRole.id, deny:['VIEW_CHANNEL'] },
											{ id:appealManager.id, allow: ['VIEW_CHANNEL'] },
											{ id:interaction.guild.me.id, allow: ['VIEW_CHANNEL'] },
										],
									});
									inviteChannel.then(inviteChannel => {
										welcomeChannel.then(welcomeChannel => {
											welcomeChannel.createInvite({ maxAge:0 }).then(invite => {
												interaction.guild.channels.cache.get(inviteChannel.id).send(`Link for your Appeal Server: ${invite.url}`);
											});
										});
									});
								});

								// Sends Welcome Embed
								welcomeChannel.then(welcomeChannel => {
									const masterGuild = client.guilds.cache.find(guilds => guilds.id === res2[0].parentServer);
									interaction.client.api.channels(welcomeChannel.id).messages.post({
										data: {
											embed: {
												color: 3092790,
												image:{ url:'https://cdn.discordapp.com/attachments/756644176795533334/850028222569906206/Rules-Embed.gif' },
											},
										},
									}).catch(error => {});
									interaction.client.api.channels(welcomeChannel.id).messages.post({
										data: {
											embed: {
												title: `<:warning:847479424583729213> You have been banned from ${masterGuild.name}!`,
												description:'To appeal your ban, please reply to your ban case on the channel selector',
												color: 3092790,
												image:{ url:'https://cdn.discordapp.com/attachments/756644176795533334/847276996564353054/Embed_width.png' },
											},
										},
									}).catch(() => {});
								}).catch(() => {});
							}
							else {
								welcomeChannelState.permissionOverwrites.set([
									{ id:everyoneRole.id, deny:['SEND_MESSAGES'] },
									{ id:interaction.guild.me.id, allow: ['SEND_MESSAGES'] },
								], 'Locked user response.').catch(e => {});
							}
							const logsChannelState = interaction.guild.channels.cache.find(cn => cn.name === 'logs');
							const inviteChannelState = interaction.guild.channels.cache.find(cn => cn.name === 'invite');
							appealManager.then(async appealManager => {
								if ((typeof logsChannelState === 'undefined')) {
									// Creates log channel
									interaction.guild.channels.create('logs', {
										type: 'text',
										permissionOverwrites: [
											{ id:everyoneRole.id, deny:['VIEW_CHANNEL'] },
											{ id:appealManager.id, allow: ['VIEW_CHANNEL'] },
											{ id:interaction.guild.me.id, allow: ['VIEW_CHANNEL'] },
										],
										topic:'DO NOT RENAME CHANNEL',
										position:1,
										reason: 'New channel added for approvals' },
									).catch(error => {});
								}
								else {
									logsChannelState.permissionOverwrites.set([
										{ id:everyoneRole.id, deny:['VIEW_CHANNEL'] },
										{ id:appealManager.id, allow: ['VIEW_CHANNEL'] },
										{ id:interaction.guild.me.id, allow: ['VIEW_CHANNEL'] },
									], 'Locked user response.').catch(e => {});
									// trying to change channel permissions
								}
								if ((typeof inviteChannelState === 'undefined')) {
									// Creates Invite Channel
									const inviteChannel = await interaction.guild.channels.create('invite', {
										type: 'text',
										permissionOverwrites: [
											{ id:everyoneRole.id, deny:['VIEW_CHANNEL'] },
											{ id:appealManager.id, allow: ['VIEW_CHANNEL'] },
											{ id:interaction.guild.me.id, allow: ['VIEW_CHANNEL'] },
										],
									});
									interaction.guild.channels.cache.get(inviteChannel.id).createInvite({ maxAge:0 }).then(invite => {
										interaction.guild.channels.cache.get(inviteChannel.id).send(`Link for your Appeal Server: ${invite.url}`);
									});
								}
								else {
									inviteChannelState.permissionOverwrites.set([
										{ id:everyoneRole.id, deny:['VIEW_CHANNEL'] },
										{ id:appealManager.id, allow: ['VIEW_CHANNEL'] },
										{ id:interaction.guild.me.id, allow: ['VIEW_CHANNEL'] },
									], 'Locked user response.').catch(e => {});
								}
							});
							appealManager.then(appealManager => {
								interaction.member.roles.add(appealManager).catch(error => {});
								interaction.guild.me.roles.add(appealManager).catch(error => {});
								const whitelistUsers = JSON.parse(res1[0].whitelist);
								if (whitelistUsers.length >= 1) {
									whitelistUsers.forEach(async user => {
										let whitelistUser = await interaction.guild.members.fetch(user);
										whitelistUser.roles.add(appealManager).catch(e=>{});
									});
								}
							});
							interaction.editReply('Setup Complete').catch(e => {});
							// client.application.commands.set([], interaction.guild.id);
						}
						else {
							interaction.editReply({ embeds: [{ color: 15548997, title:'<:DND:851523015057080340> Please run this command in the appeal server!', description:'Due to it\'s destructive nature, this command can only be run in an appeal server.' }] });
						}
					}
					else {
						interaction.editReply({ embeds: [{ color: 15088700, title:'<:warning:847479424583729213> Server is not linked!', description:'Please use `!/link <parentServerID> <appealServerID>` to get started.' }] });
					}
				});
			}
			else {
				interaction.editReply({ embeds: [{ color: 15088700, title:'<:warning:847479424583729213> Server not found in the database', description:`Please run \`!/sync\` to add ${interaction.guild.id} to the database.` }] });
			}
		});

	},
};
