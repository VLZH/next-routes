import { IncomingMessage, ServerResponse } from 'http'
import { Server } from 'next'
import { ComponentType } from 'react'
import NextLink, { LinkState } from 'next/link'
import { SingletonRouter, EventChangeOptions } from 'next/router'

export type addRouteOptions = {
  name?: string
  pattern?: string
  page?: string
}

export type HTTPHandler = (
  request: IncomingMessage,
  response: ServerResponse
) => void

export type RouteParams = {
  [k: string]: string | number
}

export interface LinkProps extends LinkState {
  route: string
  params?: RouteParams
  exact?: Boolean
  activeClassName?: string
}

export interface Router extends SingletonRouter {
  pushRoute(
    route: string,
    params?: RouteParams,
    options?: EventChangeOptions
  ): Promise<boolean>
  replaceRoute(
    route: string,
    params?: RouteParams,
    options?: EventChangeOptions
  ): Promise<boolean>
  prefetchRoute(
    route: string,
    params?: RouteParams
  ): Promise<React.ComponentType<any>>
}

export interface Registry {
  getRequestHandler(app: Server, custom?: HTTPHandler): HTTPHandler
  add(options: addRouteOptions): this
  Link: ComponentType<LinkProps>
  Router: Router
}

export class Routes implements Registry {
  new(opts?: { Link?: NextLink; Router?: SingletonRouter }): Routes
  getRequestHandler(app: Server, custom?: HTTPHandler): HTTPHandler
  add(options: addRouteOptions): this
  Link: ComponentType<LinkProps>
  Router: Router
}

export default function routes(opts?: {
  Link?: NextLink
  Router?: SingletonRouter
  hrefCorrector?: (href: string) => string
}): Routes
