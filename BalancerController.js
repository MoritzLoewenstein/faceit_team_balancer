const { performance } = require("perf_hooks");
const FaceitFetcher = require("./FaceitFetcher.js");
const Balancer = require("./Balancer.js");

const config = require("./config.json");

const BalancerController = {};

const STATUS = {
  gathering_players: 0,
  fetching_player_information: 1,
  balancing_teams: 2,
};

const STATUS_STR = [
  "gathering_players",
  "fetching_player_information",
  "balancing_teams",
];

const modeRotator = arrayRotator(config.default_mode, config.modes);

let gatheredPlayers = [];
let gatheredCaptains = [];
let playersDiscord = {};
let currentStatus = STATUS.gathering_players;
let currentMode = modeRotator.next().value;
let channel;

BalancerController.initBalancer = (chnnl) => {
  channel = chnnl;
  BalancerController.resetBalancer();
};

BalancerController.resetBalancer = () => {
  gatheredPlayers = [];
  gatheredCaptains = [];
  playersDiscord = {};

  const msg = [];
  msg.push("-----------init-----------");
  msg.push(`mode: ${currentMode.name}`);
  msg.push(`players: ${currentMode.players}`);
  msg.push(`captains: ${currentMode.captains}`);

  //* Load pre-selected players
  if (currentMode.pre_selected_players) {
    config.pre_selected_players[currentMode.name].map((player) => {
      gatheredPlayers.push(player.faceit_name);
      playersDiscord[player.faceit_name] = player.discord_id;
    });
    msg.push(`pre-selected players: ${gatheredPlayers.length}`);
  }
  //* Load pre-selected captains
  if (currentMode.pre_selected_captains) {
    gatheredCaptains = config.pre_selected_captains[currentMode.name].slice(
      0,
      currentMode.captains
    );
    msg.push(`pre-selected captains: ${gatheredCaptains.length}`);
  }

  channel.send(msg.join("\n")).then((sentMessage) => {
    currentStatus = STATUS.gathering_players;
    if (gatheredPlayers.length > 0) {
      sentMessage.react(config.discord_reactions[gatheredPlayers.length]);
    }
  });
};

BalancerController.addCaptain = (msg) => {
  if (currentMode.captains === 0)
    return msg.channel.send(`no captains in current mode`);
  if (currentStatus !== STATUS.gathering_players)
    return msg.channel.send(`currently not looking for captains`);
  if (gatheredCaptains.includes(msg.member.id))
    return msg.channel.send(`already registered as captain`);
  if (
    gatheredCaptains.length === currentMode.captains &&
    gatheredPlayers.length !== currentMode.players
  ) {
    const neededPlayers = currentMode.players - gatheredPlayers.length;
    msg.channel.send(`captains full, need ${neededPlayers} more player(s)`);
    return;
  }

  gatheredCaptains.push(msg.member.id);
  msg.react(config.discord_reactions[gatheredCaptains.length]);
  if (
    gatheredCaptains.length === currentMode.captains &&
    gatheredPlayers.length === currentMode.players
  )
    startBalancer();
};

BalancerController.addPlayer = (msg) => {
  if (currentStatus !== STATUS.gathering_players) return;
  let playername = parsePlayerLink(msg.content);
  if (!playername) return;
  if (
    gatheredPlayers.length === currentMode.players &&
    gatheredCaptains.length !== currentMode.captains
  ) {
    const neededCaptains = currentMode.captains - gatheredCaptains.length;
    msg.channel.send(`players full, need ${neededCaptains} more captain(s)`);
    return;
  }
  if (gatheredPlayers.find((name) => name === playername)) {
    return channel.send(`player \`${playername}\` already registered.`);
  }
  gatheredPlayers.push(playername);
  playersDiscord[playername] = msg.member.id;
  msg.react(config.discord_reactions[gatheredPlayers.length]);
  if (
    gatheredCaptains.length === currentMode.captains &&
    gatheredPlayers.length === currentMode.players
  )
    startBalancer();
};

