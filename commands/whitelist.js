const { SlashCommandBuilder } = require('@discordjs/builders');
const requiredUserPermissions = ['MANAGE_MESSAGES'];
module.exports = {
	data: new SlashCommandBuilder()
		.setName('whitelist')
		.setDescription('Adds/Removes a user from the whitelist.')
		.addSubcommand(subcommand =>
			subcommand
				.setName('add')
				.setDescription('Adds a user to the whitelist.')
				.addStringOption(option => option.setName('userid').setDescription('ID of user')),
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('remove')
				.setDescription('Removes a user from the whitelist.')
				.addStringOption(option => option.setName('userid').setDescription('ID of user')),
		),
	async execute(client, interaction, con) {
		await interaction.deferReply({ ephemeral: true });
		// Checks if server is in DB
		const serverID = interaction.guild.id;
		const sql = `SELECT * FROM servers WHERE serverID = ${serverID}`;
		con.query(sql, function(err, res) {
			if (res.length !== 0) {
				// Selects row from DB where link exists
				const sql = `SELECT * FROM linkedservers WHERE parentServer = '${serverID}' OR appealServer = '${serverID}'`;
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
				con.query(sql, async function(err, res1) {
					if (err) {
						(() => {});
					}
					else if (res1.length !== 0) {
						if (res1[0].appealServer === interaction.guild.id) {
							const appealServer = client.guilds.cache.get(res1[0].appealServer);
							const parentServer = client.guilds.cache.get(res1[0].parentServer);
							const subCommand = interaction.options.getSubcommand('whitelist');
							const userID = interaction.options.getString('userid');
							switch (subCommand) {
							case 'add':{
								parentServer.members.fetch(`${userID}`)
									.then((m) => {
										let jsonStr = `${res[0].whitelist}`;
										const obj = JSON.parse(jsonStr);
										if (obj.filter(entry => entry === m.id).length >= 1) {
											interaction.editReply(`**${m.user.username}** is already on the whitelist`).catch(() => {});
										}
										else {
											obj.push(m.id);
											jsonStr = JSON.stringify(obj);
											const sql = `UPDATE servers SET whitelist ='${jsonStr}' WHERE serverID = ${appealServer.id}`;
											con.query(sql, async function(err, res) {
												if (err) {
													(() => {});
												}
												else {
													interaction.editReply({ embeds: [{ color: 4437377, title:`<:verified:847476592837263361> **${m.user.username}** (${m.id}) has been sucsessfully added to the whitelist` }] }).catch(() => {});
												}
											});
										}
									}).catch(() => {
										interaction.editReply(`This user is not in ${parentServer.name}`).catch(() => {});
									});
								break;
							}
							case 'remove':{
								parentServer.members.fetch(`${userID}`)
									.then((m) => {
										let jsonStr = `${res[0].whitelist}`;
										const obj = JSON.parse(jsonStr);
										if ((obj.filter(entry => entry === m.id).length <= 0)) {
											interaction.editReply(`**${m.user.username}** is not on the whitelist`);
										}
										else {
											const newArray = obj.filter(e => e !== m.id);
											jsonStr = JSON.stringify(newArray);
											const sql = `UPDATE servers SET whitelist ='${jsonStr}' WHERE serverID = ${appealServer.id}`;
											con.query(sql, async function(err, res) {
												if (err) {
													(() => {});
												}
												else {
													interaction.editReply({ embeds: [{ color: 4437377, title:`<:verified:847476592837263361> **${m.user.username}** (${m.id}) has been sucsessfully removed from the whitelist` }] }).catch(() => {});
												}
											});
										}
									}).catch(() => {
										interaction.editReply(`This user is not in ${parentServer.name}`).catch(e => {console.log(e);});
									});
								break;
							}

							default:
								interaction.editReply('Please stipulate add/remove').catch(() => {});
								break;
							}
						}
						else {
							interaction.editReply({ embeds: [{ color: 15548997, title:'<:DND:851523015057080340> Please run this command in the appeal server!', description:'Due to it\'s destructive nature, this command can only be run in an appeal server.' }] }).catch(() => {});
						}
					}
					else {
						interaction.editReply({ embeds: [{ color: 15088700, title:'<:warning:847479424583729213> This Server is not linked to another server', description:'Maybe try `/link` to link this server to another server! ' }] }).catch(() => {});
					}
				});
			}
			else {
				interaction.editReply({ embeds: [{ color: 15088700, title:'<:warning:847479424583729213> Server not found in the database', description:`please run \`/sync\` to add ${interaction.guild.id} to the database.` }] }).catch(() => {});
			}
		});

	},
};
