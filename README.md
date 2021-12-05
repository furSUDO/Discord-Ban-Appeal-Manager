<h1 align="center"> 🔨 DBAM </h1>
<h3 align="center">DBAM is an on-platform solution for managing ban appeals on your discord server.</h3> 

## 📩 Invite
#### [Click to invite DBAM to your servers](https://discord.com/api/oauth2/authorize?client_id=849755454208606228&permissions=268443700&scope=applications.commands%20bot)

## ⚙ Setup

#### 1 - Linking
Once DBAM has been added to **both** your main server and your appeal server run this command to link the two;
```
/link <parentServerID> <appealServerID>
``` 
#### 2 - Formatting
From there you will be prompted to run `/init` in the appeal server, this is so that the bot can set up everything with the right structure and permissions it needs. Due to this command's destructive nature, it can ONLY be run in the appeal server.

This can also be run at any time to fix any issues you may be experiencing.
#### 3 - Whitelisting
Since DBAM automatically kicks those who are not banned, you may want to whitelist your staff so that they can get in. Here is the command to add members to the whitelist; (note that whitelisted members are required to be on the main server)
```
/whitelist add/remove <userID>
```
#### 4 - That's it
##### No... seriously, that's it.

From here all you need to do is attach the invite link that DBAM made for you in the `#invite` channel to your ban messages.

## 🔧 Commands
### Case commands

| command | usage | description |
|---------|-------|-------------|
| approve  | ``/case approve [reason]`` | DMs and unbans the user, and archives the channel. |
| softdeny  | ``/case softdeny [reason]`` | Kicks the user and archives the case channel. |
| deny  | ``/case deny [reason]`` | Bans the user and archives the case channel. |

### Management commands

| command | usage | description |
|---------|-------|-------------|
| link  | ``/link <parentServerID> <appealServerID>`` | Links an appeal server to a main server. |
|unlink |``/unlink`` | Unlinks the current server from the linked server. |
|whitelist|`/whitelist <add/remove> <userID>`|Adds or removes a user from the appeal whitelist|
| sync  | ``/sync`` | Adds a server to the database if it wasn't already for some reason. |

## 🌍 This project is open source
This project is open for anyone to contribute to, thus pull requests are more than welcome!

The following part of this README will go over hosting your own DBAM bot.

## 🛠 Your own setup
#### MySQL server and NodeJS v14 is a prerequisite 
Setup is very easy, clone the repo, install dependencies by running ``npm i``, and edit the ``config.json`` file in the root directory that looks like this;
```json
{
	"prefix": "!",
	"token": "Bot Token",
	"sqlHost":"localhost",
	"sqlUser":"root",
	"sqlPassword":"password"
}
```

## Setting up some SQL
to create the servers table:
```sql
CREATE TABLE `servers` (
  `serverID` varchar(24) NOT NULL,
  `whitelist` varchar(8000) DEFAULT '[]',
  PRIMARY KEY (`serverID`)
)
```

to create the linked servers table:
```sql
CREATE TABLE `linkedservers` (
  `parentServer` varchar(24) NOT NULL,
  `appealServer` varchar(24) NOT NULL,
  PRIMARY KEY (`parentServer`,`appealServer`),
  UNIQUE KEY `parentServer` (`parentServer`),
  UNIQUE KEY `appealServer` (`appealServer`),
  CONSTRAINT `CHK_Crosslink` CHECK (`parentServer` <> `appealServer` or `parentServer` is null or `appealServer` is null)
)
```
you also need to create a trigger to prevent servers from being crosslinked. 

```sql
delimiter //
CREATE TRIGGER before_linkedservers_insert BEFORE INSERT 
    ON linkedservers FOR EACH ROW
    BEGIN 
      IF EXISTS(
        SELECT 1   
        FROM linkedservers   
        WHERE (
          appealServer = NEW.parentServer             
          OR parentServer = NEW.appealServer
        )  
      ) THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'DUPLICATED SERVER'; 
      END IF; 
    END//

delimiter ;
```



And that should be everything! :P

Enjoy!
