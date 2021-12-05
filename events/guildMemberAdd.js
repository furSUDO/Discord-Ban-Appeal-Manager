const { v4: uuidv4 } = require('uuid');
const requiredBotPermissions = ['MANAGE_CHANNELS', 'MANAGE_ROLES', 'MANAGE_GUILD', 'BAN_MEMBERS', 'KICK_MEMBERS', 'MANAGE_MESSAGES', 'CREATE_INSTANT_INVITE'];
module.exports = {
	name: 'guildMemberAdd',
	execute(member, client, con) {
		const archiveID = uuidv4();
		const serverID = member.guild.id;
		con.query('SELECT * FROM servers WHERE serverID = ?', [serverID], async function(err, result) {
			if (result !== 0) {
				con.query('SELECT * FROM linkedservers WHERE parentServer = ? OR appealServer = ?', [serverID, serverID], async function(err, result1) {
					if (result1.length !== 0) {
						const appealServer = client.guilds.cache.get(result1[0].appealServer);
						const parentServer = client.guilds.cache.get(result1[0].parentServer);
						if (serverID != appealServer.id) return;
						if (member.guild.roles.highest.position > member.guild.me.roles.botRole.position) {
							member.guild.channels.cache.first().send({
								embeds: [{
									color: 15088700,
									title:'<:warning:847479424583729213> WARNING <:warning:847479424583729213>',
									description:'Please make sure I have the top-most role in the role hierarchy!',
									image:{ url:'https://cdn.discordapp.com/attachments/756644176795533334/858372642468528148/unknown.png' },
								}],
							}).catch(e => {});
							return;
						}
						const appealManager = member.guild.roles.cache.find(r => r.name === 'Appeal Manager');
						if (appealManager == undefined) {
							member.guild.channels.cache.first().send({
								embeds: [{
									color: 15088700,
									title: '<:warning:847479424583729213> WARNING <:warning:847479424583729213>',
									description: 'A role called `Appeal Manager` does not exist.\nPlease either run `/init` or create the role manually.',
								}], ephemeral: true,
							}).catch(e => {/* Don't crash pls*/ });
							return;
						}
						if (!(appealServer.me.permissions.has(requiredBotPermissions) && parentServer.me.permissions.has(requiredBotPermissions))) {
							member.guild.channels.cache.first().send({
								embeds: [{
									color: 15088700,
									title: '<:warning:847479424583729213> WARNING <:warning:847479424583729213>',
									description: `Please make sure I have been given all of the following permissions in both ${parentServer.name}, and in here.`,
									image: { url: 'https://media.discordapp.net/attachments/756644176795533334/910842822603730944/DBAM_REQUIRED_PERMISSION_SCOPE.png' },
								}], ephemeral: true,
							}).catch(() => {/* Don't crash pls*/ });
							return;
						}
						const mWhitelist = JSON.parse(result[0].whitelist);
						if ((mWhitelist.filter(entry => entry === member.id).length >= 1)) {
							const appealManager = member.guild.roles.cache.find(r => r.name === 'Appeal Manager');
							member.roles.add(appealManager);
							return;
						}
						parentServer.bans.fetch(member).then(async memberState => {
							const appealManager = member.guild.roles.cache.find(r => r.name === 'Appeal Manager');
							const caseChannel = await member.guild.channels.create('new case', {
								permissionOverwrites: [{
									id: member.guild.roles.everyone.id,
									deny: ['VIEW_CHANNEL'],
								}, {
									id: member.id,
									allow: ['VIEW_CHANNEL'],
								}, {
									id: appealManager,
									allow: ['VIEW_CHANNEL'],
								}, {
									id: member.guild.me.id,
									allow: ['VIEW_CHANNEL'],
								}],
								position:499,
								rateLimitPerUser:10,
								topic:`${member.displayName} - Ban Reason: ${memberState.reason}`,
							});
							let caseCount;
							con.query('SELECT * FROM cases WHERE serverID = ?', [appealServer.id], function(err, result2) {
								if (err) {
									console.log('idfk what this does lol');
									return;
								}
								else if (result2.length >= 0) {
									caseCount = result2.length + 1;
									con.query('INSERT INTO cases (serverID, userID, caseNumber, archiveID, channelID) VALUES (?, ?, ?, ?, ?)', [serverID, member.id, caseCount, archiveID, caseChannel.id]);
								}
								caseChannel.edit({ name:`case ${caseCount}` });
								member.client.api.channels(caseChannel.id).messages.post({
									data: {
										embed: {
											color: 3092790,
											title: `Ban Appeal for ${member.displayName}`,
											description: `Hi there ${member.displayName}\nPlease substanciate why you should be unbanned.\nAn <@&${appealManager.id}> will be here shortly.`,
											fields: [{
												name: 'Ban Reason',
												value: `${memberState.reason}`,
											}, {
												name:'Privacy Settings',
												value:'In the meantime, please make sure your DMs are open so that you can recieve the verdict of your appeal.',
											}],
											image: {
												url:'https://cdn.discordapp.com/attachments/756644176795533334/857322582780018758/privacy.png',
											},
										},
									},
								});
							});
						}).catch(async err => {
							// kicks members that aren't banned
							await member.send({ embeds: [{ color: 3092790, title:`You are not banned on ${parentServer.name}!` }] }).then(member.kick(`Not banned in ${parentServer.name}`))
								.catch(e => console.log(`Unable to DM user that joined ${appealServer.name}`));
							return;
						});
					}
				});
			}
			else {
				const sql = `INSERT INTO servers (serverID) VALUES ('${serverID}')`;
				con.query(sql, function(err) {
					if (err) {
						if (err.code === 'ER_DUP_ENTRY') {
							console.log('Bot joined a pre-existing server.');
						}
					}
					else {
						console.log('Server added to database.');
					}
				});
			}
		});
	},
};
