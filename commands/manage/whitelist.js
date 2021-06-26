//FINISHED
module.exports = {
	name: 'whitelist',
	description: 'Whitelists members',
	permissions: 'BAN_MEMBERS',
	cooldown: 5,
    args:true,
    usage:'add/remove <userID>',
	async execute(client, message, args, con) {
        //Checks if server is in DB
        let serverID = message.guild.id;
        let sql = `SELECT * FROM servers WHERE serverID = ${serverID}`;
        con.query(sql,function (err, result) {
            if(result.length!==0){
                //Selects row from DB where link exists
                let sql = `SELECT * FROM dbam.linkedservers WHERE parentServer = '${serverID}' OR appealServer = '${serverID}'`;
                con.query(sql,async function (err, result1){
                    if (err){
                        console.log(err);
                    }else{
                        if(result1.length!==0){
                            if (result1[0].appealServer === message.guild.id) {
                                let appealServer = client.guilds.cache.get(result1[0].appealServer);
                                let parentServer = client.guilds.cache.get(result1[0].parentServer);
                                switch (args[0]) {
                                    case "add":{
                                        parentServer.members.fetch(`${args[1]}`)
                                        .then((m)=>{
                                            let jsonStr = `${result[0].whitelist}`;
                                            let obj = JSON.parse(jsonStr)
                                            console.log(obj.filter(entry=>entry===m.id).length);
                                            if (obj.filter(entry=>entry===m.id).length>=1) {
                                                message.reply(`**${m.user.username}** is already on the whitelist`).catch(e=>console.log(e))
                                            }else{
                                                obj.push(m.id)
                                                jsonStr = JSON.stringify(obj)
                                                let sql = `UPDATE servers SET whitelist ='${jsonStr}' WHERE serverID = ${appealServer.id}`
                                                con.query(sql,async function(err,result){
                                                    if (err) {
                                                        console.log(err);
                                                    }else{
                                                        message.reply({embeds: [{color: 4437377,title:`<:verified:847476592837263361> **${m.user.username}** (${m.id}) has been sucsessfully added to the whitelist`}]}).catch(e=>console.log(e))
                                                    }
                                                })
                                            }
                                        }).catch(e=>{
                                            console.log(e);
                                            message.reply(`This user is not in ${parentServer.name}`).catch(e=>console.log(e))
                                        })
                                        break;
                                    }
                                    case "remove":{
                                        parentServer.members.fetch(`${args[1]}`)
                                        .then((m)=>{
                                            let jsonStr = `${result[0].whitelist}`;
                                            let obj = JSON.parse(jsonStr)
                                            if ((obj.filter(entry=>entry===m.id).length<=0)) {
                                                message.reply(`**${m.user.username}** is not on the whitelist`)
                                            }else{
                                                let newArray = obj.filter(e => e !== m.id);
                                                jsonStr = JSON.stringify(newArray)
                                                let sql = `UPDATE servers SET whitelist ='${jsonStr}' WHERE serverID = ${appealServer.id}`
                                                con.query(sql,async function(err,result){
                                                    if (err) {
                                                        console.log(err);
                                                    }else{
                                                        message.reply({embeds: [{color: 4437377,title:`<:verified:847476592837263361> **${m.user.username}** (${m.id}) has been sucsessfully removed from the whitelist`}]}).catch(e=>console.log(e))
                                                    }
                                                })
                                            }
                                        }).catch(e=>{
                                            console.log(e);
                                            message.reply(`This user is not in ${parentServer.name}`).catch(e=>console.log(e))
                                        })
                                        break;
                                    }
                                
                                    default:
                                        message.reply(`Please stipulate add/remove`).catch(e=>console.log(e))
                                        break;
                                }
                            }else{
                                message.reply({embeds: [{color: 15548997,title:`<:DND:851523015057080340> Please run this command in the appeal server!`,description:`Due to it's destructive nature, this command can only be run in an appeal server.`}],}).catch(e=>console.log(e))
                            }
                        }else{
                            message.reply({embeds: [{color: 15088700,title:`<:warning:847479424583729213> This Server is not linked to another server`,description:`Maybe try \`!link <parentServerID> <appealServerID>\` to link this server to another server! `}],}).catch(e=>console.log(e))
                        }
                    }
                })
            }else{
                message.reply({embeds: [{color: 15088700,title:`<:warning:847479424583729213> Server not found in the database`,description:`please run \`!sync\` to add ${message.guild.id} to the database.`}],}).catch(e=>console.log(e))
            }
        })
    }
}