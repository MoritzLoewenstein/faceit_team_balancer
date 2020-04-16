const axios = require("axios");
const { performance } = require("perf_hooks");
const Discord = require("discord.js");
const combinations = require("./combinations.js");
const config = require("./config.json");

const client = new Discord.Client();

const STATUS = {
  gathering_players: 0,
  fetching_player_information: 1,
  balancing_teams: 2,
};
Object.freeze(STATUS);

//global vars
let currentStatus = STATUS.gathering_players;
let gatheredPlayers;
let discordUsers;
let balanceStart;

client.on("ready", initBalancer);

client.on("message", (msg) => {
  if (msg.channel.id !== config.discord_channel_id) return;

  if (msg.content.startsWith(config.discord_command_prefix)) parseCommand(msg);
  else if (currentStatus === STATUS.gathering_players) {
    let playername = parsePlayerLink(msg.content);
    if (!playername) return;
    if (gatheredPlayers.find((name) => name === playername)) {
      msg.channel.send(`player \`${playername}\` already registered.`);
      return;
    }
    gatheredPlayers.push(playername);
    discordUsers[playername] = msg.author.id;
    msg.react(config.discord_reactions[gatheredPlayers.length]);
    if (gatheredPlayers.length === config.players) startBalancer();
  }
});

client.login(config.discord_bot_token);

function initBalancer() {
  let channel = client.channels.cache.get(config.discord_channel_id);

  gatheredPlayers = [];
  discordUsers = {};
  if (config.pre_selected_players.length > config.players) {
    console.log("Error: More pre_selected_players than players.");
    return;
  }
  config.pre_selected_players.map((player) => {
    gatheredPlayers.push(player.faceit_name);
    discordUsers[player.faceit_name] = player.discord_id;
  });
  channel
    .send(`initialized with ${gatheredPlayers.length} pre-selected player(s).`)
    .then((sentMessage) => {
      currentStatus = STATUS.gathering_players;
      if (gatheredPlayers.length > 0) {
        sentMessage.react(config.discord_reactions[gatheredPlayers.length]);
      }
    });
}

function startBalancer() {
  let channel = client.channels.cache.get(config.discord_channel_id);
  currentStatus = STATUS.fetching_player_information;
  channel.send("Gathered enough players, balancing teams...");
  balanceStart = performance.now();
  console.time("balance_network");
  getPlayers(gatheredPlayers, [], (err, players) => {
    console.timeEnd("balance_network");
    if (err) {
      channel.send("Error: FaceIT API");
      currentStatus = STATUS.gathering_players;
      return;
    }
    currentStatus = STATUS.balancing_teams;
    console.time("balance_calc");
    announceTeams(getFairestTeams(players), channel);
    initBalancer();
  });
}

function getFairestTeams(players) {
  let teams = [],
    diff,
    currentDiff;
  const combs_team1 = combinations(players, config.players_team);
  const combs_team2 = combs_team1.map((arr) => getOppositeTeam(arr, players));
  process.memoryUsage();

  for (let i = 0; i < combs_team1.length; i++) {
    if (i === 0) {
      teams = [generateTeam(combs_team1[i]), generateTeam(combs_team2[i])];
      diff = Math.abs(teams[0].score - teams[1].score);
      if (diff <= config.elo_tolerance) return teams;
    } else {
      currentDiff = Math.abs(
        combs_team1[i].reduce((prev, curr) => prev + curr.elo, 0) -
          combs_team2[i].reduce((prev, curr) => prev + curr.elo, 0)
      );
      if (currentDiff <= config.elo_tolerance)
        return [generateTeam(combs_team1[i]), generateTeam(combs_team2[i])];
      else if (currentDiff < diff) {
        diff = currentDiff;
        teams = [generateTeam(combs_team1[i]), generateTeam(combs_team2[i])];
      }
    }
  }
  return teams;
}

function generateTeam(players) {
  return {
    players,
    score: players.reduce((prev, curr) => prev + curr.elo, 0),
  };
}

function announceTeams(teams, channel) {
  console.timeEnd("balance_calc");
  const diff = Math.abs(teams[0].score - teams[1].score);
  const msg = [];
  const time = parseFloat((performance.now() - balanceStart) / 1000).toFixed(3);
  msg.push(`Found fair teams after ${time}s. Total ELO difference: ${diff}`);
  msg.push(`TEAM 1 (AVG ELO: ${parseInt(teams[0].score / 5)})`);
  msg.push(
    teams[0].players.reduce(
      (prev, curr) =>
        prev + `<@${discordUsers[curr.name]}> : \`${curr.name}\`\n`,
      ""
    )
  );
  msg.push(`TEAM 2 (AVG ELO: ${parseInt(teams[1].score / 5)})`);
  msg.push(
    teams[1].players.reduce(
      (prev, curr) =>
        prev + `<@${discordUsers[curr.name]}> : \`${curr.name}\`\n`,
      ""
    )
  );
  //concat messages for discord to avoid discord api timeout
  channel.send(msg.join("\n"));
  currentStatus = STATUS.gathering_players;
}

function getOppositeTeam(team, players) {
  let oppositeTeam = [];
  players.map((p) => {
    if (!containsObj(team, p)) oppositeTeam.push(p);
  });
  return oppositeTeam;
}

function containsObj(arr, player) {
  return (
    arr.find((p) => JSON.stringify(player) === JSON.stringify(p)) !== undefined
  );
}

function getPlayers(names, players, callback) {
  if (names.length === 0) {
    callback(null, players);
    return;
  }
  let name = names.pop();
  axios
    .get(`https://open.faceit.com/data/v4/players?nickname=${name}`, {
      headers: { Authorization: `Bearer ${config.faceit_api_key}` },
    })
    .then((res) => {
      players.push({ name, elo: res.data.games.csgo.faceit_elo });
      getPlayers(names, players, callback);
    })
    .catch((err) => {
      callback(err);
    });
}

//extracts faceit name from link, false if not valid
function parsePlayerLink(link) {
  let matches = link.match(
    "^(https://)?(www.)?faceit.com/[a-z]+/players/([^/\\s]+)$"
  );
  return matches ? matches[matches.length - 1] : false;
}

function parseCommand(msg) {
  const command = msg.content
    .replace(config.discord_command_prefix, "")
    .toLowerCase();
  switch (command) {
    case "status": {
      let str = `current status: ${getStatusName(currentStatus)}`;
      if (currentStatus === STATUS.gathering_players)
        str += `\ngathered ${gatheredPlayers.length} player(s)`;
      msg.channel.send(str);
      break;
    }
    case "reset": {
      if (currentStatus !== STATUS.gathering_players)
        msg.channel.send("this command only works while gathering players.");
      else initBalancer();
      break;
    }
    case "test": {
      gatheredPlayers = config.test_players;
      startBalancer();
      break;
    }
    default: {
      msg.channel.send(
        `\`${msg.content.toLowerCase()}\` is not a valid command.`
      );
    }
  }
}

function getStatusName(status) {
  let name;
  Object.keys(STATUS).forEach((key) => {
    if (STATUS[key] == status) name = key;
  });
  return name;
}
