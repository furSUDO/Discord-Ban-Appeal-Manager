const { SlashCommandBuilder } = require('@discordjs/builders');
const requiredUserPermissions = ['MANAGE_MESSAGES'];
module.exports = {
	data: new SlashCommandBuilder()
		.setName('sync')
		.setDescription('Adds guild to databse, and syncs slash commands.'),
	async execute(client, interaction, con) {
		await interaction.deferReply({ ephemeral: true });
		const sql = `INSERT INTO servers (serverID) VALUES ('${interaction.guild.id}')`;
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
		con.query(sql, function(err) {
			if (err) {
				if (err.code === 'ER_DUP_ENTRY') {
					interaction.editReply({ embeds: [{ color: 15088700, title:'<:warning:847479424583729213> This server already exists in the database!' }] });
					con.query('SELECT * FROM linkedservers WHERE parentServer = ? OR appealServer = ?', [interaction.guild.id, interaction.guild.id], async function(err, res) {
						if (res.length !== 0) {
							const server = client.guilds.cache.get(res[0].appealServer);
							server.commands.set([
								{
									'name': 'case',
									'description': 'Handle Cases.',
									'options': [
										{
											'type': 1,
											'name': 'approve',
											'description': 'Approves a ban appeal.',
											'options': [
												{
													'type': 3,
													'name': 'reason',
													'description': 'Add a reason to this action.',
													'required': false,
												},
											],
										},
										{
											'type': 1,
											'name': 'deny',
											'description': 'Denies a ban appeal.',
											'options': [
												{
													'type': 3,
													'name': 'reason',
													'description': 'Add a reason to this action.',
													'required': false,
												},
											],
										},
										{
											'type': 1,
											'name': 'softdeny',
											'description': 'Soft-denies a ban appeal.',
											'options': [
												{
													'type': 3,
													'name': 'reason',
													'description': 'Add a reason to this action.',
													'required': false,
												},
											],
										},
									],
									'default_permission': true,
								},
								{
									'name': 'init',
									'description': 'Initial setup of appeal server.',
									'options': [],
								},
								{
									'name': 'whitelist',
									'description': 'Adds/Removes a user from the whitelist.',
									'options': [
										{
											'type': 1,
											'name': 'add',
											'description': 'Adds a user to the whitelist.',
											'options': [
												{
													'type': 3,
													'name': 'userid',
													'description': 'ID of user',
													'required': false,
												},
											],
										},
										{
											'type': 1,
											'name': 'remove',
											'description': 'Removes a user from the whitelist.',
											'options': [
												{
													'type': 3,
													'name': 'userid',
													'description': 'ID of user',
													'required': false,
												},
											],
										},
									],
								},
							]);
						}
					});

				}
			}
			else {
				interaction.editReply({ embeds: [{ color: 4437377, title:`<:verified:847476592837263361> Sucsessfully added _${interaction.guild.name}_ to the database!` }] });
			}
		});

	},
};
