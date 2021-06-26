//FINISHED
const Discord = require('discord.js');
module.exports = {
	name: 'init',
	description: 'Creates the nesasery channels for operation',
	cooldown: 1,
	permissions: 'BAN_MEMBERS',
	async execute(client, message, args, con) {
        //Check if server is in Database
        let sql = `SELECT * FROM servers WHERE serverID = ${message.guild.id}`;
        con.query(sql,function (err, result) {
            //Check if server is linked
            if(result.length!==0){
                //Fetch parent and appeal IDs from Database
                let sql2 = `SELECT * FROM linkedservers WHERE parentServer = '${message.guild.id}' OR appealServer = '${message.guild.id}'`;
                con.query(sql2,async function (err, result){
                    if(result.length!==0){
                        if (result[0].appealServer === message.guild.id) {
                            if (!(message.guild.me.permissions.has(['MANAGE_CHANNELS','MANAGE_ROLES','MANAGE_GUILD','BAN_MEMBERS','MANAGE_MESSAGES']))) {
                                message.reply({
                                    embeds: [{
                                        color: 15088700,
                                        title:`<:warning:847479424583729213> WARNING <:warning:847479424583729213>`,
                                        description:`Please make sure I have all of the following permissions enabled:`,
                                        image:{url:`https://cdn.discordapp.com/attachments/756644176795533334/858360385022197780/DBAM_REQUIRED_PERMISSION_SCOPE.png`}
                                    }]
                                })
                                return;
                            }
                            if (message.guild.roles.highest.position > message.guild.me.roles.botRole.position) {
                                message.reply({
                                    embeds: [{
                                        color: 15088700,
                                        title:`<:warning:847479424583729213> WARNING <:warning:847479424583729213>`,
                                        description:`Please make sure I have the top-most role in the role hierarchy!`,
                                        image:{url:`https://cdn.discordapp.com/attachments/756644176795533334/858372642468528148/unknown.png`}
                                    }]
                                }).catch(e=>console.log(e))
                                return;
                            }
                            //message.reply({embeds: [{color: 4437377,title:`<:verified:847476592837263361> Sucsessfully linked`}],})
                            //cleans server
                            let botRole = message.guild.me.roles.botRole.name
                            let everyoneRole = message.guild.roles.everyone
                            await message.guild.channels.cache.filter(channel => channel.name !== "welcome").filter(channel => channel.name !== "logs").filter(channel => channel.name !== "invite").each(channel => channel.delete())
                            await message.guild.roles.cache.filter(role => role.name !== botRole).filter(role => role.name !== everyoneRole.name).each(role => role.delete())
                            //Creates Appeal Manager Role
                            let appealManager = message.guild.roles.create({
                                name: 'Appeal Manager',
                                permissions: ['MANAGE_MESSAGES', 'KICK_MEMBERS'],
                                color: "RED",
                                hoist: true,
                                mentionable: true,
                                reason: 'we needed a role for Super Cool People',
                            }).catch(error => {console.log(error)})
                            //Checks for pre-existing
                            let welcomeChannelState = message.guild.channels.cache.find(cn => cn.name === "welcome")
                            if ((typeof welcomeChannelState === 'undefined')) {

                                //Creates Welcome Channel
                                const welcomeChannel = message.guild.channels.create('welcome', {
                                    type: 'text',
                                    permissionOverwrites: [
                                        {id:everyoneRole.id,deny:['SEND_MESSAGES']},
                                        {id:message.guild.me.id,allow: ['SEND_MESSAGES']},
                                    ],
                                    position:0,
                                    reason: 'New channel added for welcome message' }
                                ).catch(error => {console.log(error)})

                                //Creates Invite Channel
                                appealManager.then(appealManager => {
                                    const inviteChannel = message.guild.channels.create('invite', {
                                        type: 'text',
                                        permissionOverwrites: [
                                            {id:everyoneRole.id,deny:['VIEW_CHANNEL']},
                                            {id:appealManager.id,allow: ['VIEW_CHANNEL']},
                                            {id:message.guild.me.id,allow: ['VIEW_CHANNEL']},
                                        ],
                                    })
                                    inviteChannel.then(inviteChannel =>{
                                        welcomeChannel.then(welcomeChannel => {
                                            welcomeChannel.createInvite({maxAge:0}).then(invite =>{
                                                message.guild.channels.cache.get(inviteChannel.id).send(`Link for your Appeal Server: ${invite.url}`);
                                            })
                                        })
                                    })
                                })

                                //Sends Welcome Embed
                                welcomeChannel.then(welcomeChannel => {
                                    const masterGuild = client.guilds.cache.find(guilds => guilds.id === result[0].parentServer);
                                    message.client.api.channels(welcomeChannel.id).messages.post({
                                        data: {
                                            embed: {
                                                color: 3092790,
                                                image:{url:'https://cdn.discordapp.com/attachments/756644176795533334/850028222569906206/Rules-Embed.gif'},
                                            },
                                        },
                                    }).catch(error => {console.log(error)})
                                    message.client.api.channels(welcomeChannel.id).messages.post({
                                        data: {
                                            embed: {
                                                title: `<:warning:847479424583729213> You have been banned from ${masterGuild.name}!`,
                                                description:`To appeal your ban, please reply to your ban case on the channel selector`,
                                                color: 3092790,
                                                image:{url:'https://cdn.discordapp.com/attachments/756644176795533334/847276996564353054/Embed_width.png'} ,
                                            },
                                        },
                                    }).catch(error => {console.log(error)})
                                }).catch(error => {console.log(error)})
                            }else{
                                welcomeChannelState.overwritePermissions([
                                    {id:everyoneRole.id,deny:['SEND_MESSAGES']},
                                    {id:message.guild.me.id,allow: ['SEND_MESSAGES']},
                                ], 'Locked user response.').catch(e=>console.log(e))
                            }
                            let logsChannelState = message.guild.channels.cache.find(cn => cn.name === "logs")
                            appealManager.then(appealManager => {
                            if ((typeof logsChannelState === 'undefined')) {
                                //Creates log channel
                                    message.guild.channels.create('logs', {
                                        type: 'text',
                                        permissionOverwrites: [
                                            {id:everyoneRole.id,deny:['VIEW_CHANNEL']},
                                            {id:appealManager.id,allow: ['VIEW_CHANNEL']},
                                            {id:message.guild.me.id,allow: ['VIEW_CHANNEL']},
                                        ],
                                        topic:`DO NOT RENAME CHANNEL`,
                                        position:1,
                                        reason: 'New channel added for approvals' }
                                    ).catch(error => {console.log(error)})
                                }else{
                                    logsChannelState.overwritePermissions([
                                        {id:everyoneRole.id,deny:['VIEW_CHANNEL']},
                                        {id:appealManager.id,allow: ['VIEW_CHANNEL']},
                                        {id:message.guild.me.id,allow: ['VIEW_CHANNEL']},
                                    ], 'Locked user response.').catch(e=>console.log(e))
                                    //trying to change channel permissions 
                                }
                            })
                                appealManager.then(appealManager =>{
                                message.member.roles.add(appealManager).catch(error => {console.log(error)})
                                message.guild.me.roles.add(appealManager).catch(error => {console.log(error)})
                            })
                        }else{
                            message.reply({embeds: [{color: 15548997,title:`<:DND:851523015057080340> Please run this command in the appeal server!`,description:`Due to it's destructive nature, this command can only be run in an appeal server.`}],})
                        }
                    }else{
                        message.reply({embeds: [{color: 15088700,title:`<:warning:847479424583729213> Server is not linked!`,description:`Please use \`!link <parentServerID> <appealServerID>\` to get started.`}],})
                    }
                })
            }else{
                message.reply({embeds: [{color: 15088700,title:`<:warning:847479424583729213> Server not found in the database`,description:`Please run \`!sync\` to add ${message.guild.id} to the database.`}],})
            }
        })
	},
};





