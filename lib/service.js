const { Mocker, Parser, Ty } = require('tyshemo')
const express = require('express')
const fs = require('fs')
const path = require('path')
const { stringify, getPath, createUrl } = require('./utils')
const {
  isArray,
  isString,
  parse,
  isObject,
  clone,
  assign,
  getObjectHash,
  each,
  isFunction,
  createArray,
  makeKeyPath,
  extend,
} = require('ts-fns')
const { createProxyMiddleware } = require('http-proxy-middleware')


const RANDOM = '************' + Math.random() + '***********'

class Service {
  constructor(options = {}, configs = {}) {
    const { data } = options
    const { mocker, parser } = configs
    this.data = data
    this.mocker = new Mocker(mocker)
    this.parser = new Parser(parser)
    this.options = options
    this.configs = configs
  }

  mock(mockServerConfig, server) {
    const app = server || express()

    app.use(express.json())
    app.use(express.urlencoded({ extended: true }))

    const items = []
    this.data.forEach((group) => {
      items.push(...group.items)
    })

    const {
      base: globalBasePath,
      error: globalError = {
        code: 'error_code',
        error: 'error_message',
      },
    } = this.options

    const {
      port = 7000,
      transformer,
    } = mockServerConfig || this.configs.mock || {}

    items.forEach((item) => {
      const {
        method,
        base = globalBasePath,
        path,
        request,
        response,
        error = globalError,
        mock: mockRules,
      } = item

      const url = (base ? base : '') + path

      app[method](url, (req, res) => {
        // check req data
        if (request) {
          const reqData = method === 'get' ? req.query : req.body
          const reqType = this.parser.parse(request)
          const reqErr = Ty.catch(reqData).by(reqType)
          if (reqErr) {
            const { message } = reqErr
            const errDesc = {
              __def__: [
                {
                  name: 'error_code',
                  def: '499',
                },
                {
                  name: 'error_message',
                  def: `'Request Data Type Checking Fail: ${message.replace(/'/g, '"')}'`,
                }
              ],
              ...error,
            }

            const errType = this.parser(errDesc)
            const errJson = this.mock(errType)

            res.status(499)
            res.json(errJson)
            return
          }
        }

        // give mock data for response
        const resType = this.parser.parse(response)
        const data = this.mocker.mock(resType)

        if (mockRules) {
          const getMarks = (str) => {
            const marks = []
            str.replace(/\[\*\]/g, (match, index) => {
              marks.push(index)
            })
            return marks
          }
          const replaceByMarks = (str, marks, indexes) => {
            const letters = str.split('')
            marks.forEach((mark, i) => {
              const index = indexes[i]
              letters.splice(mark, 3, '[', index, ']')
            })
            const path = letters.join('')
            return path
          }
          const replace = (keyPath, value, indexes) => {
            if (isFunction(value)) {
              const v = value(data, indexes)
              assign(data, keyPath, v)
            }
            else {
              assign(data, keyPath, value)
            }
          }

          each(mockRules, (value, keyPath) => {
            if (keyPath.indexOf('[*]') > -1) {
              const marks = getMarks(keyPath)
              const indexes = createArray(0, marks.length)
              let lastAt = indexes.length - 1
              while (lastAt >= 0) {
                const replacedPath = replaceByMarks(keyPath, marks, indexes)
                const v = parse(data, replacedPath)
                // if not exist
                if (v === undefined) {
                  if (lastAt === 0) {
                    break
                  }
                  indexes[lastAt] = 0
                  lastAt --
                  indexes[lastAt] ++
                  continue
                }
                else {
                  replace(replacedPath, value, indexes)
                  indexes[lastAt] ++
                }
              }
            }
            else {
              replace(keyPath, value)
            }
          })
        }

        if (transformer) {
          transformer(data)
        }

        res.json(data)
      })
    })
    if (port) {
      const server = app.listen(port, () => console.log('http://localhost:' + port))
      return () => server.close()
    }
  }

  doc(docServerConfig, server) {
    const app = server || express()
    const {
      base: globalBasePath,
      error: globalError = {
        code: 'error_code',
        error: 'error_message',
      },
      errorMapping,
    } = this.options

    const {
      port = 8000,
      title = 'TySheMo',
      description = 'This is an api doc generated by TySheMo.',
      root = '/',
      template = path.resolve(__dirname, 'doc.html'),
    } = docServerConfig || this.configs.doc || {}

    const data = this.data.map((group) => {
      const { items } = group
      return {
        ...group,
        items: items.map((item) => {
          const {
            name,
            description,
            method,
            path,
            request,
            response,
            base = globalBasePath,
            error = globalError,
          } = item

          const reqType = request ? this.parser.parse(request) : null
          const reqDesc = reqType ? this.parser.describe(reqType, { arrayStyle: 2, ruleStyle: 1 }) : null
          const reqComments = reqType ? reqType.__comments__ : {}
          const reqText = reqDesc ? stringify(reqDesc, reqComments) : ''

          const resType = this.parser.parse(response)
          const resDesc = resType ? this.parser.describe(resType, { arrayStyle: 2, ruleStyle: 1 }) : null
          const resComments = resType ? resType.__comments__ : {}
          const resText = resDesc ? stringify(resDesc, resComments) : ''

          const errType = error ? this.parser.parse(error) : null
          const errDesc = errType ? this.parser.describe(errType, { arrayStyle: 2, ruleStyle: 1 }) : null
          const errText = errDesc ? stringify(errDesc) : ''

          const errorMappingText = stringify(errorMapping)

          const url = (base ? base : '') + path

          return {
            name,
            description,
            method,
            path: url,
            request: reqText,
            response: resText,
            error: errText,
            errors: errorMappingText,
          }
        }),
      }
    })

    app.use('/vue.js', express.static(require.resolve('vue/dist/vue.js')))
    app.use('/darkmode.js', express.static(require.resolve('darkmode-js/lib/darkmode-js.min.js')))
    app.use(root, (req, res) => {
      fs.readFile(template, (error, buffer) => {
        let text = buffer.toString()
        text = text.replace(/__TITLE__/g, title)
        text = text.replace(/__DESCRIPTION__/g, description)
        const html = text.replace('__DATA__', JSON.stringify(data))
        res.type('html')
        res.send(html)
      })
    })
    if (port) {
      const server = app.listen(port, () => console.log('http://localhost:' + port))
      return () => server.close()
    }
  }

