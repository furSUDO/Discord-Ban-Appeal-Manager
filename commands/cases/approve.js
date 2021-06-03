module.exports = {
	name: 'approve',
	description: 'approve the ban appeal',
	cooldown: 5,
	permissions: 'KICK_MEMBERS',
	async execute(client, message, args, appealID, masterID, masterInvite) {
        //unbans user
		const masterGuild = client.guilds.cache.find(guilds => guilds.id === masterID);
        const userID = message.channel.topic
		masterGuild.members.unban(userID,{reason:`Ban Appeal approved by ${message.author.username}`}).catch(error=>{
            message.reply(`Failed to unban this user from ${masterGuild.name}\nHave they already been unbanned?`)
        })
        message.guild.members.fetch(userID).then(async guildMember => {
            await guildMember.send(`You have been unbanned from ${masterGuild.name}\nInvite: ${masterInvite}`).catch(error => {
                message.channel.send(`failded to DM <@&${userID}>, Their DMs may be closed!`)
            })
            guildMember.kick()
        }).catch(error => {
            message.reply(`It seems that this user has already left.`)
        })
        let closedCaseCategory = message.guild.channels.cache.find(c => c.name === "Closed Cases")
        message.channel.setParent(closedCaseCategory)
        //await message.guild.client.users.cache.get(userID).then(user => {
        //    user.send()
        //})
	},
};