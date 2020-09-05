const teamCombinations = require("./teamCombinations.js");
const config = require("./config.json");

const Balancer = {};

Balancer.getFairestTeams = (players, teamSize) => {
  let teams = [],
    diff,
    currentDiff;
  const matchups = teamCombinations(players, teamSize);

  for (let i = 0; i < matchups.length; i++) {
    if (i === 0) {
      teams = matchups[i].map(generateTeam);
      diff = Math.abs(teams[0].score - teams[1].score);
      if (diff <= config.elo_tolerance) return teams;
    } else {
      currentDiff = Math.abs(
        matchups[i][0].reduce((prev, curr) => prev + curr.elo, 0) -
        matchups[i][1].reduce((prev, curr) => prev + curr.elo, 0)
      );
      if (currentDiff <= config.elo_tolerance)
        return matchups[i].map(generateTeam);
      else if (currentDiff < diff) {
        diff = currentDiff;
        teams = matchups[i].map(generateTeam);
      }
    }
  }
  return teams;
};

function generateTeam(players) {
  return {
    players,
    score: players.reduce((prev, curr) => prev + curr.elo, 0),
  };
}

module.exports = Balancer;
