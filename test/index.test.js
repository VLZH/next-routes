/* global jest, describe, test, expect */
import React from 'react'
import ReactShallowRenderer from 'react-test-renderer/shallow'
import NextLink from 'next/link'
import nextRoutes from '..'

const renderer = new ReactShallowRenderer()

const setupRoute = (...args) => {
  const routes = nextRoutes().add(...args)
  const route = routes.routes[routes.routes.length - 1]
  return { routes, route }
}

describe('Routes', () => {
  const setup = (...args) => {
    const { routes, route } = setupRoute(...args)
    const testRoute = expected => expect(route).toMatchObject(expected)
    return { routes, route, testRoute }
  }

  test('add with object', () => {
    setup({ name: 'a' }).testRoute({ name: 'a', pattern: '/a', page: '/a' })
  })

  test('add with name', () => {
    setup({ name: 'a' }).testRoute({ name: 'a', pattern: '/a', page: '/a' })
  })

  test('add with name and pattern', () => {
    setup({ name: 'a', pattern: '/:a' }).testRoute({
      name: 'a',
      pattern: '/:a',
      page: '/a'
    })
  })

  test('add with name, pattern and page', () => {
    setup({ name: 'a', pattern: '/:a', page: 'b' }).testRoute({
      name: 'a',
      pattern: '/:a',
      page: '/b'
    })
  })

  test('add with pattern and page', () => {
    setup({ pattern: '/:a', page: 'b' }).testRoute({
      name: null,
      pattern: '/:a',
      page: '/b'
    })
  })

  test('add with only pattern throws', () => {
    expect(() => setup({ pattern: '/:a' })).toThrow()
  })

  test('add with existing name throws', () => {
    expect(() =>
      nextRoutes()
        .add('a')
        .add('a')
    ).toThrow()
  })

  test('add multiple unnamed routes', () => {
    expect(
      nextRoutes()
        .add({ pattern: '/a', page: 'a' })
        .add({ pattern: '/b', page: 'b' }).routes.length
    ).toBe(2)
  })

  test('page with leading slash', () => {
    setup({ name: 'a', pattern: '/', page: '/b' }).testRoute({ page: '/b' })
  })

  test('page index becomes /', () => {
    setup({ name: 'index', pattern: '/' }).testRoute({ page: '/' })
  })

  test('match and merge params into query', () => {
    const routes = nextRoutes()
      .add({ name: 'a' })
      .add({ name: 'b', pattern: '/:a?/b/:b' })
      .add({ name: 'c' })
    const { query } = routes.match('/b/b?b=x&c=c')
    expect(query).toMatchObject({ b: 'b', c: 'c' })
    expect(query).not.toHaveProperty('a')
  })

  test('match and merge escaped params', () => {
    const routes = nextRoutes().add({ name: 'a', pattern: '/a/:b' })
    const { query } = routes.match('/a/b%20%2F%20b')
    expect(query).toMatchObject({ b: 'b / b' })
    expect(query).not.toHaveProperty('a')
  })

  test('generate urls from params', () => {
    const { route } = setup({ name: 'a', pattern: '/a/:b/:c+' })
    const params = { b: 'b', c: [1, 2], d: 'd' }
    const expected = { as: '/a/b/1/2?d=d', href: '/a?b=b&c=1&c=2&d=d' }
    expect(route.getUrls(params)).toEqual(expected)
    expect(setup({ name: 'a' }).route.getUrls()).toEqual({
      as: '/a',
      href: '/a?'
    })
  })

  test('generate urls with params that need escaping', () => {
    const { route } = setup({ name: 'a', pattern: '/a/:b' })
    const params = { b: 'b b' }
    const expected = { as: '/a/b%20b', href: '/a?b=b%20b' }
    expect(route.getUrls(params)).toEqual(expected)
    expect(setup({ name: 'a' }).route.getUrls()).toEqual({
      as: '/a',
      href: '/a?'
    })
  })

  test('do not pass "null" for params that have null values', () => {
    const { route } = setup({ name: 'a', pattern: '/a/:b/:c?' })
    const params = { b: 'b', c: null, d: undefined }
    const expected = { as: '/a/b?', href: '/a?b=b' }
    expect(route.getUrls(params)).toEqual(expected)
    expect(setup({ name: 'a' }).route.getUrls()).toEqual({
      as: '/a',
      href: '/a?'
    })
  })

  test('ensure "as" when path match is empty', () => {
    expect(setup({ name: 'a', pattern: '/:a?' }).route.getAs()).toEqual('/')
  })

  test('with custom Link and Router', () => {
    const CustomLink = () => <div />
    const CustomRouter = {}
    const { Link, Router } = nextRoutes({
      Link: CustomLink,
      Router: CustomRouter
    })
    expect(renderer.render(<Link />).type).toBe(CustomLink)
    expect(Router).toBe(CustomRouter)
  })
})

