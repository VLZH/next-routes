import pathToRegexp from 'path-to-regexp'

/**
 * Serialize params to querystring
 */
const toQuerystring = obj =>
  Object.keys(obj)
    .filter(key => obj[key] !== null && obj[key] !== undefined)
    .map(key => {
      let value = obj[key]

      if (Array.isArray(value)) {
        return value
          .map(
            arrayValue =>
              `${encodeURIComponent(key)}=${encodeURIComponent(arrayValue)}`
          )
          .join('&')
      }
      return [encodeURIComponent(key), encodeURIComponent(value)].join('=')
    })
    .join('&')

export default class Route {
  constructor({ name, pattern, page = name }) {
    if (!name && !page) {
      throw new Error(`Missing page to render for route "${pattern}"`)
    }

    this.name = name
    this.pattern = pattern || `/${name}`
    this.page = page.replace(/(^|\/)index$/, '').replace(/^\/?/, '/')
    this.regex = pathToRegexp(this.pattern, (this.keys = []))
    this.keyNames = this.keys.map(key => key.name)
    this.toPath = pathToRegexp.compile(this.pattern)
  }

  /**
   * Check path for match and on success match return object:
   * { params: {...params} }
   */
  match(path) {
    const values = this.regex.exec(path)
    if (values) {
      let params = this.valuesToParams(values.slice(1))
      return {
        params
      }
    }
  }

  /**
   * Convert values from regexp match to params
   */
  valuesToParams(values) {
    return values.reduce((params, val, i) => {
      if (val === undefined) return params
      return Object.assign(params, {
        [this.keys[i].name]: decodeURIComponent(val)
      })
    }, {})
  }

  /*
   * Get url for next.js like: '/somepage?param=1'
   */
  getHref(params = {}) {
    return `${this.page}?${toQuerystring(params)}`
  }

  /*
   * Get url for address line in browser like: '/a/:param/?param=1'
   */
  getAs(params = {}) {
    // get pathname by params
    const as = this.toPath(params) || '/'
    // filter params only declared in path-regexp
    const keys = Object.keys(params)
    const qsKeys = keys.filter(key => this.keyNames.indexOf(key) === -1)

    if (!qsKeys.length) return as

    const qsParams = qsKeys.reduce(
      (qs, key) =>
        Object.assign(qs, {
          [key]: params[key]
        }),
      {}
    )

    return `${as}?${toQuerystring(qsParams)}`
  }

  getUrls(params) {
    const as = this.getAs(params)
    const href = this.getHref(params)
    return { as, href }
  }
}
