const BalancerController = require("../BalancerController.js");

module.exports = (msg) => {
  BalancerController.nextMode();
};
