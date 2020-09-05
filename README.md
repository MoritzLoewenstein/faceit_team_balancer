# Intro
This is a discord bot which will create the fairest matchup of players if you enter 10 faceit account links.

# How to use
1. Download/Clone this repository
2. `npm install`
3. rename `config.example.json` to `config.json` and set options
   - you _need_ to set `faceit_api_key`, `discord_bot_token` and `discord_channel_id`
4. `npm start`

# Commands
1. `reset` this command will reset the player selection process
2. `status` this command will display the current status
3. `test` if you specified `test_players` in config, this will create two teams out of these players
4. `toggle` cycle through modes
5. `capt` adds author to captains (only available in modes with captains)

# Options

## Discord

### discord_bot_token (string)
your discord bot token  

### discord_channel_id (string)
the channel in which the bot will be active

### discord_command_prefix (string)
default: "!"  
the command prefix, e. g. `!status`

### discord_reactions (object of discord reactions)

default:
```JSON
{
    "1": "1️⃣",
    "2": "2️⃣",
    "3": "3️⃣",
    "4": "4️⃣",
    "5": "5️⃣",
    "6": "6️⃣",
    "7": "7️⃣",
    "8": "8️⃣",
    "9": "9️⃣",
    "10": "🔟"
}
```
reactions which will be applied to the message of the player (first player -> `1️⃣`)

## Other
### faceit_api_key (string)
your faceit api key

### elo_tolerance (number)
if the absolute difference of the total elo of each team is lower than this, the algorithm will end early (use this if you have performance issues).

### modes (array of mode configs)
Set default mode with `default_mode`.
Example:  
```
{
    "name": "5vs5", //should be unique
    "players": 10, //amount of players
    "team_size": 5, //players mod team_size has to be 0
    "captains": 0, //(players / team_size) mod captains has to be 0
    "pre_selected_players": true, //are there pre_selected_players available in this mode?
    "pre_selected_captains": false //are there pre_selected_captains available in this mode?
},
```

### pre_selected_players (object of player arrays)
Only enabled when `mode.pre_selected_players` is true.  
Object with an array for each `mode` (key is `mode.name`).  
Players which will be included without sending their faceit link,  
every player is an object with these properties:  
```JSON
{
    "faceit_name": "player1",
    "discord_id": "123456789"
}
```
### pre_selected_captains (object of discordid arrays)
Only enabled when `mode.pre_selected_captains` is true.  
Object with an array for each `mode` (key is `mode.name`).  
Captains which will be included without sending their faceit link,  
every captain is a discordid as string.  

# FAQ

## How does it search for the "fairest" matchup?
This algorithm works in multiple steps
1. Create all possible matchups
2. Get the matchup with the lowest elo difference between to two teams
   - early exit if difference is smaller than `elo_tolerance`

`|team1_total_elo - team2_total_elo|` will be the smallest possible out of all matchups.  
This procedure takes `20-100ms` on most devices, the faceit api requests will take much longer (between 2-3s).

# License

MIT © [Moritz Loewenstein](https://github.com/MoritzLoewenstein)
