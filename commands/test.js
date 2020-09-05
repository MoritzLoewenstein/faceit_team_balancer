const { performance } = require("perf_hooks");
const teamCombs = require("../teamCombinations.js");
const config = require("../config.json");

module.exports = (msg) => {
  const results = [];
  config.modes.map((mode) => {
    const arr = getArr(mode.players);
    const start = performance.now();
    const combs = teamCombs(arr, mode.team_size);
    const t = parseFloat((performance.now() - start) / 1000).toFixed(3);
    results.push(`${mode.name} | len -> ${combs.length} | t -> ${t} seconds`);
  });
  msg.channel.send(results.join("\n"));
};

function getArr(length) {
  return Array(length)
    .fill(0)
    .map((_, i) => i);
}
