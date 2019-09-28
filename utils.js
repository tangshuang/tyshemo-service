
const { isArray, isObject, each, makeKeyPath } = require('ts-fns')

function stringify(data, comments = {}, commentRoot = '') {
  const clearPath = (path) => {
    const text = path.replace(commentRoot, '')
    if (text.charAt(0) === '.') {
      return text.substr(1)
    }
    return text
  }
  const stringify = (obj, path = '', space = 0) => {
    if (isArray(obj)) {
      let text = ''
      text += '['
      text += '\n'

      each(obj, (item, i) => {
        const spaceLen = space + 4
        const spaceStr = ' '.repeat(spaceLen)
        const pathStr = clearPath(path + '[' + i + ']')
        const comment = comments[pathStr]

        if (comment) {
          if (isArray(comment)) {
            each(comment, comment => {
              text += comment ? spaceStr + '// ' + comment + '\n' : ''
            })
          }
          else {
            text += comment ? spaceStr + '// ' + comment + '\n' : ''
          }
        }

        text += spaceStr

        if (typeof item === 'object') {
          text += stringify(item, pathStr, spaceLen)
        }
        else {
          text += item
        }

        text += ','
        text += '\n'
      })

      const spaceStr = ' '.repeat(space)
      text += spaceStr + ']'
      return text
    }
    else if (isObject(obj)) {
      let text = ''
      text += '{'
      text += '\n'

      each(obj, (value, key) => {
        const spaceLen = space + 4
        const spaceStr = ' '.repeat(spaceLen)
        const pathStr = clearPath(path + (path ? '.' : '') + key)
        const comment = comments[pathStr]

        if (comment) {
          if (isArray(comment)) {
            each(comment, comment => {
              text += comment ? spaceStr + '// ' + comment + '\n' : ''
            })
          }
          else {
            text += comment ? spaceStr + '// ' + comment + '\n' : ''
          }
        }

        text += spaceStr + key + ': '

        if (typeof value === 'object') {
          text += stringify(value, pathStr, spaceLen)
        }
        else {
          text += value
        }

        text += ','
        text += '\n'
      })

      const spaceStr = ' '.repeat(space)
      text += spaceStr + '}'
      return text
    }
    else {
      return obj
    }
  }

  let text = ''
  if (comments.$) {
    text += '// ' + comments.$
    text += '\n'
  }
  text += stringify(data)
  return text
}

function getPath(obj, target) {
  const get = (obj, chain = []) => {
    const keys = Object.keys(obj)
    for (let i = 0, len = keys.length; i < len; i ++) {
      const key = keys[i]
      const value = obj[key]
      if (value === target) {
        chain.push(key)
        return chain
      }
      else if (typeof value === 'object') {
        chain.push(key)
        return get(value, chain)
      }
    }
    return chain
  }
  const chain = get(obj)
  const keyPath = makeKeyPath(chain)
  return keyPath
}

function createUrl(path, params = {}) {
  const keys = Object.keys(params)
  keys.forEach((key) => {
    const value = params[key]
    path = path.replace(new RegExp(`:${key}(\/|$)`, 'g'), value + '$1')
  })
  return path
}

module.exports = {
  stringify,
  getPath,
  createUrl,
}
