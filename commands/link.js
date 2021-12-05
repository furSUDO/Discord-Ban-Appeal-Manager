const { SlashCommandBuilder } = require('@discordjs/builders');
const requiredUserPermissions = ['ADMINISTRATOR'];

module.exports = {
	data: new SlashCommandBuilder()
		.setName('link')
		.setDescription('Links Main server to Appeal server.')
		.addStringOption(option => option.setName('parent').setDescription('ID of parent server.').setRequired(true))
		.addStringOption(option => option.setName('appeal').setDescription('ID of appeal server.').setRequired(true)),
	async execute(client, interaction, con) {
		const parent = interaction.options.getString('parent');
		const appeal = interaction.options.getString('appeal');
		await interaction.deferReply({ ephemeral: true });
		if (interaction.member.permissions.has(requiredUserPermissions)) {
			// Checks if server is in DB
			con.query('SELECT * FROM servers WHERE serverID = ?', [interaction.guild.id], function(err, result) {
				// Checks if server did exist
				if (result.length !== 0) {
					// Gets server ids from discord
					const supposedParent = client.guilds.cache.get(parent);
					const supposedAppeal = client.guilds.cache.get(appeal);
					// Checks if any value is null (OR Logic)
					if (!(typeof supposedParent === 'undefined' || typeof supposedAppeal === 'undefined')) {
						// Incerts values into linked servers
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
						con.query('INSERT INTO linkedservers (parentServer,appealServer) VALUES (?,?)', [supposedParent.id, supposedAppeal.id], function(err) {
							if (err) {
								interaction.editReply({ embeds: [{ color: 15088700, title:'<:warning:847479424583729213> One of those servers are already linked!', description:'If you wish to unlink a server from DBAM, please run `/unlink` in a **linked server!**' }] });
								return;
							}
							interaction.editReply({ embeds: [{ color: 4437377, title:`<:verified:847476592837263361> Sucsessfully linked _${supposedParent.name}_ to _${supposedAppeal.name}_!`, description:`**Don't forget to run \`/init\` in ${supposedAppeal.name}!**` }] });
							supposedAppeal.commands.set([
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
							], supposedAppeal.id);
						});
					}
					else {
						interaction.editReply({ embeds: [{ color: 16763724, title:'I am not in one or more of those servers 🤔', description:'Please make sure you have provided the correct server IDs!' }] });
					}
				}
				else {
					interaction.editReply({ embeds: [{ color: 15088700, title:'<:warning:847479424583729213> Server not found in the database', description:`please run \`/sync\` to add ${interaction.guild.id} to the database.` }] });
				}
			});
		}
		else {
			interaction.editReply({
				embeds: [{
					color: 3092790,
					title: 'Invalid Permissions',
					description: 'You do not have the permissions required to run this command!\nOnly server Administators can run this command.',
					fields: [{ name: 'Required Permissions', value: `${requiredUserPermissions}` }],
					image: { url: 'https://cdn.discordapp.com/attachments/756644176795533334/847276996564353054/Embed_width.png' },
					timestamp: new Date(),
					footer: { text: 'Discord Ban Appeal Manager', icon_url: interaction.client.user.avatarURL({ dynamic: true }) },
				}], ephemeral: true,
			});
		}
	},
};
