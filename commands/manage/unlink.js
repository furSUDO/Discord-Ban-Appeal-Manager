//FINISHED
module.exports = {
	name: 'unlink',
	description: 'link master server to appeal server',
	cooldown: 5,
	permissions: 'BAN_MEMBERS',
	execute(client, message, args, con) {
		let sql2 = `DELETE FROM linkedservers WHERE parentServer = '${message.guild.id}' OR appealServer = '${message.guild.id}'`;
		con.query(sql2, function (err,result) {
			console.log(result.affectedRows);
			if(result.affectedRows ===1){
				message.reply({embeds: [{color: 4437377,title:`<:verified:847476592837263361> Sucsessfully unlinked 2 servers!`}],})
			}else{
				message.reply({embeds: [{color: 15088700,title:`<:warning:847479424583729213> This Server is not linked to another server`,description:`Maybe try \`!link <parentServerID> <appealServerID>\` to link this server to another server! `}],})
			}
		});
	},
};