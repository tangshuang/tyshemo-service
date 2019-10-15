const Service = require('../index')
const Person = require('./apis/person')
const Desk = require('./apis/desk')

const service = new Service({
  getResponseType(type) {
    return {
      code: 0,
      data: type,
    }
  },
  getErrorType(type) {
    return {
      code: Number,
      error: type,
    }
  },
  getRequestType(type) {
    return type
  },
  errorMapping: {
    10000: 'Database broken',
    10005: 'network error',
  },
  basePath: '/api/v2',
  data: [
    {
      id: 'default_group',
      name: 'Default Group',
      items: [
        Person,
        Desk,
      ],
    },
  ],
})

module.exports = service
