module.exports = {
	name: 'guildMemberAdd',
	execute(member,client,con) {
		let serverID = member.guild.id;
		//Checks if server is in DB
		let sql = `SELECT * FROM servers WHERE serverID = ${serverID}`;
		con.query(sql,async function (err, result) {
			if(result.length!==0){
				//Selects row from DB where link exists
				let sql = `SELECT * FROM linkedservers WHERE parentServer = '${serverID}' OR appealServer = '${serverID}'`;
				con.query(sql,function (err, result1){
					if (err){
						console.log(`Member joined an unlinked server!`);
					}else{
						if(result1.length!==0){
							let appealServer = client.guilds.cache.get(result1[0].appealServer);
							let parentServer = client.guilds.cache.get(result1[0].parentServer);
							if (serverID===parentServer.id)return;
							let mWhitelist = JSON.parse(result[0].whitelist);
							if ((mWhitelist.filter(entry=>entry===member.id).length>=1)) {
								let appealManager = member.guild.roles.cache.find(r => r.name === "Appeal Manager");
								member.roles.add(appealManager)
								return;
							}
							parentServer.bans.fetch(member).then(memberState => {
								let appealManager = member.guild.roles.cache.find(r => r.name === "Appeal Manager");
								member.guild.channels.create(`case #${Math.floor(Math.random()*(999+1))}`, {
									permissionOverwrites: [{
										id: member.guild.roles.everyone.id,
										deny: ['VIEW_CHANNEL'],
									},{
										id: member.id,
										allow: ['VIEW_CHANNEL'],
									},{
										id: appealManager,
										allow: ['VIEW_CHANNEL'],
									},{
										id: member.guild.me.id,
										allow: ['VIEW_CHANNEL'],
									}],
									position:499,
									rateLimitPerUser:10,
									topic:`${member.id} - DO NOT EDIT THE CHANNEL TOPIC`
								}).then(caseChannel => {
									member.client.api.channels(caseChannel.id).messages.post({
										data: {
											embed: {
												color: 3092790,
												title: `Ban Appeal for ${member.displayName}`,
												description: `Hi there ${member.displayName}\nPlease substanciate why you should be unbanned.\nAn <@&${appealManager.id}> will be here shortly.`,
												fields: [{
													name: 'Ban Reason',
													value: `${memberState.reason}`
												},{
													name:`Privacy Settings`,
													value:`In the meantime, please make sure your DMs are open so that you can recieve the verdict of your appeal.`
												}],
												image: {
													url:`https://cdn.discordapp.com/attachments/756644176795533334/857322582780018758/privacy.png`
												},
											},
										},
									});
								})
							}).catch(async err =>{
								//kicks members that aren't banned
								await member.send({embeds: [{color: 3092790,title:`You are not banned on ${parentServer.name}!`}],}).then(member.kick(`Not banned in ${parentServer.name}`))
                                .catch(e=>console.log(`Unable to DM user that joined ${appealServer.name}`))
							})
						}
					}
					
				});
			}else{
				console.log(`User joined a server not in the database`);
				var sql = `INSERT INTO servers (serverID) VALUES ('${serverID}')`;
				con.query(sql, function (err) {
					if (err){
						if (err.code === 'ER_DUP_ENTRY'){
							console.log("Bot joined a pre-existing server.");
						}
					}else{
						console.log("Server added to database.");
					}
				});
			}
		})
    },
};
