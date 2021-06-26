module.exports = {
	name: 'guildCreate',
	execute(server,client,con) {
		var sql = `INSERT INTO servers (serverID) VALUES ('${server.id}')`;
		con.query(sql, function (err) {
			if (err){
				if (err.code === 'ER_DUP_ENTRY'){
					console.log("Bot joined a preexisiting server");
				}
			}else{
				console.log("bot joined a new server");
			}
		});
    },
};