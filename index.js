require('dotenv').config()

// ES6 Module loader
require = require('esm')(module)
module.exports = require('./server.js')
