const Service = require('./lib/service')
const { guess, merge } = require('./lib/guess')

module.exports = Service
module.exports.guess = guess
module.exports.merge = merge
