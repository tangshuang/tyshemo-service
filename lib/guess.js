const { each, map, isArray, isObject, isNumeric, createSafeExp, isEqual } = require('ts-fns')

function getType(value) {
  if (isObject(value)) {
    return guess(value)
  }
  else if (isArray(value)) {
    return value.map(item => guess(item))
  }
  else if (value === null) {
    return 'null'
  }
  else if (value === undefined) {
    return 'undefined'
  }
  else if (typeof value === 'number' && isNaN(value)) {
    return 'nan'
  }
  else if (isNumeric(value)) {
    return 'numeric'
  }
  else {
    return typeof value
  }
}

export function guess(data) {
  const res = map(data, getType)
  return res
}

/**
 * create new type description based on previous version
 * @param {*} prev
 * @param {*} data
 * @returns
 */
export function merge(exist, data) {
  const res = {}
  const checkedKeys = {}
  const existKeys = Object.keys(exist)

  const findKey = (key) => {
    const existKey = existKeys.find(item => new RegExp(`^${createSafeExp(key)}[?!&=|*]*$`).test(item))
    return existKey
  }

  each(data, (value, key) => {
    const prevKey = findKey(key)
    const hasKey = !!prevKey
    const next = getType(value)

    if (hasKey) {
      checkedKeys[prevKey] = 1

      // TODO 基于权重决定是应该替换部分，还是整体作为enum

      const prev = exist[prevKey]
      const prevRules = prevKey.replace(key, '')
      const isEnum = prevRules.indexOf('|') > -1
      if (isEnum && !isArray(prev)) {
        throw new Error(`${prevKey} in previous type description should be an array, but receive ${typeof prev}`)
      }

      const prevItems = isEnum ? prev : [].concat(prev)
      const inPrev = prevItems.some(item => isEqual(item, next))
      if (inPrev) {
        res[prevKey] = prev
        return
      }

      if (next === 'null' || next === 'undefined') {
        const isNonable = prevKey.indexOf('&') > -1
        const nextKey = isNonable ? prevKey : prevKey + '&'
        res[nextKey] = prev
        return
      }

      const nextKey = isEnum ? prevKey : prevKey + '|'
      res[nextKey] = prevItems.push(next)
    }
    else {
      checkedKeys[key] = 1
      res[key] = next
    }
  })

  each(exist, (value, key) => {
    if (checkedKeys[key]) {
      return
    }

    const isOptional = key.indexOf('?') > -1
    const nextKey = isOptional ? nextKey : key + '?'
    res[nextKey] = value
  })

  return res
}