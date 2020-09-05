const axios = require("axios");
const config = require("./config.json");

const FaceitFetcher = {};

FaceitFetcher.getPlayer = (name, callback) => {
  axios
    .get(`https://open.faceit.com/data/v4/players?nickname=${name}`, {
      headers: { Authorization: `Bearer ${config.faceit_api_key}` },
    })
    .then((res) => {
      callback(null, { name, elo: res.data.games.csgo.faceit_elo });
    })
    .catch((err) => {
      callback(err);
    });
};

FaceitFetcher.getPlayers = (names, players, callback) => {
  if (names.length === 0) {
    callback(null, players);
    return;
  }
  const name = names.pop();
  axios
    .get(`https://open.faceit.com/data/v4/players?nickname=${name}`, {
      headers: { Authorization: `Bearer ${config.faceit_api_key}` },
    })
    .then((res) => {
      players.push({ name, elo: res.data.games.csgo.faceit_elo });
      FaceitFetcher.getPlayers(names, players, callback);
    })
    .catch((err) => {
      console.log(err);
      callback(err);
    });
};

module.exports = FaceitFetcher;
