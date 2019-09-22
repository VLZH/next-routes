import React from 'react'
import { parse } from 'url'
import NextLink from 'next/link'
import cn from 'classnames'
import NextRouter, { withRouter } from 'next/router'
import Route from './Route'

export default class Routes {
  constructor({
    Link = NextLink,
    Router = NextRouter,
    hrefCorrector = v => v
  } = {}) {
    this.routes = []
    this.Link = this.getLink(Link, hrefCorrector)
    this.Router = this.getRouter(Router)
  }

  /**
   * Add new route
   */
  add({ name, pattern, page }) {
    if (![name, pattern, page].every(v => !!v)) {
      const args = { name, pattern, page }
      const undefined_values = Object.keys(args).filter(k => !args[k])
      throw new Error(
        `Every value is required; Undefined values: [${undefined_values.concat(
          ','
        )}]`
      )
    }
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
  getLink(Link, hrefCorrector) {
    let LinkRoutes = props => {
      const {
        route,
        params,
        to,
        //
        router,
        exact = true,
        activeClassName = 'active',
        children,
        ...newProps
      } = props
      const nameOrUrl = route || to
      let active = false

      if (!children) {
        throw new Error('children props for Link is required')
      }

      if (nameOrUrl) {
        const { urls, route } = this.findAndGetUrls(nameOrUrl, params)
        Object.assign(newProps, urls)

        // check matching of current pathname in browser address and this link
        if (router) {
          if (exact) {
            active = route.getAs(params) === hrefCorrector(router.asPath)
          } else {
            active = !!route.match(hrefCorrector(router.asPath))
          }
        }
      }

      // get new className for children element
      const className = cn(children.props.className, {
        [activeClassName]: active
      })

      const _children = React.cloneElement(
        children,
        /* eslint-disable */
        className
          ? {
              className
            }
          : {}
        /* eslint-enable */
      )

      return <Link {...newProps}>{_children}</Link>
    }
    LinkRoutes.displayName = 'LinkRoutes'
    return withRouter(LinkRoutes)
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
