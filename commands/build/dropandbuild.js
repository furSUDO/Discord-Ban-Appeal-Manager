//FINISHED
module.exports = {
	name: 'dropandbuild',
	description: 'Adds a server to the DB',
	permissions: 'BAN_MEMBERS',
	cooldown: 5,
	async execute(client, message, args, con) {
		var sql = `
        CREATE TRIGGER before_linkedservers_insert BEFORE INSERT 
                ON linkedservers
                FOR EACH ROW BEGIN  IF EXISTS(
                    SELECT
                        1   
                FROM
                    linkedservers   
                WHERE
                    (
                        appealServer = NEW.parentServer             
                        OR parentServer = NEW.appealServer
                    )  
            )THEN            SIGNAL SQLSTATE '45000'             
        SET
            MESSAGE_TEXT = 'DUPLICATED SERVER';
        
    END IF;
        
    END`;
		con.query(sql, function (err,result) {
			if (err){
			}
            console.log(result);
		})
    }
}