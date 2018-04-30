require('babel-register');
require('babel-polyfill');

module.exports = {
  networks: {
    development: {
      host: "localhost",
      port: 7545,
      network_id: '*', // eslint-disable-line camelcase
      gasPrice: 5000000000,
    },
  },
};
