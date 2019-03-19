import React from 'react'
import { parse } from 'url'
import NextLink from 'next/link'
import NextRouter from 'next/router'
import Route from './Route'

export default class Routes {
  constructor({ Link = NextLink, Router = NextRouter } = {}) {
    this.routes = []
    this.Link = this.getLink(Link)
    this.Router = this.getRouter(Router)
  }

  /**
   * Add new route
   */
  add({ name = null, pattern, page }) {
    if (this.findByName(name)) {
      throw new Error(`Route "${name}" already exists`)
    }

    this.routes.push(new Route({ name, pattern, page }))
    return this
  }

  /**
   * Find route name by name
   */
  findByName(name) {
    if (name) {
      return this.routes.filter(route => route.name === name)[0]
    }
  }

  /**
   * Find the matched route to URL and return object like:
   * { route: Route, params: Object, query: Object }
   */
  match(url) {
    const parsedUrl = parse(url, true)
    const { pathname, query } = parsedUrl

    return this.routes.reduce(
      (result, route) => {
        if (result.route) return result
        const { params } = route.match(pathname) || {}
        if (!params) return result
        return {
          ...result,
          route,
          params,
          query: { ...query, ...params }
        }
      },
      { query, parsedUrl }
    )
  }

  /**
   * Find route by name or URL
   * case2: if route not fined by name, it will try to find a route by matches
   * case3: return nameOrUrl as 'as' and 'href' parameters
   * return: { route: Route, urls: {as: string, href: string} }
   */
  findAndGetUrls(nameOrUrl, params) {
    const route = this.findByName(nameOrUrl)

    if (route) {
      return { route, urls: route.getUrls(params), byName: true }
    } else {
      const { route, query } = this.match(nameOrUrl)
      const href = route ? route.getHref(query) : nameOrUrl
      const urls = { href, as: nameOrUrl }
      return { route, urls }
    }
  }

  getRequestHandler(app, customHandler) {
    const nextHandler = app.getRequestHandler()

    return (req, res) => {
      const { route, query, parsedUrl } = this.match(req.url)

      if (route) {
        if (customHandler) {
          customHandler({ req, res, route, query })
        } else {
          app.render(req, res, route.page, query)
        }
      } else {
        nextHandler(req, res, parsedUrl)
      }
    }
  }

  /**
   * Create wrapper-component for next/link
   */
  getLink(Link) {
    const LinkRoutes = props => {
      const { route, params, to, ...newProps } = props
      const nameOrUrl = route || to
      if (nameOrUrl) {
        const matched_route = this.findAndGetUrls(nameOrUrl, params)
        Object.assign(newProps, matched_route.urls)
      }
      return <Link {...newProps} />
    }
    return LinkRoutes
  }

  /**
   * Create wrapped router
   */
  getRouter(Router) {
    const wrap = method => (route, params, options) => {
      const {
        byName,
        urls: { as, href }
      } = this.findAndGetUrls(route, params)
      return Router[method](href, as, byName ? options : params)
    }

    Router.pushRoute = wrap('push')
    Router.replaceRoute = wrap('replace')
    Router.prefetchRoute = wrap('prefetch')
    return Router
  }
}
