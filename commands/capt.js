const BalancerController = require("../BalancerController.js");

module.exports = (msg) => {
  BalancerController.addCaptain(msg);
};
