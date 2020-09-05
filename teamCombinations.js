const combinations = require("./combinations.js");
const cache = require("./combsCache.json");

module.exports = (players, teamLen) => {
  //* check if valid inputs
  if (players.length % teamLen !== 0)
    throw Error(
      `Invalid permLen ${teamLen} for arr.length of ${players.length}`
    );

  //* get combinations from cache if possible
  const key = `${players.length}_${teamLen}`;
  if (cache.hasOwnProperty(key))
    return cache[key].map((comb) =>
      comb.map((team) => team.map((v) => players[v]))
    );

  //* get all combinations of teamLen from arr
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
