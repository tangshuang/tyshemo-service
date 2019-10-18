const { Mocker } = require('tyshemo/dist/mocker')
const { Parser } = require('tyshemo/dist/parser')
const express = require('express')
const { Ty } = require('tyshemo')
const fs = require('fs')
const path = require('path')
const { stringify, getPath, createUrl } = require('./utils')
const { isArray, parse, isObject, clone, assign, getObjectHash, each, isFunction, createArray, makeKeyPath } = require('ts-fns')
const proxy = require('http-proxy-middleware')


const RANDOM = '************' + Math.random() + '***********'

class Service {
  constructor(options = {}) {
    const { data, mockConfig, parseConfig } = options
    this.data = data
    this.mocker = new Mocker(mockConfig)
    this.parser = new Parser(parseConfig)
    this.options = options
  }

  mock(mockServerConfig = {}, server) {
    const app = server || express()

    app.use(express.json())
    app.use(express.urlencoded({ extended: true }))

    const items = []
    this.data.forEach((group) => {
      items.push(...group.items)
    })

    const {
      basePath: globalBasePath,
      getResponseType: globalGetResponseType,
      getRequestType: globalGetRequestType,
      getErrorType: globalGetErrorType,
      errorMapping: globalErrorMapping = {},
    } = this.options

    const { port = 8089 } = mockServerConfig

    items.forEach((item) => {
      const {
        method,
        path,
        request,
        response,
        basePath = globalBasePath,
        getResponseType = globalGetResponseType,
        getRequestType = globalGetRequestType,
        getErrorType = globalGetErrorType,
        errorMapping = {},
      } = item

      const url = (basePath ? basePath : '') + path

      app[method](url, (req, res) => {
        // check req data
        if (request) {
          const data = method === 'get' ? req.query : req.body
          const reqPattern = getRequestType ? getRequestType(request) : request
          const type = Ty.create(reqPattern)
          const err = Ty.catch(data).by(type)
          if (err) {
            const { message } = err
            const errPattern = getErrorType ? getErrorType(message) : { message }
            const errType = Ty.create(errPattern)
            const errJson = this.mocker.mock(errType)
            res.status(499)
            res.json(errJson)
            return
          }
        }

        // give mock data for response
        const resPattern = getResponseType ? getResponseType(response) : response
        const type = Ty.create(resPattern)
        const data = this.mocker.mock(type)

        if (response.__mocks) {
          const root = getResponseType ? getPath(getResponseType(RANDOM), RANDOM) : ''
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

          each(response.__mocks, (value, keyPath) => {
            if (keyPath.indexOf('[*]') > -1) {
              const marks = getMarks(keyPath)
              const indexes = createArray(0, marks.length)
              let lastAt = indexes.length - 1
              while (lastAt >= 0) {
                const replacedPath = replaceByMarks(keyPath, marks, indexes)
                const makedPath = root ? makeKeyPath([root, replacedPath]) : replacedPath
                const v = parse(data, makedPath)
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
                  replace(makedPath, value, indexes)
                  indexes[lastAt] ++
                }
              }
            }
            else {
              const makedPath = root ? makeKeyPath([root, keyPath]) : keyPath
              replace(makedPath, value)
            }
          })
        }


        res.json(data)
      })
    })
    if (port) {
      app.listen(port)
    }
  }

  doc(docServerConfig = {}, server) {
    const app = server || express()
    const {
      basePath: globalBasePath,
      getResponseType: globalGetResponseType,
      getRequestType: globalGetRequestType,
      getErrorType: globalGetErrorType,
      errorMapping: globalErrorMapping = {},
    } = this.options

    const { port = 8088, title = 'TySheMo', description = 'This is an api doc generated by TySheMo.', root = '/' } = docServerConfig

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
            basePath = globalBasePath,
            getResponseType = globalGetResponseType,
            getRequestType = globalGetRequestType,
            getErrorType = globalGetErrorType,
            errorMapping = {},
          } = item


          const reqPattern = getRequestType ? getRequestType(request) : request
          const reqType = reqPattern ? Ty.create(reqPattern) : null
          const reqDesc = reqType ? this.parser.describe(reqType) : null
          const reqCommentRoot = getRequestType ? getPath(getRequestType(RANDOM), RANDOM) : ''
          const reqComments = request ? request.__comments : {}
          const reqText = reqDesc ? stringify(reqDesc, reqComments, reqCommentRoot) : ''

          const resPattern = getResponseType ? getResponseType(response) : response
          const resType = resPattern ? Ty.create(resPattern) : null
          const resDesc = resType ? this.parser.describe(resType) : null
          const resCommentRoot = getResponseType ? getPath(getResponseType(RANDOM), RANDOM) : ''
          const resComments = response ? response.__comments : {}
          const resText = resDesc ? stringify(resDesc, resComments, resCommentRoot) : ''

          const errPattern = getErrorType ? getErrorType('message') : null
          const errType = errPattern ? Ty.create(errPattern) : null
          const errDesc = errType ? this.parser.describe(errType) : null
          const errText = errDesc ? stringify(errDesc) : ''

          const errorsMappingText = stringify({
            ...globalErrorMapping,
            ...errorMapping,
          })

          const url = (basePath ? basePath : '') + path

          return {
            name,
            description,
            method,
            path: url,
            request: reqText,
            response: resText,
            error: errText,
            errors: errorsMappingText,
          }
        }),
      }
    })

    app.use('/vue.js', express.static(path.resolve(__dirname, 'node_modules/vue/dist/vue.js')))
    app.use('/darkmode.js', express.static(path.resolve(__dirname, 'node_modules/darkmode-js/lib/darkmode-js.min.js')))
    app.use(root, (req, res) => {
      const { docTemplateFile = path.resolve(__dirname, 'doc.html') } = this.options
      fs.readFile(docTemplateFile, (error, buffer) => {
        let text = buffer.toString()
        text = text.replace(/__TITLE__/g, title)
        text = text.replace(/__DESCRIPTION__/g, description)
        const html = text.replace('__DATA__', JSON.stringify(data))
        res.type('html')
        res.send(html)
      })
    })
    if (port) {
      app.listen(port)
    }
  }

  test(testServerConfig = {}, server) {
    const {
      basePath: globalBasePath,
      getResponseType: globalGetResponseType,
      getRequestType: globalGetRequestType,
      getErrorType: globalGetErrorType,
      errorMapping: globalErrorMapping = {},
      data,
    } = this.options

    const {
      port = 8087,
      target = 'http://localhost:8089',
      title = 'TySheMo',
      description = 'This is an api doc generated by TySheMo.',
      root = '/',
      testTemplateFile = path.resolve(__dirname, 'test.html'),
    } = testServerConfig
    const app = server || express()

    const makeRequest = (req, reqMock, reqPatchPath) => {
      if (!req) {
        return reqMock
      }
      const clonedDesc = clone(reqMock)
      const originalReq = clonedDesc ? parse(clonedDesc, reqPatchPath) : null
      if (isObject(originalReq) && isObject(req)) {
        Object.assign(originalReq, req)
      }
      else {
        assign(clonedDesc, reqPatchPath, req)
      }
      return clonedDesc
    }
    const getHash = (group, item, unit) => {
      return getObjectHash({ group: group.name, item: item.name, unit: unit.name })
    }

    app.use('/vue.js', express.static(path.resolve(__dirname, 'node_modules/vue/dist/vue.min.js')))
    app.use('/tyshemo.js', express.static(path.resolve(__dirname, 'node_modules/tyshemo/dist/bundle.js')))
    app.use('/indb.js', express.static(path.resolve(__dirname, 'node_modules/indb/dist/indb.js')))
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
          const item = items[0]
          if (!item.test || !item.test.length) {
            continue
          }

          const unit = item.test.find(unit => +getHash(group, item, unit) === +hash)
          if (!unit) {
            continue
          }

          const { request, getRequestType = globalGetRequestType } = item
          const reqPattern = getRequestType ? getRequestType(request) : request
          const reqType = reqPattern ? Ty.create(reqPattern) : null
          const reqMock = reqType ? this.mocker.mock(reqType) : null
          const reqPatchPath = getRequestType ? getPath(getRequestType(RANDOM), RANDOM) : ''
          const { request: _request = {} } = unit

          requestData = makeRequest(_request, reqMock, reqPatchPath)
        }
      }

      if (requestData) {
        res.json(requestData)
      }
      else {
        const message = 'Not found unit by this hash.'
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
              description,
              method,
              path,
              request,
              response,
              basePath = globalBasePath,
              getResponseType = globalGetResponseType,
              getRequestType = globalGetRequestType,
              getErrorType = globalGetErrorType,
              errorMapping = {},
            } = item

            if (!item.test && !isArray(item.test)) {
              return
            }

            const reqPattern = getRequestType ? getRequestType(request) : request
            const reqType = reqPattern ? Ty.create(reqPattern) : null

            const url = (basePath ? basePath : '') + path
            const makeResponse = (res) => {
              const resPattern = getResponseType ? getResponseType(res) : res
              const resType = resPattern ? Ty.create(resPattern) : null
              const resDesc = resType ? this.parser.describe(resType) : null
              return resDesc
            }
            const resDesc = makeResponse(response)

            const units = []
            item.test.forEach((testUnit, i) => {
              const reqMock = reqType ? this.mocker.mock(reqType) : null
              const reqPatchPath = getRequestType ? getPath(getRequestType(RANDOM), RANDOM) : ''
              const { params = {}, request = {}, response, frequency, name } = testUnit
              const path = createUrl(url, params)
              const unit = {
                name,
                frequency,
                method,
                path,
                request: makeRequest(request, reqMock, reqPatchPath),
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

      fs.readFile(testTemplateFile, (error, buffer) => {
        let text = buffer.toString()
        text = text.replace(/__TITLE__/g, title)
        text = text.replace(/__DESCRIPTION__/g, description)
        const html = text.replace('__DATA__', JSON.stringify(data))
        res.type('html')
        res.send(html)
      })
    })
    if (target) {
      app.use('/*', proxy('/', {
        target,
        changeOrigin: true,
      }))
    }
    if (port) {
      app.listen(port)
    }
  }
  serve(serverConfig = {}) {
    const { port = 8089, docRoot = '/', testRoot = '/_test' } = serverConfig
    const config = {
      ...serverConfig,
      port: false,
      target: false,
    }

    const app = express()
    this.mock(config, app)
    this.test({ ...config, root: testRoot }, app)
    this.doc({ ...config, root: docRoot }, app)

    app.listen(port)
  }
}

module.exports = Service
