const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('help')
		.setDescription('Replies with help command.'),
	async execute(client, interaction, con) {
		await interaction.deferReply({ ephemeral: true });
		await interaction.editReply({ embeds: [{
			color: 3092790,
			title:'❓ DBAM help',
			description:'Bellow you can find the basic set of DBAM commands.',
			fields: [{
				name: 'Case Handling',
				value: '• `/case approve` - Approves the current case.\n\n• `/case softdeny` - Kicks the member out of the appeal server so they can appeal again.\n\n• `/case deny` - Bans the member from the appeal server, revoking their ability to reappeal.',
			}, {
				name:'Server Management',
				value:'• `/link` - Links an appeal server to a parent server.\n\n• `/unlink` - Unlinks the current server from the linked server.\n\n• `/whitelist` - Adds or removes a user from the appeal whitelist.\n\n• `/sync` - Adds a server to the database if it wasn\'t already for some reason. (Also Syncs Slash Commands)',
			}, {
				name:'Still Need help?',
				value:'Join the support server: https://discord.gg/GGwB5rCam8',
			}],

		}], ephemeral: true });

	},
};
