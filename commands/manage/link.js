const { description } = require("../death/test");

//FINISHED
module.exports = {
	name: 'link',
	description: 'link master server to appeal server',
    usage: '<parentServerID> <appealServerID>',
	cooldown: 5,
    args: true,
	permissions: 'BAN_MEMBERS',
	execute(client, message, args, con) {
		//Checks Args length
		if(args.length===2){
			//Checks if server is in DB
			let sql = `SELECT * FROM servers WHERE serverID = ${message.guild.id}`;
			con.query(sql,function (err, result) {
				//Checks if server did exist
				if(result.length!==0){
					//Gets server ids from discord
					let supposedParent = client.guilds.cache.get(args[0])
					let supposedAppeal = client.guilds.cache.get(args[1]);
					//Checks if any value is null (OR Logic)
					if (!(typeof supposedParent === 'undefined'|| typeof supposedAppeal === 'undefined')) {
						//Incerts values into linked servers
						let sql = `INSERT INTO linkedservers (parentServer,appealServer) VALUES ('${supposedParent.id}','${supposedAppeal.id}')`;
						con.query(sql,function (err){
							if(err) {
								message.reply({embeds: [{color: 15088700,title:`<:warning:847479424583729213> One of those servers are already linked!`,description:`If you wish to unlink a server from DBAM, please run \`!unlink\` in a **linked server!**`}],})
								return;
							}
							message.reply({embeds: [{color: 4437377,title:`<:verified:847476592837263361> Sucsessfully linked _${supposedParent.name}_ to _${supposedAppeal.name}_!`,description:`**Don't forget to run \`!init\` in ${supposedAppeal.name}!**`}],})
						})
					}else{
						message.reply({embeds: [{color: 16763724,title:`I am not in one or more of those servers 🤔`,description:`Please make sure you have provided the correct server IDs!`}],})
					}
				}else{
					message.reply({embeds: [{color: 15088700,title:`<:warning:847479424583729213> Server not found in the database`,description:`please run \`!sync\` to add ${message.guild.id} to the database.`}],})
				}
			})
			
		}else{
			message.reply('You need to provide two server IDs, similar to this;'+'```!link parentServerID appealServerID```')
		}
	},
};