const BalancerController = require("../BalancerController.js");

module.exports = (msg) => {
  msg.channel.send(BalancerController.getInfo());
};
