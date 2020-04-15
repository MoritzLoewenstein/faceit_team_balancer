## How to use
1. Download/Clone this repository
2. `npm install`
3. rename `config.json.example` to `config.json` and set options
3. `npm start`

## Options
`faceit_api_key` -> your faceit api key  
`elo_tolerance`-> if the absolute difference of the total elo of each team is lower than this, the algorithm will end early (use this if you have performance issues)  
`players` -> total players (values other than 10 not tested)  
`players_team` -> players in 1 team (values other than 5 not tested)  
`playernames` -> faceit players nicknames in an array of length `players`  

## License

MIT © [Moritz Loewenstein](https://github.com/MoritzLoewenstein)
