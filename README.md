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

# Options

## Discord

### discord_bot_token (type: string)
your discord bot token  

### discord_channel_id (type: string)
the channel in which the bot will be active

### discord_command_prefix (type: string)
default: "!"  
the command prefix, e. g. `!status`

### discord_reactions (type: object)

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
### faceit_api_key (type: string)
your faceit api key

### elo_tolerance (type: integer)
if the absolute difference of the total elo of each team is lower than this, the algorithm will end early (use this if you have performance issues).

### players (type: integer)
default: 10  
total players (values other than 10 not tested/recommended)

### players_team (type: integer)
default: 5  
players in 1 team (values other than 5 not tested/recommended)

### pre_selected_players (type: array of objects)
players which will be included in every lobby without sending their faceit link  
every player is an object with these properties:  
```JSON
{
    "faceit_name": "player1",
    "discord_id": "123456789"
}
```
### test_players (type: array of strings)
names of faceit accounts which will be used for the `test` command

# License

MIT © [Moritz Loewenstein](https://github.com/MoritzLoewenstein)
