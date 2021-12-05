module.exports = {
	name: 'guildDelete',
	execute(server, client, con) {
		const sql = `DELETE FROM servers WHERE serverID = '${server.id}'`;
		con.query(sql, function(err) {
			if (err) throw err;
			console.log(`Bot was removed from a server, thus removing ${server.name} from the DB.`);
		});
		const sql2 = `DELETE FROM linkedservers WHERE parentServer = '${server.id}' OR appealServer = '${server.id}'`;
		con.query(sql2, function(err, result) {
			if (result.affectedRows === '1') {
				console.log(`Also removed ${server.name} from linked database.`);
			}
		});
	},
};
