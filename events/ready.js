module.exports = {
	name: 'ready',
	once: true,
	execute(client) {
		console.log(`Ready! Logged in as ${client.user.tag}`);
		client.user.setPresence({ activities: [{ name: `over ${Math.floor(client.guilds.cache.size/2)} servers!`, type:'WATCHING'}], status: 'dnd' });
	},
};