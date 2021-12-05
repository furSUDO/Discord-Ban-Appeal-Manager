/* eslint-disable max-nested-callbacks */
const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageAttachment } = require('discord.js');
const get = require('async-get-file');
const fsPromises = require('fs').promises;
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const requiredUserPermissions = ['MANAGE_MESSAGES'];
const requiredBotPermissions = ['MANAGE_CHANNELS', 'MANAGE_ROLES', 'MANAGE_GUILD', 'BAN_MEMBERS', 'KICK_MEMBERS', 'MANAGE_MESSAGES', 'CREATE_INSTANT_INVITE'];

module.exports = {
	data: new SlashCommandBuilder()
		.setDefaultPermission(true)
		.setName('case')
		.setDescription('Handle Cases.')
		.addSubcommand(subcommand =>
			subcommand
				.setName('approve')
				.setDescription('Approves a ban appeal.')
				.addStringOption(option => option.setName('reason').setDescription('Add a reason to this action.').setRequired(false)))
		.addSubcommand(subcommand =>
			subcommand
				.setName('deny')
				.setDescription('Denies a ban appeal.')
				.addStringOption(option => option.setName('reason').setDescription('Add a reason to this action.').setRequired(false)))
		.addSubcommand(subcommand =>
			subcommand
				.setName('softdeny')
				.setDescription('Soft-denies a ban appeal.')
				.addStringOption(option => option.setName('reason').setDescription('Add a reason to this action.').setRequired(false))),
	async execute(client, interaction, con) {
		await interaction.deferReply();
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
		const serverID = interaction.guild.id;
		/**
			 * Checks if the server is in the DB.
			 */
		con.query('SELECT * FROM servers WHERE serverID = ?', [serverID], function(err, res1) {
			if (res1.length !== 0) {
				/**
					 * Checks if the server is linked to a parent server.
					 */
				con.query('SELECT * FROM linkedservers WHERE parentServer = ? OR appealServer = ?', [serverID, serverID], async function(err, res2) {
					if (res2.length !== 0) {
						if (res2[0].appealServer === interaction.guild.id) {

							con.query('SELECT * FROM cases WHERE channelID = ?', [interaction.channel.id], async function(err, res3) {
								if (res3.length !== 0) {
									const userID = res3[0].userID;
									if (userID === null) {
										interaction.editReply({ content: 'This is not an active case channel!' }); return;
									}
									client.users.fetch(userID).then(async promiseUser => {
										/**
										* Defines both an appealServer and parentServer object from the IDs fetched from the DB earlier.
										*/
										const appealServer = await client.guilds.fetch(res2[0].appealServer);
										const parentServer = await client.guilds.fetch(res2[0].parentServer);
										/**
										* Checks if the application has the required permissions to function.
										*/
										if (!(appealServer.me.permissions.has(requiredBotPermissions) && parentServer.me.permissions.has(requiredBotPermissions))) {
											interaction.editReply({
												embeds: [{
													color: 15088700,
													title: '<:warning:847479424583729213> WARNING <:warning:847479424583729213>',
													description: `Please make sure I have been given all of the following permissions in both ${parentServer.name}, and in here.`,
													image: { url: 'https://media.discordapp.net/attachments/756644176795533334/910842822603730944/DBAM_REQUIRED_PERMISSION_SCOPE.png' },
												}], ephemeral: true,
											});
											return;
										}
										const subCommand = interaction.options.getSubcommand('case');
										const caseReason = typeof interaction.options.getString('reason') === 'object' ? `Unbaned by ${interaction.user.username}` : `Unbaned by ${interaction.user.username}, Reason: ${interaction.options.getString('reason')}`;
										const embedCaseReason = typeof interaction.options.getString('reason') === 'object' ? 'No reason provided.' : `${interaction.options.getString('reason')}`;
										let dmSuccess ;
										let actionSuccess ;
										const archiveID = res3[0].archiveID;
										switch (subCommand) {
										case 'approve': {
											await interaction.editReply({ embeds: [{
												color: 4437377,
												title: '<:verified:847476592837263361> Case Closed',
												fields: [
													{ name: 'Current Tasks', value: `Unban ${promiseUser.username} <a:typing:870251114342256692>
																					DM ${promiseUser.username} <:grdot:870273018704826428>
																					Remove ${promiseUser.username} From Here <:grdot:870273018704826428>
																					Indexing Channel <:grdot:870273018704826428>
																					Archive Media <:grdot:870273018704826428>
																					Format Archive <:grdot:870273018704826428>` },
												],
												timestamp: new Date(),
												footer: { text: 'Discord Ban Appeal Manager', icon_url: interaction.client.user.avatarURL({ dynamic: true }) },
											}] });
											let unbanSuccess ;
											// Unban
											parentServer.members.unban(promiseUser, [caseReason])
												.then(unbanSuccess = true).catch(e => {unbanSuccess = false;});
											await interaction.editReply({ embeds: [{
												color: 4437377,
												title: '<:verified:847476592837263361> Case Closed',
												fields: [
													{ name: 'Current Tasks', value: `Unban ${promiseUser.username} ${unbanSuccess ? '<:gdot:867022258605260840> ' : '<:rdot:867022258575769600> '}
																					DM ${promiseUser.username} <a:typing:870251114342256692>
																					Remove ${promiseUser.username} From Here <:grdot:870273018704826428>
																					Indexing Channel <:grdot:870273018704826428>
																					Archive Media <:grdot:870273018704826428>
																					Format Archive <:grdot:870273018704826428>` },
												],
												timestamp: new Date(),
												footer: { text: 'Discord Ban Appeal Manager', icon_url: interaction.client.user.avatarURL({ dynamic: true }) },
											}] });
											// Create Invite
											let parentInvite = await parentServer.channels.fetch();
											parentInvite = parentInvite.filter(channels => channels.type === 'GUILD_TEXT').first();
											parentInvite = await parentServer.invites.create(parentInvite, { maxUses: 1, maxAge: 0, reason:`Invite valid for ${promiseUser.username}'s approved ban appeal.'` }).catch(e => { interaction.reply({ content: `Failed to create invite for ${parentServer.name}`, ephemeral: true }); });
											// Kick user
											await promiseUser.send({ content: `You have been unbanned from ${parentServer.name}\nInvite: ${parentInvite}` })
												.then(dmSuccess = true).catch(e => {dmSuccess = false;});
											await interaction.editReply({ embeds: [{
												color: 4437377,
												title: '<:verified:847476592837263361> Case Closed',
												fields: [
													{ name: 'Current Tasks', value: `Unban ${promiseUser.username} ${unbanSuccess ? '<:gdot:867022258605260840> ' : '<:rdot:867022258575769600> '}
																						DM ${promiseUser.username} ${dmSuccess ? '<:gdot:867022258605260840> ' : '<:rdot:867022258575769600> '}
																						Remove ${promiseUser.username} From Here <a:typing:870251114342256692>
																						Indexing Channel <:grdot:870273018704826428>
																						Archive Media <:grdot:870273018704826428>
																						Format Archive <:grdot:870273018704826428>` },
												],
												timestamp: new Date(),
												footer: { text: 'Discord Ban Appeal Manager', icon_url: interaction.client.user.avatarURL({ dynamic: true }) },
											}] });
											await interaction.guild.members.kick(promiseUser, [`Ban appeal approved by ${interaction.member.user.username}`])
												.then(actionSuccess = true).catch(e => {actionSuccess = false;});
											await interaction.editReply({ embeds: [{
												color: 4437377,
												title: '<:verified:847476592837263361> Case Closed',
												fields: [
													{ name: 'Current Tasks', value: `Unban ${promiseUser.username} ${unbanSuccess ? '<:gdot:867022258605260840> ' : '<:rdot:867022258575769600> '}
																						DM ${promiseUser.username} ${dmSuccess ? '<:gdot:867022258605260840> ' : '<:rdot:867022258575769600> '}
																						Remove ${promiseUser.username} From Here ${actionSuccess ? '<:gdot:867022258605260840> ' : '<:rdot:867022258575769600> '}
																						Indexing Channel <a:typing:870251114342256692>
																						Archive Media <:grdot:870273018704826428>
																						Format Archive <:grdot:870273018704826428>` },
												],
												timestamp: new Date(),
												footer: { text: 'Discord Ban Appeal Manager', icon_url: interaction.client.user.avatarURL({ dynamic: true }) },
											}] });

											const mediaBackupChannel = client.guilds.cache.get(process.env.BACKUP_SERVER).channels.cache.get(process.env.BACKUP_CHANNEL);
											const message = await interaction.fetchReply();
											let collectedMessages = await collectMessages(message.channel);
											collectedMessages = collectedMessages[0];
											const editedMessages = [];
											collectedMessages.reverse();
											await interaction.editReply({ embeds: [{
												color: 4437377,
												title: '<:verified:847476592837263361> Case Closed',
												fields: [
													{ name: 'Current Tasks', value: `Unban ${promiseUser.username} ${unbanSuccess ? '<:gdot:867022258605260840> ' : '<:rdot:867022258575769600> '}
																						DM ${promiseUser.username} ${dmSuccess ? '<:gdot:867022258605260840> ' : '<:rdot:867022258575769600> '}
																						Remove ${promiseUser.username} From Here ${actionSuccess ? '<:gdot:867022258605260840> ' : '<:rdot:867022258575769600> '}
																						Indexing Channel <:gdot:867022258605260840>
																						Archive Media <a:typing:870251114342256692>
																						Format Archive <:grdot:870273018704826428>` },
												],
												timestamp: new Date(),
												footer: { text: 'Discord Ban Appeal Manager', icon_url: interaction.client.user.avatarURL({ dynamic: true }) },
											}] });

											for (const collectedMessage of collectedMessages) {
												if (typeof collectedMessage[1].attachments.first() !== 'undefined') {
													const scramble = uuidv4();
													await get(collectedMessage[1].attachments.first().url, { directory:'./api/archives/temp/', filename:`${scramble}-${collectedMessage[1].attachments.first().name}` });
													const file = new MessageAttachment(`./api/archives/temp/${scramble}-${collectedMessage[1].attachments.first().name}`);
													const m = await mediaBackupChannel.send({ files:[file] }).catch(e => {});
													fs.unlink(`./api/archives/temp/${scramble}-${collectedMessage[1].attachments.first().name}`, e => {});
													collectedMessage[1].attachments.url = await m.attachments.first().url;
													editedMessages.push(collectedMessage[1]);
												}
											}
											await interaction.editReply({ embeds: [{
												color: 4437377,
												title: '<:verified:847476592837263361> Case Closed',
												fields: [
													{ name: 'Current Tasks', value: `Unban ${promiseUser.username} ${unbanSuccess ? '<:gdot:867022258605260840> ' : '<:rdot:867022258575769600> '}
																						DM ${promiseUser.username} ${dmSuccess ? '<:gdot:867022258605260840> ' : '<:rdot:867022258575769600> '}
																						Remove ${promiseUser.username} From Here ${actionSuccess ? '<:gdot:867022258605260840> ' : '<:rdot:867022258575769600> '}
																						Indexing Channel <:gdot:867022258605260840>
																						Archive Media <:gdot:867022258605260840>
																						Format Archive <a:typing:870251114342256692>` },
												],
												timestamp: new Date(),
												footer: { text: 'Discord Ban Appeal Manager', icon_url: interaction.client.user.avatarURL({ dynamic: true }) },
											}] });
											collectedMessages.map(obj => editedMessages.find(o => o.id === obj.id) || obj);
											await fsPromises.mkdir(`./api/archives/${parentServer.id}/${promiseUser.id}/`, { recursive: true });
											const htmlWriteStream = fs.createWriteStream(`./api/archives/${parentServer.id}/${promiseUser.id}/${archiveID}.html`);
											const txtWriteStream = fs.createWriteStream(`./api/archives/${parentServer.id}/${promiseUser.id}/${archiveID}.txt`);
											const htmlPathName = htmlWriteStream.path;
											const txtPathName = txtWriteStream.path;
											htmlWriteStream.write(`
																		<!DOCTYPE html>
									<html lang="en">
									<head>
										<meta charset="utf-8">
										<title>Ban Appeal</title>
										<meta name="viewport" content="width=device-width, initial-scale=1">
										<script src="https://code.jquery.com/jquery-1.10.2.min.js"></script>
										<link href="https://netdna.bootstrapcdn.com/bootstrap/3.3.1/css/bootstrap.min.css" rel="stylesheet">
										<script src="https://netdna.bootstrapcdn.com/bootstrap/3.3.1/js/bootstrap.min.js"></script>
										<link rel="stylesheet" href="https://api.dbam.dev/assets/styles/style.css">
										<meta content="#616df5" data-react-helmet="true" name="theme-color">
										<meta name="description" content="Ban appeal log of ${promiseUser.tag}">
										<meta property="og:title" content="DBAM">
										<meta property="og:site_name" content="Discord Ban Appeal Manager">
										<meta property="og:description" content="Ban appeal log of ${promiseUser.tag}">
										<meta property="og:type" content="website">
										<meta property="og:image" content="https://media.discordapp.net/attachments/756644176795533334/911823242002575391/43b92423cf7fd9d8d81b286659967fec.png">
										<meta name="twitter:card" content="summary_large_image">
										<meta name="twitter:creator" content="Discord Ban Appeal Manager">
										<meta name="twitter:title" content="DBAM">
										<meta name="twitter:description" content="Ban appeal log of ${promiseUser.tag}">
									</head>
									<body>
														
									<div class="container-flex bootstrap">
										<div class="row">
											<div class="col-md">
												<div class="portlet portlet-default">
													<div class="portlet-heading">
														<div class="portlet-title">
															<h4><i class="fa fa-circle text-green"></i> ${promiseUser.tag} - ${promiseUser.id}</h4>
														</div>
														<div class="portlet-widgets">
															<span class="divider"></span>
															<a data-toggle="collapse" data-parent="#accordion" href="#chat"><i class="fa fa-chevron-down"></i></a>
														</div>
														<div class="clearfix"></div>
													</div>
													<div id="chat" class="panel-collapse collapse in">
														<div>
														<div class="portlet-body chat-widget" style="overflow-y: auto; width: auto; height: 300px;">
															<div class="row">
																<div class="col-lg-12">
																</div>
															</div>
																		`);
											collectedMessages.forEach(message => {
												message = message[1];
												htmlWriteStream.write(`
																			
															<div class="row">
															<div class="col-lg-12">
																<div class="media">
																	<a class="pull-left" href="#">
																		<img class="media-object img-circle img-chat" src="${message.author.displayAvatarURL({ dynamic:true })}" alt="${message.author.displayName}'s avatar">
																	</a>
																	<div class="media-body">
																		<h4 class="media-heading">${message.author.username}
																			<span class="small">${message.createdAt}</span>
																		</h4>
																		${messageAttachmentDisplay(message)}
																	</div>
																</div>
															</div>
														</div>
														<hr>
																			`);
											});
											htmlWriteStream.on('error', (err) => {
												console.error(`There is an error writing the file ${htmlPathName} => ${err}.`);
											});
											htmlWriteStream.write(`
																		</div>
														</div>
													</div>
												</div>
											</div>
											<!-- /.col-md-4 -->
										</div>
									</div>                
									
									</body>
									</html>
																		`);
											htmlWriteStream.end();
											txtWriteStream.write(`Ban appeal log for ${promiseUser.tag} (${promiseUser.id}) - ${message.channel.createdAt}\n\n`);
											collectedMessages.forEach(message => {
												message = message[1];
												txtWriteStream.write(`[${message.channel.name}] [${message.author.id}] ${message.author.tag}#${message.author.discriminator}: ${message.content}\n`);
											});
											txtWriteStream.on('error', (err) => {
												console.error(`There is an error writing the file ${txtPathName} => ${err}.`);
											});
											txtWriteStream.end();

											await interaction.editReply({ embeds: [{
												color: 4437377,
												title: '<:verified:847476592837263361> Case Closed',
												fields: [
													{ name: 'Current Tasks', value: `Unban ${promiseUser.username} ${unbanSuccess ? '<:gdot:867022258605260840> ' : '<:rdot:867022258575769600> '}
																						DM ${promiseUser.username} ${dmSuccess ? '<:gdot:867022258605260840> ' : '<:rdot:867022258575769600> '}
																						Remove ${promiseUser.username} From Here ${actionSuccess ? '<:gdot:867022258605260840> ' : '<:rdot:867022258575769600> '}
																						Indexing Channel <:gdot:867022258605260840>
																						Archive Media <:gdot:867022258605260840>
																						Format Archive <:gdot:867022258605260840>` },
												],
												timestamp: new Date(),
												footer: { text: 'Discord Ban Appeal Manager', icon_url: interaction.client.user.avatarURL({ dynamic: true }) },
											}] });
											const logChannel = message.guild.channels.cache.find(channel => channel.name === 'logs');
											if ((typeof logChannel === 'undefined')) {
												interaction.followUp({ embeds: [{ color: 15088700, title:'<:warning:847479424583729213> Failed to log event', description:'Please create a channel with the name `logs` or run `/init` to format the server properly.\n\nThis channel will not delete automatically.', fields:[{
													name:'Responsible moderator',
													value:`${interaction.user.tag}`,
												}, {
													name:'Reason',
													value:`${embedCaseReason}`,
												}, {
													name:'HTML archive',
													value:`https://api.dbam.dev/${htmlPathName.substring(6)}`,
													inline:true,
												}, {
													name:'TXT archive',
													value:`https://api.dbam.dev/${txtPathName.substring(6)}`,
													inline:true,
												}],
												footer:{
													text: `Archive ID: ${archiveID}`,
												} }] });
											}
											else {
												logChannel.send({
													embeds: [{
														color: 4437377,
														title:`<:verified:847476592837263361> ${promiseUser.tag} (${promiseUser.id}) has been unbanned from ${parentServer.name}.`,
														fields:[{
															name:'Responsible moderator',
															value:`${interaction.user.tag}`,
														}, {
															name:'Reason',
															value:`${embedCaseReason}`,
														}, {
															name:'HTML archive',
															value:`https://api.dbam.dev/${htmlPathName.substring(6)}`,
															inline:true,
														}, {
															name:'TXT archive',
															value:`https://api.dbam.dev/${txtPathName.substring(6)}`,
															inline:true,
														}],
														footer:{
															text: `Archive ID: ${archiveID}`,
														},
													}],
												});
												setTimeout(() => {
													interaction.channel.delete().catch(e => {});
												}, 1000);
											}
											break;
										}
										case 'deny': {
											await interaction.editReply({ embeds: [{
												color: 4437377,
												title: '<:verified:847476592837263361> Case Closed',
												fields: [
													{ name: 'Current Tasks', value: `DM ${promiseUser.username} <:grdot:870273018704826428>
																					Ban ${promiseUser.username} From Here <:grdot:870273018704826428>
																					Indexing Channel <:grdot:870273018704826428>
																					Archive Media <:grdot:870273018704826428>
																					Format Archive <:grdot:870273018704826428>` },
												],
												timestamp: new Date(),
												footer: { text: 'Discord Ban Appeal Manager', icon_url: interaction.client.user.avatarURL({ dynamic: true }) },
											}] });
											// DM user
											await promiseUser.send({ content: `You have been permanently banned from ${parentServer.name}!` })
												.then(dmSuccess = true).catch(e => {dmSuccess = false;});
											await interaction.editReply({ embeds: [{
												color: 4437377,
												title: '<:verified:847476592837263361> Case Closed',
												fields: [
													{ name: 'Current Tasks', value: `DM ${promiseUser.username} ${dmSuccess ? '<:gdot:867022258605260840> ' : '<:rdot:867022258575769600> '}
																						Ban ${promiseUser.username} From Here <a:typing:870251114342256692>
																						Indexing Channel <:grdot:870273018704826428>
																						Archive Media <:grdot:870273018704826428>
																						Format Archive <:grdot:870273018704826428>` },
												],
												timestamp: new Date(),
												footer: { text: 'Discord Ban Appeal Manager', icon_url: interaction.client.user.avatarURL({ dynamic: true }) },
											}] });
											// Ban user
											await interaction.guild.members.ban(promiseUser, { reason:`Ban appeal denied by ${interaction.member.user.username}` })
												.then(actionSuccess = true).catch(e => {actionSuccess = false;});
											await interaction.editReply({ embeds: [{
												color: 4437377,
												title: '<:verified:847476592837263361> Case Closed',
												fields: [
													{ name: 'Current Tasks', value: `DM ${promiseUser.username} ${dmSuccess ? '<:gdot:867022258605260840> ' : '<:rdot:867022258575769600> '}
																						Ban ${promiseUser.username} From Here ${actionSuccess ? '<:gdot:867022258605260840> ' : '<:rdot:867022258575769600> '}
																						Indexing Channel <a:typing:870251114342256692>
																						Archive Media <:grdot:870273018704826428>
																						Format Archive <:grdot:870273018704826428>` },
												],
												timestamp: new Date(),
												footer: { text: 'Discord Ban Appeal Manager', icon_url: interaction.client.user.avatarURL({ dynamic: true }) },
											}] });

											const mediaBackupChannel = client.guilds.cache.get(process.env.BACKUP_SERVER).channels.cache.get(process.env.BACKUP_CHANNEL);
											const message = await interaction.fetchReply();
											let collectedMessages = await collectMessages(message.channel);
											collectedMessages = collectedMessages[0];
											const editedMessages = [];
											collectedMessages.reverse();
											await interaction.editReply({ embeds: [{
												color: 4437377,
												title: '<:verified:847476592837263361> Case Closed',
												fields: [
													{ name: 'Current Tasks', value: `DM ${promiseUser.username} ${dmSuccess ? '<:gdot:867022258605260840> ' : '<:rdot:867022258575769600> '}
																						Ban ${promiseUser.username} From Here ${actionSuccess ? '<:gdot:867022258605260840> ' : '<:rdot:867022258575769600> '}
																						Indexing Channel <:gdot:867022258605260840>
																						Archive Media <a:typing:870251114342256692>
																						Format Archive <:grdot:870273018704826428>` },
												],
												timestamp: new Date(),
												footer: { text: 'Discord Ban Appeal Manager', icon_url: interaction.client.user.avatarURL({ dynamic: true }) },
											}] });

											for (const collectedMessage of collectedMessages) {
												if (typeof collectedMessage[1].attachments.first() !== 'undefined') {
													const scramble = uuidv4();
													await get(collectedMessage[1].attachments.first().url, { directory:'./api/archives/temp/', filename:`${scramble}-${collectedMessage[1].attachments.first().name}` });
													const file = new MessageAttachment(`./api/archives/temp/${scramble}-${collectedMessage[1].attachments.first().name}`);
													const m = await mediaBackupChannel.send({ files:[file] }).catch(e => {});
													fs.unlink(`./api/archives/temp/${scramble}-${collectedMessage[1].attachments.first().name}`, e => {});
													collectedMessage[1].attachments.url = await m.attachments.first().url;
													editedMessages.push(collectedMessage[1]);
												}
											}
											await interaction.editReply({ embeds: [{
												color: 4437377,
												title: '<:verified:847476592837263361> Case Closed',
												fields: [
													{ name: 'Current Tasks', value: `DM ${promiseUser.username} ${dmSuccess ? '<:gdot:867022258605260840> ' : '<:rdot:867022258575769600> '}
																						Ban ${promiseUser.username} From Here ${actionSuccess ? '<:gdot:867022258605260840> ' : '<:rdot:867022258575769600> '}
																						Indexing Channel <:gdot:867022258605260840>
																						Archive Media <:gdot:867022258605260840>
																						Format Archive <a:typing:870251114342256692>` },
												],
												timestamp: new Date(),
												footer: { text: 'Discord Ban Appeal Manager', icon_url: interaction.client.user.avatarURL({ dynamic: true }) },
											}] });
											collectedMessages.map(obj => editedMessages.find(o => o.id === obj.id) || obj);
											await fsPromises.mkdir(`./api/archives/${parentServer.id}/${promiseUser.id}/`, { recursive: true });
											const htmlWriteStream = fs.createWriteStream(`./api/archives/${parentServer.id}/${promiseUser.id}/${archiveID}.html`);
											const txtWriteStream = fs.createWriteStream(`./api/archives/${parentServer.id}/${promiseUser.id}/${archiveID}.txt`);
											const htmlPathName = htmlWriteStream.path;
											const txtPathName = txtWriteStream.path;
											htmlWriteStream.write(`
																		<!DOCTYPE html>
									<html lang="en">
									<head>
										<meta charset="utf-8">
										<title>Ban Appeal</title>
										<meta name="viewport" content="width=device-width, initial-scale=1">
										<script src="https://code.jquery.com/jquery-1.10.2.min.js"></script>
										<link href="https://netdna.bootstrapcdn.com/bootstrap/3.3.1/css/bootstrap.min.css" rel="stylesheet">
										<script src="https://netdna.bootstrapcdn.com/bootstrap/3.3.1/js/bootstrap.min.js"></script>
										<link rel="stylesheet" href="https://api.dbam.dev/assets/styles/style.css">
										<meta content="#616df5" data-react-helmet="true" name="theme-color">
										<meta name="description" content="Ban appeal log of ${promiseUser.tag}">
										<meta property="og:title" content="DBAM">
										<meta property="og:site_name" content="Discord Ban Appeal Manager">
										<meta property="og:description" content="Ban appeal log of ${promiseUser.tag}">
										<meta property="og:type" content="website">
										<meta property="og:image" content="https://media.discordapp.net/attachments/756644176795533334/911823242002575391/43b92423cf7fd9d8d81b286659967fec.png">
										<meta name="twitter:card" content="summary_large_image">
										<meta name="twitter:creator" content="Discord Ban Appeal Manager">
										<meta name="twitter:title" content="DBAM">
										<meta name="twitter:description" content="Ban appeal log of ${promiseUser.tag}">
									</head>
									<body>
														
									<div class="container-flex bootstrap">
										<div class="row">
											<div class="col-md">
												<div class="portlet portlet-default">
													<div class="portlet-heading">
														<div class="portlet-title">
															<h4><i class="fa fa-circle text-green"></i> ${promiseUser.tag} - ${promiseUser.id}</h4>
														</div>
														<div class="portlet-widgets">
															<span class="divider"></span>
															<a data-toggle="collapse" data-parent="#accordion" href="#chat"><i class="fa fa-chevron-down"></i></a>
														</div>
														<div class="clearfix"></div>
													</div>
													<div id="chat" class="panel-collapse collapse in">
														<div>
														<div class="portlet-body chat-widget" style="overflow-y: auto; width: auto; height: 300px;">
															<div class="row">
																<div class="col-lg-12">
																</div>
															</div>
																		`);
											collectedMessages.forEach(message => {
												message = message[1];
												htmlWriteStream.write(`
																			
															<div class="row">
															<div class="col-lg-12">
																<div class="media">
																	<a class="pull-left" href="#">
																		<img class="media-object img-circle img-chat" src="${message.author.displayAvatarURL({ dynamic:true })}" alt="${message.author.displayName}'s avatar">
																	</a>
																	<div class="media-body">
																		<h4 class="media-heading">${message.author.username}
																			<span class="small">${message.createdAt}</span>
																		</h4>
																		${messageAttachmentDisplay(message)}
																	</div>
																</div>
															</div>
														</div>
														<hr>
																			`);
											});
											htmlWriteStream.on('error', (err) => {
												console.error(`There is an error writing the file ${htmlPathName} => ${err}.`);
											});
											htmlWriteStream.write(`
																		</div>
														</div>
													</div>
												</div>
											</div>
											<!-- /.col-md-4 -->
										</div>
									</div>                
									
									</body>
									</html>
																		`);
											htmlWriteStream.end();
											txtWriteStream.write(`Ban appeal log for ${promiseUser.tag} (${promiseUser.id}) - ${message.channel.createdAt}\n\n`);
											collectedMessages.forEach(message => {
												message = message[1];
												txtWriteStream.write(`[${message.channel.name}] [${message.author.id}] ${message.author.tag}#${message.author.discriminator}: ${message.content}\n`);
											});
											txtWriteStream.on('error', (err) => {
												console.error(`There is an error writing the file ${txtPathName} => ${err}.`);
											});
											txtWriteStream.end();

											await interaction.editReply({ embeds: [{
												color: 4437377,
												title: '<:verified:847476592837263361> Case Closed',
												fields: [
													{ name: 'Current Tasks', value: `DM ${promiseUser.username} ${dmSuccess ? '<:gdot:867022258605260840> ' : '<:rdot:867022258575769600> '}
																						Ban ${promiseUser.username} From Here ${actionSuccess ? '<:gdot:867022258605260840> ' : '<:rdot:867022258575769600> '}
																						Indexing Channel <:gdot:867022258605260840>
																						Archive Media <:gdot:867022258605260840>
																						Format Archive <:gdot:867022258605260840>` },
												],
												timestamp: new Date(),
												footer: { text: 'Discord Ban Appeal Manager', icon_url: interaction.client.user.avatarURL({ dynamic: true }) },
											}] });
											const logChannel = message.guild.channels.cache.find(channel => channel.name === 'logs');
											if ((typeof logChannel === 'undefined')) {
												interaction.followUp({ embeds: [{ color: 15088700, title:'<:warning:847479424583729213> Failed to log event', description:'Please create a channel with the name `logs` or run `/init` to format the server properly.\n\nThis channel will not delete automatically.', fields:[{
													name:'Responsible moderator',
													value:`${interaction.user.tag}`,
												}, {
													name:'Reason',
													value:`${embedCaseReason}`,
												}, {
													name:'HTML archive',
													value:`https://api.dbam.dev/${htmlPathName.substring(6)}`,
													inline:true,
												}, {
													name:'TXT archive',
													value:`https://api.dbam.dev/${txtPathName.substring(6)}`,
													inline:true,
												}],
												footer:{
													text: `Archive ID: ${archiveID}`,
												} }] });
											}
											else {
												logChannel.send({
													embeds: [{
														color: 15088700,
														title:`<:warning:847479424583729213> ${promiseUser.tag} (${promiseUser.id}) has been permanently banned from ${parentServer.name}`,
														fields:[{
															name:'Responsible moderator',
															value:`${interaction.user.tag}`,
														}, {
															name:'Reason',
															value:`${embedCaseReason}`,
														}, {
															name:'HTML archive',
															value:`https://api.dbam.dev/${htmlPathName.substring(6)}`,
															inline:true,
														}, {
															name:'TXT archive',
															value:`https://api.dbam.dev/${txtPathName.substring(6)}`,
															inline:true,
														}],
														footer:{
															text: `Archive ID: ${archiveID}`,
														},
													}],
												});
												setTimeout(() => {
													interaction.channel.delete().catch(e => {});
												}, 1000);
											}
											break;
										}
										case 'softdeny': {
											await interaction.editReply({ embeds: [{
												color: 4437377,
												title: '<:verified:847476592837263361> Case Closed',
												fields: [
													{ name: 'Current Tasks', value: `DM ${promiseUser.username} <a:typing:870251114342256692>
																					Remove ${promiseUser.username} From Here <:grdot:870273018704826428>
																					Indexing Channel <:grdot:870273018704826428>
																					Archive Media <:grdot:870273018704826428>
																					Format Archive <:grdot:870273018704826428>` },
												],
												timestamp: new Date(),
												footer: { text: 'Discord Ban Appeal Manager', icon_url: interaction.client.user.avatarURL({ dynamic: true }) },
											}] });
											let unbanSuccess ;
											// Create Invite
											let appealInvite = await appealServer.channels.fetch();
											appealInvite = appealInvite.filter(channels => channels.type === 'GUILD_TEXT').first();
											appealInvite = await appealServer.invites.create(appealInvite, { maxUses: 1, maxAge: 0, reason:`Invite valid for ${promiseUser.username}'s approved ban appeal.'` }).catch(e => { interaction.reply({ content: `Failed to create invite for ${parentServer.name}`, ephemeral: true }); });
											// Kick user
											await promiseUser.send({ content: `You have been soft-denied from ${parentServer.name}\nOnce you are ready to reappeal, you can use this invite: ${appealInvite}` })
												.then(dmSuccess = true).catch(e => {dmSuccess = false;});
											await interaction.editReply({ embeds: [{
												color: 4437377,
												title: '<:verified:847476592837263361> Case Closed',
												fields: [
													{ name: 'Current Tasks', value: `DM ${promiseUser.username} ${dmSuccess ? '<:gdot:867022258605260840> ' : '<:rdot:867022258575769600> '}
																						Remove ${promiseUser.username} From Here <a:typing:870251114342256692>
																						Indexing Channel <:grdot:870273018704826428>
																						Archive Media <:grdot:870273018704826428>
																						Format Archive <:grdot:870273018704826428>` },
												],
												timestamp: new Date(),
												footer: { text: 'Discord Ban Appeal Manager', icon_url: interaction.client.user.avatarURL({ dynamic: true }) },
											}] });
											await interaction.guild.members.kick(promiseUser, [`Ban appeal approved by ${interaction.member.user.username}`])
												.then(actionSuccess = true).catch(e => {actionSuccess = false;});
											await interaction.editReply({ embeds: [{
												color: 4437377,
												title: '<:verified:847476592837263361> Case Closed',
												fields: [
													{ name: 'Current Tasks', value: `DM ${promiseUser.username} ${dmSuccess ? '<:gdot:867022258605260840> ' : '<:rdot:867022258575769600> '}
																						Remove ${promiseUser.username} From Here ${actionSuccess ? '<:gdot:867022258605260840> ' : '<:rdot:867022258575769600> '}
																						Indexing Channel <a:typing:870251114342256692>
																						Archive Media <:grdot:870273018704826428>
																						Format Archive <:grdot:870273018704826428>` },
												],
												timestamp: new Date(),
												footer: { text: 'Discord Ban Appeal Manager', icon_url: interaction.client.user.avatarURL({ dynamic: true }) },
											}] });

											const mediaBackupChannel = client.guilds.cache.get(process.env.BACKUP_SERVER).channels.cache.get(process.env.BACKUP_CHANNEL);
											const message = await interaction.fetchReply();
											let collectedMessages = await collectMessages(message.channel);
											collectedMessages = collectedMessages[0];
											const editedMessages = [];
											collectedMessages.reverse();
											await interaction.editReply({ embeds: [{
												color: 4437377,
												title: '<:verified:847476592837263361> Case Closed',
												fields: [
													{ name: 'Current Tasks', value: `DM ${promiseUser.username} ${dmSuccess ? '<:gdot:867022258605260840> ' : '<:rdot:867022258575769600> '}
																						Remove ${promiseUser.username} From Here ${actionSuccess ? '<:gdot:867022258605260840> ' : '<:rdot:867022258575769600> '}
																						Indexing Channel <:gdot:867022258605260840>
																						Archive Media <a:typing:870251114342256692>
																						Format Archive <:grdot:870273018704826428>` },
												],
												timestamp: new Date(),
												footer: { text: 'Discord Ban Appeal Manager', icon_url: interaction.client.user.avatarURL({ dynamic: true }) },
											}] });

											for (const collectedMessage of collectedMessages) {
												if (typeof collectedMessage[1].attachments.first() !== 'undefined') {
													const scramble = uuidv4();
													await get(collectedMessage[1].attachments.first().url, { directory:'./api/archives/temp/', filename:`${scramble}-${collectedMessage[1].attachments.first().name}` });
													const file = new MessageAttachment(`./api/archives/temp/${scramble}-${collectedMessage[1].attachments.first().name}`);
													const m = await mediaBackupChannel.send({ files:[file] }).catch(e => {});
													fs.unlink(`./api/archives/temp/${scramble}-${collectedMessage[1].attachments.first().name}`, e => {});
													collectedMessage[1].attachments.url = await m.attachments.first().url;
													editedMessages.push(collectedMessage[1]);
												}
											}
											await interaction.editReply({ embeds: [{
												color: 4437377,
												title: '<:verified:847476592837263361> Case Closed',
												fields: [
													{ name: 'Current Tasks', value: `DM ${promiseUser.username} ${dmSuccess ? '<:gdot:867022258605260840> ' : '<:rdot:867022258575769600> '}
																						Remove ${promiseUser.username} From Here ${actionSuccess ? '<:gdot:867022258605260840> ' : '<:rdot:867022258575769600> '}
																						Indexing Channel <:gdot:867022258605260840>
																						Archive Media <:gdot:867022258605260840>
																						Format Archive <a:typing:870251114342256692>` },
												],
												timestamp: new Date(),
												footer: { text: 'Discord Ban Appeal Manager', icon_url: interaction.client.user.avatarURL({ dynamic: true }) },
											}] });
											collectedMessages.map(obj => editedMessages.find(o => o.id === obj.id) || obj);
											await fsPromises.mkdir(`./api/archives/${parentServer.id}/${promiseUser.id}/`, { recursive: true });
											const htmlWriteStream = fs.createWriteStream(`./api/archives/${parentServer.id}/${promiseUser.id}/${archiveID}.html`);
											const txtWriteStream = fs.createWriteStream(`./api/archives/${parentServer.id}/${promiseUser.id}/${archiveID}.txt`);
											const htmlPathName = htmlWriteStream.path;
											const txtPathName = txtWriteStream.path;
											htmlWriteStream.write(`
																		<!DOCTYPE html>
									<html lang="en">
									<head>
										<meta charset="utf-8">
										<title>Ban Appeal</title>
										<meta name="viewport" content="width=device-width, initial-scale=1">
										<script src="https://code.jquery.com/jquery-1.10.2.min.js"></script>
										<link href="https://netdna.bootstrapcdn.com/bootstrap/3.3.1/css/bootstrap.min.css" rel="stylesheet">
										<script src="https://netdna.bootstrapcdn.com/bootstrap/3.3.1/js/bootstrap.min.js"></script>
										<link rel="stylesheet" href="https://api.dbam.dev/assets/styles/style.css">
										<meta content="#616df5" data-react-helmet="true" name="theme-color">
										<meta name="description" content="Ban appeal log of ${promiseUser.tag}">
										<meta property="og:title" content="DBAM">
										<meta property="og:site_name" content="Discord Ban Appeal Manager">
										<meta property="og:description" content="Ban appeal log of ${promiseUser.tag}">
										<meta property="og:type" content="website">
										<meta property="og:image" content="https://media.discordapp.net/attachments/756644176795533334/911823242002575391/43b92423cf7fd9d8d81b286659967fec.png">
										<meta name="twitter:card" content="summary_large_image">
										<meta name="twitter:creator" content="Discord Ban Appeal Manager">
										<meta name="twitter:title" content="DBAM">
										<meta name="twitter:description" content="Ban appeal log of ${promiseUser.tag}">
									</head>
									<body>
														
									<div class="container-flex bootstrap">
										<div class="row">
											<div class="col-md">
												<div class="portlet portlet-default">
													<div class="portlet-heading">
														<div class="portlet-title">
															<h4><i class="fa fa-circle text-green"></i> ${promiseUser.tag} - ${promiseUser.id}</h4>
														</div>
														<div class="portlet-widgets">
															<span class="divider"></span>
															<a data-toggle="collapse" data-parent="#accordion" href="#chat"><i class="fa fa-chevron-down"></i></a>
														</div>
														<div class="clearfix"></div>
													</div>
													<div id="chat" class="panel-collapse collapse in">
														<div>
														<div class="portlet-body chat-widget" style="overflow-y: auto; width: auto; height: 300px;">
															<div class="row">
																<div class="col-lg-12">
																</div>
															</div>
																		`);
											collectedMessages.forEach(message => {
												message = message[1];
												htmlWriteStream.write(`
																			
															<div class="row">
															<div class="col-lg-12">
																<div class="media">
																	<a class="pull-left" href="#">
																		<img class="media-object img-circle img-chat" src="${message.author.displayAvatarURL({ dynamic:true })}" alt="${message.author.displayName}'s avatar">
																	</a>
																	<div class="media-body">
																		<h4 class="media-heading">${message.author.username}
																			<span class="small">${message.createdAt}</span>
																		</h4>
																		${messageAttachmentDisplay(message)}
																	</div>
																</div>
															</div>
														</div>
														<hr>
																			`);
											});
											htmlWriteStream.on('error', (err) => {
												console.error(`There is an error writing the file ${htmlPathName} => ${err}.`);
											});
											htmlWriteStream.write(`
																		</div>
														</div>
													</div>
												</div>
											</div>
											<!-- /.col-md-4 -->
										</div>
									</div>                
									
									</body>
									</html>
																		`);
											htmlWriteStream.end();
											txtWriteStream.write(`Ban appeal log for ${promiseUser.tag} (${promiseUser.id}) - ${message.channel.createdAt}\n\n`);
											collectedMessages.forEach(message => {
												message = message[1];
												txtWriteStream.write(`[${message.channel.name}] [${message.author.id}] ${message.author.tag}#${message.author.discriminator}: ${message.content}\n`);
											});
											txtWriteStream.on('error', (err) => {
												console.error(`There is an error writing the file ${txtPathName} => ${err}.`);
											});
											txtWriteStream.end();

											await interaction.editReply({ embeds: [{
												color: 4437377,
												title: '<:verified:847476592837263361> Case Closed',
												fields: [
													{ name: 'Current Tasks', value: `DM ${promiseUser.username} ${dmSuccess ? '<:gdot:867022258605260840> ' : '<:rdot:867022258575769600> '}
																						Remove ${promiseUser.username} From Here ${actionSuccess ? '<:gdot:867022258605260840> ' : '<:rdot:867022258575769600> '}
																						Indexing Channel <:gdot:867022258605260840>
																						Archive Media <:gdot:867022258605260840>
																						Format Archive <:gdot:867022258605260840>` },
												],
												timestamp: new Date(),
												footer: { text: 'Discord Ban Appeal Manager', icon_url: interaction.client.user.avatarURL({ dynamic: true }) },
											}] });
											const logChannel = message.guild.channels.cache.find(channel => channel.name === 'logs');
											if ((typeof logChannel === 'undefined')) {
												interaction.followUp({ embeds: [{ color: 15088700, title:'<:warning:847479424583729213> Failed to log event', description:'Please create a channel with the name `logs` or run `/init` to format the server properly.\n\nThis channel will not delete automatically.', fields:[{
													name:'Responsible moderator',
													value:`${interaction.user.tag}`,
												}, {
													name:'Reason',
													value:`${embedCaseReason}`,
												}, {
													name:'HTML archive',
													value:`https://api.dbam.dev/${htmlPathName.substring(6)}`,
													inline:true,
												}, {
													name:'TXT archive',
													value:`https://api.dbam.dev/${txtPathName.substring(6)}`,
													inline:true,
												}],
												footer:{
													text: `Archive ID: ${archiveID}`,
												} }] });
											}
											else {
												logChannel.send({
													embeds: [{
														color: 16763724,
														title:`⚠ ${promiseUser.tag} (${promiseUser.id}) has been soft denied, this means they can join back and reappeal!`,
														fields:[{
															name:'Responsible moderator',
															value:`${interaction.user.tag}`,
														}, {
															name:'Reason',
															value:`${embedCaseReason}`,
														}, {
															name:'HTML archive',
															value:`https://api.dbam.dev/${htmlPathName.substring(6)}`,
															inline:true,
														}, {
															name:'TXT archive',
															value:`https://api.dbam.dev/${txtPathName.substring(6)}`,
															inline:true,
														}],
														footer:{
															text: `Archive ID: ${archiveID}`,
														},
													}],
												});
												setTimeout(() => {
													interaction.channel.delete().catch(e => {});
												}, 1000);
											}
											break;
										}
										default: {
											break;
										}
										}
									});
								}
								else {
									interaction.editReply('This is not an active case channel.');
								}
							});


						}

						else {
							interaction.editReply({ embeds: [{ color: 15548997, title:'<:DND:851523015057080340> Command can only be run in the appeal server!' }] });
						}
					}
					else {
						interaction.editReply({ content: 'This server is not linked, please run `/link`.', ephemeral: true });
					}
				});
			}
			else {
				interaction.editReply({ content: 'This server is not in the database, please run `/sync`.', ephemeral: true });
			}
		});

	},
};


function messageAttachmentDisplay(message) {
	if (typeof message.attachments.first() !== 'undefined') {
		switch (message.attachments.first().contentType) {
		case 'image/jpeg':
			return `<p><img src="${message.attachments.first().url}" alt="" style="max-width: 80vw;"></p>`;
		case 'image/png':
			return `<p><img src="${message.attachments.first().url}" alt="" style="max-width: 80vw;"></p>`;
		case 'image0.gif':
			return `<p><img src="${message.attachments.first().url}" alt="" style="max-width: 80vw;"></p>`;
		case 'application/zip':
			return `<p><img src="${message.attachments.first().url}" alt="" style="max-width: 80vw;"></p>`;
		default:
			return ' ';
		}
	}
	else {
		return `<p>${message.content}</p>`;
	}

}


async function collectMessages(channel) {
	const collectedMessages = [];
	let last_messageID;
	while (true) {
		const options = { limit: 100 };
		if (last_messageID) {
			options.before = last_messageID;
		}
		const messages = await channel.messages.fetch(options);
		collectedMessages.push(Array.from(messages));
		last_messageID = messages.last().id;
		if (messages.size != 100 || collectedMessages >= 2500) {
			break;
		}
	}
	return collectedMessages;
}

