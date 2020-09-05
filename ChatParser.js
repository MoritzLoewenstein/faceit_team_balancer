const config = require("./config.json");
const BalancerController = require("./BalancerController.js");

/* COMMANDS */
const reset = require("./commands/reset.js");
const status = require("./commands/status.js");
const test = require("./commands/test.js");
const cycleMode = require("./commands/cycleMode.js");
const capt = require("./commands/capt.js");

const commands = {
  capt,
  reset,
  status,
  test,
  cycle: cycleMode,
};

module.exports = (msg) => {
  //* dont react to own messages
  if (msg.member.id === "700276418965274684") return;
  //* only react in specific channel
  if (msg.channel.id !== config.discord_balancer_channel_id) return;

  if (msg.content.startsWith(config.discord_command_prefix)) parseCommand(msg);
  else BalancerController.addPlayer(msg);
};

function parseCommand(msg) {
  const command = msg.content
    .replace(config.discord_command_prefix, "")
    .toLowerCase();
  if (command in commands) commands[command](msg);
  else
    msg.channel.send(
      `\`${msg.content.toLowerCase()}\` is not a valid command.`
    );
}
