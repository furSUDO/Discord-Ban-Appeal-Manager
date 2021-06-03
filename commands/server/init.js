const Discord = require('discord.js');
module.exports = {
	name: 'init',
	description: 'Creates the nesasery channels for operation',
	cooldown: 5,
	permissions: 'BAN_MEMBERS',
	async execute(client, message, args, appealID, masterID) {
        if (message.channel.guild.id === appealID) {
            //cleans server
            message.guild.channels.cache.each(channel => channel.delete())
            message.guild.roles.cache.filter(role => role.name === "SBAS" && role.name === "everyone").each(role => role.delete())
            const everyoneRole = message.guild.roles.everyone
            //creates roles and channels
            const appealManager = message.guild.roles.create({
                data: {
                    name: 'Appeal Manager',
                    permissions: ['MANAGE_MESSAGES', 'KICK_MEMBERS'],
                    color: "RED",
                    hoist: true,
                    mentionable: true
                }
            }).catch(error => {console.log(error)})
            
            appealManager.then(appealManager => {
                message.member.roles.add(appealManager)
                message.guild.channels.create('appeals', {
                    type: 'text',
                    permissionOverwrites: [
                        {id:everyoneRole.id,deny:['VIEW_CHANNEL']},
                        {id: appealManager.id,allow: ['VIEW_CHANNEL']},
                    ],
                    position:1,
                    reason: 'New channel added for approvals' }
                ).catch(error => {console.log(error)})
                
                const caseCategory = message.guild.channels.create('Open Cases', {
                    type: 'category',
                    permissionOverwrites: [
                        {id:everyoneRole.id,deny:['VIEW_CHANNEL']},
                        {id: appealManager.id,allow: ['VIEW_CHANNEL']},
                    ],
                    position:2,
                    reason: 'New category added for cases' }
                ).catch(error => {console.log(error)})
                caseCategory.then(caseCategory => {
                    const inviteChannel = message.guild.channels.create('invite-code', { parent: caseCategory }).catch(error => {console.log(error)})
                    inviteChannel.then(inviteChannel =>{
                        welcomeChannel.then(welcomeChannel => {
                            const invite = welcomeChannel.createInvite({maxAge:0}).then(invite =>{
                                message.guild.channels.cache.get(inviteChannel.id).send(`Link for your Appeal Server: ${invite.url}`);
                            })
                        })
                    })
                })
                const closedCaseCategory = message.guild.channels.create('Closed Cases', {
                    type: 'category',
                    permissionOverwrites: [
                        {id:everyoneRole.id,deny:['VIEW_CHANNEL']},
                        {id: appealManager.id,allow: ['VIEW_CHANNEL']},
                    ],
                    position:3,
                    reason: 'New category added for closed cases' }
                ).catch(error => {console.log(error)})
            })

            const welcomeChannel = message.guild.channels.create('welcome', {
                type: 'text',
                permissionOverwrites: [
                    {id:everyoneRole.id,deny:['SEND_MESSAGES']},
                ],
                position:0,
                reason: 'New channel added for welcome message' }
            ).catch(error => {console.log(error)})
            
            
            
            //assigns perms to channels
            welcomeChannel.then(welcomeChannel => {
                const masterGuild = client.guilds.cache.find(guilds => guilds.id === masterID);
                message.client.api.channels(welcomeChannel.id).messages.post({
                    data: {
                        embed: {
                            color: 3092790,
                            image:{url:'https://cdn.discordapp.com/attachments/756644176795533334/850028222569906206/Rules-Embed.gif'},
                        },
                    },
                });
                message.client.api.channels(welcomeChannel.id).messages.post({
                    data: {
                        embed: {
                            title: `<:warning:847479424583729213> You have been banned from ${masterGuild.name}!`,
                            description:`To appeal your ban, please reply to your ban case on the channel selector`,
                            color: 3092790,
                            image:{url:'https://cdn.discordapp.com/attachments/756644176795533334/847276996564353054/Embed_width.png'} ,
                        },
                    },
                });
            }).catch(error => {console.log(error)})
        }else{
            message.reply(`This is not the appeal server!\nNo changes made.\nFor proper usage look at the GitHub README`)
        }

	},
};