BalancerController.addPlayerByName = (playername) => {
  if (currentStatus !== STATUS.gathering_players) return;
  gatheredPlayers.push(playername);
  if (
    gatheredCaptains.length === currentMode.captains &&
    gatheredPlayers.length === currentMode.players
  )
    startBalancer();
};

BalancerController.getInfo = () => {
  const info = [];
  info.push(`current mode: ${currentMode.name}`);
  info.push(`current status: ${BalancerController.getStatusString()}`);
  if (BalancerController.isReady())
    info.push(`gathered ${gatheredPlayers.length} player(s)`);
  return info.join("\n");
};

BalancerController.isReady = () => currentStatus === STATUS.gathering_players;

BalancerController.getStatus = () => currentStatus;

BalancerController.getStatusString = () => STATUS_STR[currentStatus];

BalancerController.setStatus = (status) => (currentStatus = status);

BalancerController.nextMode = () => {
  currentMode = modeRotator.next().value;
  BalancerController.resetBalancer();
};

function startBalancer() {
  currentStatus = STATUS.fetching_player_information;
  channel.send("Gathered enough players, balancing teams...");
  let start = performance.now();
  console.time("balance_network");
  FaceitFetcher.getPlayers(gatheredPlayers, [], (err, players) => {
    console.timeEnd("balance_network");
    if (err) {
      channel.send("Error: FaceIT API");
      currentStatus = STATUS.gathering_players;
      return;
    }
    currentStatus = STATUS.balancing_teams;

    console.time("balance_calc");
    const best_matchup = Balancer.getFairestTeams(
      players,
      currentMode.team_size
    );
    console.timeEnd("balance_calc");

    let time = parseFloat((performance.now() - start) / 1000).toFixed(3);
    channel.send(getAnnouncement(best_matchup, time));
    BalancerController.resetBalancer();
  });
}

//extracts faceit name from link, false if not valid
function parsePlayerLink(link) {
  let matches = link.match(
    "^(https://)?(www.)?faceit.com/[a-z]+/players/([^/\\s]+)$"
  );
  return matches ? matches[matches.length - 1] : false;
}

function getAnnouncement(teams, time) {
  teams = sortPlayers(teams);
  const diff = Math.abs(teams[0].score - teams[1].score);
  const msg = [];
  //* Header
  msg.push(`Found fair teams after ${time}s. Total ELO difference: ${diff}`);

  //* linebreak
  msg.push("");

  //* Team 1
  msg.push(
    `TEAM 1 (AVG ELO: ${parseInt(teams[0].score / currentMode.team_size)})`
  );
  gatheredCaptains
    .filter((_, i) => i % 2 === 0)
    .map((id) => msg.push(`Captain: <@${id}>`));
  teams[0].players
    .map((p) => `<@${playersDiscord[p.name]}> : \`${p.name}\` (elo: ${p.elo})`)
    .map((str) => msg.push(str));

  //* linebreak
  msg.push("");

  //* Team 2
  msg.push(
    `TEAM 2 (AVG ELO: ${parseInt(teams[1].score / currentMode.team_size)})`
  );
  gatheredCaptains
    .filter((_, i) => i % 2 === 1)
    .map((id) => msg.push(`Captain: <@${id}>`));
  teams[1].players
    .map((p) => `<@${playersDiscord[p.name]}> : \`${p.name}\` (elo: ${p.elo})`)
    .map((str) => msg.push(str));
  return msg.join("\n");
}

function sortPlayers(teams) {
  teams[0].players = teams[0].players.sort((a, b) => b.elo - a.elo);
  teams[1].players = teams[1].players.sort((a, b) => b.elo - a.elo);
  return teams;
}

function* arrayRotator(i, arr) {
  yield arr[i];
  yield* arrayRotator((i + 1) % arr.length, arr);
}

module.exports = BalancerController;
