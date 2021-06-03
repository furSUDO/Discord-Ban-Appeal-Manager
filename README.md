![DBAM](https://github.com/furSUDO/Discord-Ban-Appeal-Manager/blob/main/github/Rules-Embed.gif?raw=true) 
---
[![Language](https://img.shields.io/badge/JavaScript-purple.svg?style=plastic&colorB=ff4e4e)]()

Discord Ban Appeal Manager (DBAM) is a a fully customizable Ban Appeal system for your server

You will soon be able to have the official bot join your team, but if you wish to start using the manager now, you can host an instance yourself!

## Setup
Settup is very easy, clone the repo, install dependincies by running ``npm i``, and create a ``config.json`` file in the root directory that looks like this;
```json
{
	"prefix": "!",
	"token": "token",
	"masterID":"756644176610721842",
	"appealID":"850083016986591293",
	"masterInvite":"discord.gg/sudo"
}
```
create an entirely new discord server, dedicated to ban appeals.
Once the bot is in both guilds and you have changed the ``masterID`` and ``appealID`` in the ``config.json`` to match the corrisponding servers... start the bot, and use ``!init`` in the appeal server.
It's at this point where you can kick back and relax, as the whole server will be rearranged for you!

### PLEASE NOTE
I suggest you get all of your appeal moderators to join the server before running the bot, otherise they will be kicked upon joining (this will be changed in future with the ability to whitelist and auto mod staff)

## Commands

Here is a list of active commands
### General commands
| command | usage | description | aliases |
|---------|-------|-------------|---------|
| init  |``!init``|set's up the entire appeal server|
| approve  | ``!approve`` | DMs the user, unbans the user, and archives the channel |
| deny  | ``!softdeny`` | kicks the user and archives the case channel |
| deny  | ``!deny`` | bans the user and archives the case channel |



## DBAM is open source... kinda?

While the main code is fully downloadable and editable, things like the updates we are working on stay a secret!




## Todo
- [X] Make repo public
- [X] write README.md file
- [ ] add whitelist support

Pull requests are welcome!

## License
Usage is provided under the [MIT License](http://http//opensource.org/licenses/mit-license.php). See LICENSE for the full details.