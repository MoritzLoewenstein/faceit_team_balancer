const combinations = require("./combinations.js");

module.exports = (players, teamLen) => {
  if (players.length % teamLen !== 0)
    throw Error(
      `Invalid permLen ${teamLen} for arr.length of ${players.length}`
    );
  //* get all combinations of permLen from arr
  const combs = combinations(players, teamLen);
  const teams = combinations(combs, players.length / teamLen);
  //* filter possible team combinations
  return teams.filter(
    (team) => getArrayUnique(team.flat(1)).length === players.length
  );
};

function getArrayUnique(arr) {
  return arr.filter((value, index, self) => self.indexOf(value) === index);
}