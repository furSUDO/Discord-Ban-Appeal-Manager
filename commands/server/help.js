module.exports = {
    name: 'help',
    description: 'help command',
    cooldown: 5,
    async execute(client, message) {
            message.reply({embeds: [{
color: 3092790,
title:`❓ DBAM help`,
description:`Bellow you can find the basic set of DBAM commands.`,
fields: [{
    name: 'Case Handling',
    value: `• \`!approve\` - Approves the current case.\n\n• \`!softdeny\` - Kicks the member out of the appeal server so they can appeal again.\n\n• \`!deny\` - Bans the member from the appeal server, revoking their ability to reappeal.`
},{
    name:`Server Management`,
    value:`• \`!link <parentServerID> <appealServerID>\` - Links an appeal server to a parent server.\n\n• \`!unlink\` - Unlinks the current server from the linked server.\n\n• \`!whitelist <add/remove> <userID>\` - Adds or removes a user from the appeal whitelist.\n\n• \`!sync\` - Adds a server to the database if it wasn't already for some reason. `
},{
    name:`Still Need help?`,
    value:`Join the support server: https://discord.gg/GGwB5rCam8`
}],

}],})

}
}