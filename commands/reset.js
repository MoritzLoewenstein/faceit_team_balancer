const BalancerController = require("../BalancerController.js");

module.exports = (msg) => {
  if (BalancerController.isReady()) BalancerController.resetBalancer();
  else msg.channel.send("this command only works while gathering players.");
};
