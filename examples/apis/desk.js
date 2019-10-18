const { DeskType } = require('../app/types')

DeskType.__comments = {
  'height': 'the height of desk',
}

DeskType.__mocks = {
  'books[*].price': function(data, indexes) {
    return 12
  },
}

module.exports = {
  name: 'Desk',
  description: 'description for desk\nbreak line for demo',
  method: 'get',
  basePath: '/api/v3',
  path: '/desk/:id',
  response: DeskType,
}
