const { SlashCommandBuilder } = require('@discordjs/builders');
const requiredUserPermissions = ['ADMINISTRATOR'];
module.exports = {
	data: new SlashCommandBuilder()
		.setName('unlink')
		.setDescription('Unlinks a linked server.'),
	async execute(client, interaction, con) {
		await interaction.deferReply({ ephemeral: true });
		const sql2 = `DELETE FROM linkedservers WHERE parentServer = '${interaction.guild.id}' OR appealServer = '${interaction.guild.id}'`;
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
		con.query(sql2, function(err, result) {
			if (result.affectedRows === 1) {
				interaction.editReply({ embeds: [{ color: 4437377, title:'<:verified:847476592837263361> Sucsessfully unlinked 2 servers!' }] });
				interaction.guild.commands.set([]);
			}
			else {
				interaction.editReply({ embeds: [{ color: 15088700, title:'<:warning:847479424583729213> This Server is not linked to another server', description:'Maybe try `/link` to link this server to another server! ' }] });
				interaction.guild.commands.set([]);
			}
		});

	},
};
