TYSHEMO SERVICE
===============

This package is based on [TySheMo](https://github.com/tangshuang/tyshemo).
It can help you to serve up a mocker server and a doc server quickly with your types files.

## install

```
npm i tyshemo-service
```

## usage

```js
const Service = require('tyshemo-service')
const server = new Service(options)

server.mock() // serve up a mocker server
// server.doc() // serve up a doc server
```

## options

```
{
  // required
  data: [],

  // optionals
  basePath: string, // api base url
  getRequestType: function, // to wrap request data in an object
  getResponseType: function, // to wrap response data in an object
  getErrorType: function, // to wrap error message in an object
  errorMapping: mapping, // mapping for error code and messages

  mockConfig: {}, // mocker config
  parseConfig: {}, // parser config

  // give your own template
  docTemplateFile: __dirname + '/doc.html',
  testTemplateFile: __dirname + '/test.html',
}
```

**config**

Read more from [here](https://www.tangshuang.net/7101.html#title-9).

**wrapper**

```js
function(responsData) {
  return {
    code: 0,
    data: responseData,
  }
}
```

**errors**

```js
{
  10001: 'database disconnected.',
}
```

**data**

To serve up, the most important information to pick from.

```
data: [ // group level, to group apis and show tree in doc
  {
    name: 'group name',
    items: [ // api item level
      {
        name: 'api name',
        description: 'api description',
        method: 'get', // lowercase, will be used by express to route
        path: '/path/:id', // concat with basePath, will be used by express to serve up mock server, show in doc page

        request: RequestType, // data type container which created by TySheMo
        response: ResponseType,

        // override global options
        basePath: '',
        getRequestType: null,
        getResponseType: null,
        getErrorType: null,
        errorMapping: {},
      },
    ],
  }
]
```

The most important is `request` and `response` options. The Type instances should be imported from which is shared with your project code.

## comments

You can set comments to your doc output. However, comments are not easy to write with your original code. The only way is to set a `__comments` property on the type instance.

```js
ResponseType.__comments = {
  'books[0].name': 'the name of a book',
  'books[0]': 'a book information',
  '__def__[2].def.size': 'a comment for some deep type', // this is not easy to understand
}
```

In fact, you should have to watch the output of doc while commenting.

## serve

When you invoke `server.doc()` or `server.mock()`, you can pass server config into these methods.

```js
server.doc({
  port: 9000,
  title: 'My App API DOC', // the doc page title
  description: '', // the doc page description
})
```

```js
server.mock({
  port: 9000,
  title: 'My App Mock Server',
  description: '',
})
```

To override mock data when you need to, you can set a `__mocks` property to respons type. The usage is like __comments.

```js
const { ResponseType } = require('./types')

ResponseType.__mocks = {
  'books[0].name': 'xxx', // constant
  'books[0].price': () => Match.random() * 100, // computed
}
```

Then when you setup a mock server, the output of this item, will be override by __mocks.

It receive two type of value: function, constants.

When it receive a function, the function will receive the current type, and the return value will be used as the keyPath value.

## template

The `docTemplateFile` and `testTemplateFile` give your the ability to modify want you see in browser. You should look into [doc.html](./doc.html) and [test.html](./test.html).

The placeholder string `__TITLE__` `__DESCRIPTION__` and `__DATA__` can be used in your template.
