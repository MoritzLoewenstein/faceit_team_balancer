const Discord = require("discord.js");
const BalancerController = require("./BalancerController.js");
const ChatParser = require("./ChatParser.js");
const config = require("./config.json");

const client = new Discord.Client();

client.on("ready", () => {
  client.channels
    .fetch(config.discord_balancer_channel_id)
    .then((channel) => BalancerController.initBalancer(channel))
    .catch(console.error);
});

client.on("message", ChatParser);

client.login(config.discord_bot_token);
