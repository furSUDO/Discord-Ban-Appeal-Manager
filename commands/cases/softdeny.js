module.exports = {
	name: 'softdeny',
	description: 'deny the ban appeal',
	cooldown: 5,
	permissions: 'KICK_MEMBERS',
	async execute(client, message, args, appealID, masterID) {
        //DMs and kicks the user 
		const masterGuild = client.guilds.cache.find(guilds => guilds.id === masterID);
        const userID = message.channel.topic
        message.guild.members.fetch(userID).then(async guildMember => {
            await guildMember.send(`Your ban appeal for ${masterGuild.name} has been denied!\nJoin back in a while if you wish to reappeal`).catch(error => {
                message.channel.send(`failded to DM <@&${userID}>, Their DMs may be closed!`)
            })
            guildMember.kick().catch(error => {
                message.reply(`It seems that this user has already left.`)
            })
        })
        let closedCaseCategory = message.guild.channels.cache.find(c => c.name === "Closed Cases")
        message.channel.setParent(closedCaseCategory)
        //await message.guild.client.users.cache.get(userID).then(user => {
        //    user.send()
        //})
	},
};