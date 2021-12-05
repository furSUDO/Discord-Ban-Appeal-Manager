const cron = require('cron');
module.exports = {
	name: 'ready',
	once: true,
	execute(args, client, con) {
		console.log(`Ready! Logged in as ${client.user.tag}`);
		client.user.setPresence({ activities: [{ name: `over ${Math.floor(client.guilds.cache.size)} servers!`, type:'WATCHING' }], status: 'dnd' });
		// const status = new cron.CronJob('0 * * * *', async () => {
		const status = new cron.CronJob('* * * * *', async () => {
			randomStatus(client, con);
		});
		status.start();
	},
};

function f1(client) {
	client.user.setPresence({ activities: [{ name: `over ${Math.floor(client.guilds.cache.size)} servers!`, type:'WATCHING' }], status: 'dnd' });
}
function f2(client, con) {
	con.query('SELECT * FROM cases', function(err, res) {
		client.user.setPresence({ activities: [{ name: `over ${res.length} cases!`, type:'COMPETING' }], status: 'dnd' });
	});
}
function f3(client, con) {
	con.query('SELECT * FROM linkedservers', function(err, res) {
		client.user.setPresence({ activities: [{ name: `over ${res.length} links!`, type:'LISTENING' }], status: 'dnd' });
	});
}


function randomNum() {
	const i = Math.floor(Math.random() * 20) % 4;
	if (i <= 0) return randomNum();
	return i;
}
function randomStatus(client, res) {
	const i = randomNum();
	eval(`f${i}(client, res)`);
}