module.exports = {
	name: 'guildCreate',
	execute(server, client, con) {
		const sql = `INSERT INTO servers (serverID) VALUES ('${server.id}')`;
		con.query(sql, function(err) {
			if (err) {
				if (err.code === 'ER_DUP_ENTRY') {
					console.log('Bot joined a pre-existing server.');
				}
			}
			else {
				console.log(`Bot joined a new server. (${server.name})`);
			}
		});
	},
};
