//FINISHED
module.exports = {
	name: 'sync',
	description: 'Adds a server to the DB',
	permissions: 'BAN_MEMBERS',
	cooldown: 5,
	async execute(client, message, args, con) {
		var sql = `INSERT INTO servers (serverID) VALUES ('${message.guild.id}')`;
		con.query(sql, function (err) {
			if (err){
				if (err.code === 'ER_DUP_ENTRY'){
					message.reply({embeds: [{color: 15088700,title:`<:warning:847479424583729213> This server already exists in the database!`}],})
				}
			}else{
				message.reply({embeds: [{color: 4437377,title:`<:verified:847476592837263361> Sucsessfully added _${message.guild.name}_ to the database!`}],})
			}
		})
    }
}