describe('Request handler', () => {
  const setup = url => {
    const routes = nextRoutes()
    const nextHandler = jest.fn()
    const app = { getRequestHandler: () => nextHandler, render: jest.fn() }
    return { app, routes, req: { url }, res: {} }
  }

  test('find route and call render', () => {
    const { routes, app, req, res } = setup('/a')
    const { route, query } = routes.add({ name: 'a' }).match('/a')
    routes.getRequestHandler(app)(req, res)
    expect(app.render).toBeCalledWith(req, res, route.page, query)
  })

  test('find route and call custom handler', () => {
    const { routes, app, req, res } = setup('/a')
    const { route, query } = routes.add({ name: 'a' }).match('/a')
    const customHandler = jest.fn()
    const expected = expect.objectContaining({ req, res, route, query })
    routes.getRequestHandler(app, customHandler)(req, res)
    expect(customHandler).toBeCalledWith(expected)
  })

  test('find no route and call next handler', () => {
    const { routes, app, req, res } = setup('/a')
    const { parsedUrl } = routes.match('/a')
    routes.getRequestHandler(app)(req, res)
    expect(app.getRequestHandler()).toBeCalledWith(req, res, parsedUrl)
  })
})

describe('Link', () => {
  const setup = (...args) => {
    const { routes, route } = setupRoute(...args)
    const { Link } = routes
    const props = { children: <a>hello</a> }
    const testLink = (addProps, expected) => {
      const actual = renderer.render(<Link {...props} {...addProps} />)
      expect(actual.type).toBe(NextLink)
      expect(actual.props).toEqual({ ...props, ...expected })
    }
    return { routes, route, testLink }
  }

  test('with name and params', () => {
    const { route, testLink } = setup({ name: 'a', pattern: '/a/:b' })
    testLink({ route: 'a', params: { b: 'b' } }, route.getUrls({ b: 'b' }))
  })

  test('with route url', () => {
    const { routes, route, testLink } = setup({ pattern: '/a/:b', page: 'a' })
    testLink({ route: '/a/b' }, route.getUrls(routes.match('/a/b').query))
  })

  test('with to', () => {
    const { routes, route, testLink } = setup({ pattern: '/a/:b', page: 'a' })
    testLink({ to: '/a/b' }, route.getUrls(routes.match('/a/b').query))
  })

  test('with route not found', () => {
    setup({ name: 'a' }).testLink({ route: '/b' }, { href: '/b', as: '/b' })
  })

  test('without route', () => {
    setup({ name: 'a' }).testLink({ href: '/' }, { href: '/' })
  })

  test('with empty params', () => {
    expect.assertions(1)
    try {
      setup({ name: 'c', pattern: '/c/:b' }).testLink(
        { route: 'c', params: {} },
        { as: '/c/b', href: '/c?b=b' }
      )
    } catch (e) {
      expect(e instanceof Error).toEqual(true)
    }
  })

  //test('with exact=true', () => {
  //setup('/a/:b').testLink({ exact: false, route: 'a' }, { active: true })
  //})
})

const routerMethods = ['push', 'replace', 'prefetch']

describe(`Router ${routerMethods.join(', ')}`, () => {
  const setup = (...args) => {
    const { routes, route } = setupRoute(...args)
    const testMethods = (args, expected) => {
      routerMethods.forEach(method => {
        const Router = routes.getRouter({ [method]: jest.fn() })
        Router[`${method}Route`](...args)
        expect(Router[method]).toBeCalledWith(...expected)
      })
    }
    return { routes, route, testMethods }
  }

  test('with name and params', () => {
    const { route, testMethods } = setup({ name: 'a', pattern: '/a/:b' })
    const { as, href } = route.getUrls({ b: 'b' })
    testMethods(['a', { b: 'b' }, {}], [href, as, {}])
  })

  test('with route url', () => {
    const { routes, testMethods } = setup({ pattern: '/a', page: 'a' })
    const { route, query } = routes.match('/a')
    const { as, href } = route.getUrls(query)
    testMethods(['/a', {}], [href, as, {}])
  })

  test('with route not found', () => {
    setup({ name: 'a' }).testMethods(['/b', {}], ['/b', '/b', {}])
  })
})