  test(testServerConfig, server) {
    const {
      base: globalBasePath,
      errorMapping,
    } = this.options

    const {
      port = 9000,
      target = 'http://localhost:7000',
      title = 'TySheMo',
      description = 'This is an api doc generated by TySheMo.',
      root = '/',
      template = path.resolve(__dirname, 'test.html'),
    } = testServerConfig || this.configs.test || {}

    const app = server || express()

    const makeRequest = (request, reqMock) => {
      if (!request) {
        return reqMock
      }

      const cloned = clone(reqMock)
      extend(cloned, request)
      return cloned
    }

    const getHash = (group, item, unit) => {
      return getObjectHash({ group: group.name, item: item.name, unit: unit.name })
    }

    app.use('/vue.js', express.static(require.resolve('vue/dist/vue.min.js')))
    app.use('/tyshemo.js', express.static(require.resolve('tyshemo/dist/tyshemo.min.js')))
    app.use('/indb.js', express.static(require.resolve('indb/dist/indb.js')))
    app.use('/__request_mock_data__/:hash', (req, res) => {
      const { hash } = req.params
      const { data } = this

      let requestData
      for (let i = 0, len = data.length; i < len; i ++) {
        const group = data[i]
        const { items } = group
        if (!items || !items.length) {
          continue
        }

        let count = 0
        items.forEach((item) => {
          if (item.test && item.test.length) {
            count ++
          }
        })

        if (!count) {
          continue
        }

        for (let i = 0, len = items.length; i < len; i ++) {
          const item = items[i]
          if (!item.test || !item.test.length) {
            continue
          }

          const unit = item.test.find(unit => +getHash(group, item, unit) === +hash)
          if (!unit) {
            continue
          }

          const { request } = item
          const reqType = request ? this.parser.parse(request) : null
          const reqMock = reqType ? this.mocker.mock(reqType) : null
          const { request: _request = {} } = unit

          requestData = makeRequest(_request, reqMock)
        }
      }

      if (requestData) {
        res.json(requestData)
      }
      else {
        const message = 'Not found unit by this hash:' + hash
        res.writeHead(404, message, { 'content-type' : 'text/plain' })
        res.end(message)
      }
    })
    app.use(root, (req, res, next) => {
      if (req.url !== '/') {
        next()
        return
      }

      const data = this.data.map((group) => {
        if (!group.items || !group.items.length) {
          return
        }

        let count = 0
        group.items.forEach((item) => {
          if (item.test && item.test.length) {
            count ++
          }
        })
        if (!count) {
          return
        }

        return {
          ...group,
          items: group.items.map((item) => {
            const {
              name,
              method,
              path,
              request,
              response,
              base = globalBasePath,
            } = item

            if (!item.test && !isArray(item.test)) {
              return
            }

            const reqType = this.parser.parse(request)

            const url = (base ? base : '') + path
            const makeResponse = (res) => {
              const resType = this.parser.parse(res)
              const resDesc = resType ? this.parser.describe(resType, { arrayStyle: 2, ruleStyle: 1 }) : null
              return resDesc
            }
            const resDesc = makeResponse(response)

            const units = []
            item.test.forEach((testUnit, i) => {
              const reqMock = reqType ? this.mocker.mock(reqType) : null
              const { params = {}, request = {}, response, frequency, name } = testUnit
              const path = createUrl(url, params)
              const unit = {
                name,
                frequency,
                method,
                path,
                request: makeRequest(request, reqMock),
                response: response ? makeResponse(response) : resDesc,
              }
              unit.hash = getHash(group, item, unit)
              units.push(unit)
            })

            return {
              name,
              path,
              method,
              units,
            }
          }).filter(item => !!item),
        }
      }).filter(item => !!item)

      fs.readFile(template, (error, buffer) => {
        let text = buffer.toString()
        text = text.replace(/__TITLE__/g, title)
        text = text.replace(/__DESCRIPTION__/g, description)
        const html = text.replace('__DATA__', JSON.stringify(data))
        res.type('html')
        res.send(html)
      })
    })
    if (target) {
      app.use('/*', createProxyMiddleware({
        target,
        changeOrigin: true,
      }))
    }
    if (port) {
      const server = app.listen(port, () => console.log('http://localhost:' + port))
      return () => server.close()
    }
  }

  serve() {
    const setting = this.configs
    const { doc = {}, test = {}, mock = {} } = setting
    const { port = 10000 } = setting
    const { root: docRoot = '/' } = doc
    const { root: testRoot } = test
    const testingRoot = !testRoot || testRoot === docRoot ? '/_test' : testRoot

    const app = express()
    this.mock({
      ...mock,
      port: false,
    }, app)
    this.test({
      ...test,
      root: testingRoot,
      port: false,
      target: false,
    }, app)
    this.doc({
      ...doc,
      root: docRoot,
      port: false,
    }, app)

    const server = app.listen(port, () => console.log('http://localhost:' + port))
    return () => server.close()
  }
}

module.exports = Service
