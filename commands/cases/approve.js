const fsPromises = require('fs').promises;
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const wait = require('util').promisify(setTimeout);
module.exports = {
	name: 'approve',
	description: 'Approve the ban appeal.',
	cooldown: 5,
	permissions: 'KICK_MEMBERS',
	async execute(client, message, args, con) {
        //Checks if server is in DB
        let serverID = message.guild.id;
		let sql = `SELECT * FROM servers WHERE serverID = ${serverID}`;
		con.query(sql,function (err, result) {
			if(result.length!==0){
				//Selects row from DB where link exists
				let sql = `SELECT * FROM linkedservers WHERE parentServer = '${serverID}' OR appealServer = '${serverID}'`;
				con.query(sql,async function (err, result){
					if (err){
                        console.log(err);
                    }else{
                        if(result.length!==0){
                            if (result[0].appealServer === message.guild.id) {
                                let userID = message.channel.topic
                                if (userID === null) {message.reply(`This is not an active case channel.`);return;}
                                userID = userID.substring(0, 18)
                                message.guild.members.fetch(userID, {force: true} ).then(async guildMember => {
                                    let appealServer = client.guilds.cache.get(result[0].appealServer);
                                    let parentServer = client.guilds.cache.get(result[0].parentServer);
                                    if (!(appealServer.me.permissions.has(['MANAGE_CHANNELS','MANAGE_ROLES','MANAGE_GUILD','BAN_MEMBERS','KICK_MEMBERS','MANAGE_MESSAGES']) || parentServer.me.permissions.has(['MANAGE_CHANNELS','MANAGE_ROLES','MANAGE_GUILD','BAN_MEMBERS','MANAGE_MESSAGES']))) {
                                        message.reply({
                                            embeds: [{
                                                color: 15088700,
                                                title:`<:warning:847479424583729213> WARNING <:warning:847479424583729213>`,
                                                description:`Please make sure I have been given all of the following permissions in both ${parentServer.name}, and in here.`,
                                                image:{url:`https://cdn.discordapp.com/attachments/756644176795533334/866994443529224192/DBAM_REQUIRED_PERMISSION_SCOPE.png`}
                                            }]
                                        })
                                        return;
                                    }
                                    
                                    const parentGuild = client.guilds.cache.find(guilds => guilds.id === parentServer.id);
                                    parentGuild.members.unban(userID,`Ban appeal approved by ${message.author.username}`).catch(e=>{
                                        console.log(e);
                                        message.reply(`Failed to unban this user from ${parentGuild.name}\nHave they already been unbanned?`);
                                    })
                                    parentGuild.fetchInvites().then(async invites => {
                                        let parentInvite = invites.first()

                                        guildMember.send(`You have been unbanned from ${parentGuild.name}\nInvite: discord.gg/${parentInvite.code}`)
                                        .catch(async error => {
                                            message.channel.send(`<@${userID}> you have been unbanned!\nYou will get kicked from the appeal server in 10 seconds.`)
                                            
                                            let everyoneRole = message.guild.roles.everyone
                                            message.channel.overwritePermissions([{id:everyoneRole.id,deny:['SEND_MESSAGES']},], 'Locked user response.');
                                            await wait(10000);
                                        })
                                        .finally(()=>guildMember.kick()).catch(e=>console.log(e));
                                        
                                    })
                                    message.channel.messages.fetch({ limit: 100 })
                                    .then(async messages =>{
                                        await fsPromises.mkdir(`./api/archives/${parentServer.id}/${guildMember.user.id}/`,{ recursive: true })
                                        const writeStream = fs.createWriteStream(`./api/archives/${parentServer.id}/${guildMember.user.id}/${uuidv4()}.txt`);
                                        const pathName = writeStream.path;
                                        writeStream.write(`Ban appeal log for ${guildMember.user.username} (${guildMember.user.id}) - ${message.channel.createdAt}\n\n`)
                                        messages = messages.sort()
                                        messages.forEach(message => {
                                            writeStream.write(`[${message.channel.name}] [${message.author.id}] ${message.author.username}#${message.author.discriminator}: ${message.content}\n`)
                                        });
                                        writeStream.on('error', (err) => {
                                            console.error(`There is an error writing the file ${pathName} => ${err}.`)
                                        });
                                        writeStream.end();
                                        //Logging
                                        let logChannel = message.guild.channels.cache.find(channel => channel.name === "logs")
                                        if ((typeof logChannel === 'undefined')) {
                                            setTimeout(() => {
                                            message.reply({embeds: [{color: 15088700,title:`<:warning:847479424583729213> Failed to log event`,description:`Please create a channel with the name \`logs\` or run \`!init\` to format the server properly.\n\nThis channel will not delete automatically.`,fields:[{
                                                name:`Conversation Archive`,
                                                value:`https://api.dbam.dev/${pathName.substring(6)}`
                                            }]}],}).catch(e=>console.log(e))
                                            }, 10000);
                                        }else{
                                            logChannel.send({
                                                embeds: [{
                                                    color: 4437377,
                                                    title:`<:verified:847476592837263361> ${guildMember.user.username} (${guildMember.user.id}) has been unbanned from ${parentGuild.name}.`,
                                                    fields:[{
                                                        name:`Responsible moderator`,
                                                        value:`${message.author.username}`
                                                    },{
                                                        name:`Conversation archive`,
                                                        value:`https://api.dbam.dev/${pathName.substring(6)}`
                                                    }]
                                                }]
                                            }).catch(e=>console.log(e))
                                            setTimeout(() => {
                                                message.channel.delete().catch(e=>console.log(e))
                                            }, 10000);
                                        }
                                    }).catch(e=>console.log(e));
                                }).catch(e=>{
                                    message.reply(`This member has left the appeal server, attempting to proceed with action.`)
                                    let appealServer = client.guilds.cache.get(result[0].appealServer);
                                    let parentServer = client.guilds.cache.get(result[0].parentServer);
                                    if (!(appealServer.me.permissions.has(['MANAGE_CHANNELS','MANAGE_ROLES','MANAGE_GUILD','BAN_MEMBERS','KICK_MEMBERS','MANAGE_MESSAGES']) || parentServer.me.permissions.has(['MANAGE_CHANNELS','MANAGE_ROLES','MANAGE_GUILD','BAN_MEMBERS','MANAGE_MESSAGES']))) {
                                        message.reply({
                                            embeds: [{
                                                color: 15088700,
                                                title:`<:warning:847479424583729213> WARNING <:warning:847479424583729213>`,
                                                description:`Please make sure I have been given all of the following permissions in both ${parentServer.name}, and in here.`,
                                                image:{url:`https://cdn.discordapp.com/attachments/756644176795533334/866994443529224192/DBAM_REQUIRED_PERMISSION_SCOPE.png`}
                                            }]
                                        })
                                        return;
                                    }
                                    const parentGuild = client.guilds.cache.find(guilds => guilds.id === parentServer.id);
                                    parentGuild.members.unban(userID,`Ban appeal approved by ${message.author.username}`).catch(e=>{
                                        console.log(e);
                                        message.reply(`Failed to unban this user from ${parentGuild.name}.\nHave they already been unbanned?`);
                                    })
                                    message.channel.messages.fetch({ limit: 100 })
                                    .then(async messages =>{
                                        guildMember = await client.users.fetch(userID)
                                        await fsPromises.mkdir(`./api/archives/${parentServer.id}/${guildMember.id}/`,{ recursive: true })
                                        const writeStream = fs.createWriteStream(`./api/archives/${parentServer.id}/${guildMember.id}/${uuidv4()}.txt`);
                                        const pathName = writeStream.path;
                                        writeStream.write(`Ban appeal log for ${guildMember.username} (${guildMember.id}) - ${message.channel.createdAt}\n\n`)
                                        messages = messages.sort()
                                        messages.forEach(message => {
                                            writeStream.write(`[${message.channel.name}] [${message.author.id}] ${message.author.username}#${message.author.discriminator}: ${message.content}\n`)
                                        });
                                        writeStream.on('error', (err) => {
                                            console.error(`There is an error writing the file ${pathName} => ${err}.`)
                                        });
                                        writeStream.end();
                                        //Logging
                                        let logChannel = message.guild.channels.cache.find(channel => channel.name === "logs")
                                        if ((typeof logChannel === 'undefined')) {
                                            setTimeout(() => {
                                            message.reply({embeds: [{color: 15088700,title:`<:warning:847479424583729213> Failed to log event`,description:`Please create a channel with the name \`logs\` or run \`!init\` to format the server properly.\n\nThis channel will not delete automatically.`,fields:[{
                                                name:`Conversation archive`,
                                                value:`https://api.dbam.dev/${pathName.substring(6)}`
                                            }]}],}).catch(e=>console.log(e))
                                            }, 10000);
                                        }else{
                                            logChannel.send({
                                                embeds: [{
                                                    color: 4437377,
                                                    title:`<:verified:847476592837263361> ${guildMember.username} (${guildMember.id}) has been unbanned from ${parentGuild.name}.`,
                                                    fields:[{
                                                        name:`Responsible moderator`,
                                                        value:`${message.author.username}`
                                                    },{
                                                        name:`Conversation archive`,
                                                        value:`https://api.dbam.dev/${pathName.substring(6)}`
                                                    }]
                                                }]
                                            }).catch(e=>console.log(e))
                                            setTimeout(() => {
                                                message.channel.delete().catch(e=>console.log(e))
                                            }, 100);
                                        }
                                    })
                                });
                            }else{
                                message.reply({embeds: [{color: 15548997,title:`<:DND:851523015057080340> Please run this command in the appeal server!`,description:`Due to it's destructive nature, this command can only be run in an appeal server.`}],})
                            }
                        }else{
                            message.reply({embeds: [{color: 15088700,title:`<:warning:847479424583729213> This Server is not linked to another server`,description:`Maybe try \`!link <parentServerID> <appealServerID>\` to link this server to another server! `}],})
                        }
                    }
                })
            }else{
                message.reply({embeds: [{color: 15088700,title:`<:warning:847479424583729213> Server not found in the database`,description:`please run \`!sync\` to add ${message.guild.id} to the database.`}],})
            }
        })
	},
};
