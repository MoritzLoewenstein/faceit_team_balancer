const axios = require("axios");
const combinations = require("./combinations.js");
const config = require("./config.json");

const faceit_names = config.playernames;
console.time("faceit_team_balancer");
start();

function start() {
  getPlayers(faceit_names, [], (err, players) => {
    if (err) {
      console.log(err);
      return;
    }
    announceTeams(getFairestTeams(players));
    console.timeEnd("faceit_team_balancer");
  });
}

function getFairestTeams(players) {
  let teams = [],
    diff,
    currentDiff;
  let combs = combinations(players, 5).map((arr) =>
    appendOppositeTeam(arr, players)
  );

  for (let i = 0; i < combs.length; i++) {
    if (i === 0) {
      teams[0] = generateTeam(combs[i].slice(0, 5));
      teams[1] = generateTeam(combs[i].slice(5));
      diff = Math.abs(teams[0].score - teams[1].score);
      if (diff <= config.elo_tolerance) return teams;
    } else {
      let score1 = combs[i]
        .slice(0, 5)
        .reduce((prev, curr) => prev + curr.elo, 0);
      let score2 = combs[i].slice(5).reduce((prev, curr) => prev + curr.elo, 0);
      currentDiff = Math.abs(score1 - score2);
      if (currentDiff <= config.elo_tolerance) {
        diff = currentDiff;
        teams[0] = generateTeam(combs[i].slice(0, 5));
        teams[1] = generateTeam(combs[i].slice(5));
        return teams;
      } else if (currentDiff < diff) {
        diff = currentDiff;
        teams[0] = generateTeam(combs[i].slice(0, 5));
        teams[1] = generateTeam(combs[i].slice(5));
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

function announceTeams(teams) {
  let diff = Math.abs(teams[0].score - teams[1].score);
  console.log(`Found fair teams. Total ELO difference: ${diff}`);
  console.log(`TEAM 1 (AVG ELO: ${parseInt(teams[0].score / 5)})`);
  console.log(teams[0].players);
  console.log(`TEAM 2 (AVG ELO: ${parseInt(teams[1].score / 5)})`);
  console.log(teams[1].players);
}

function appendOppositeTeam(team, players) {
  players.map((p) => {
    if (!containsObj(team, p)) team.push(p);
  });
  return team;
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
