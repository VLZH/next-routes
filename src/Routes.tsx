import Server from 'next/dist/next-server/server/next-server';
import NextLink, { LinkProps } from 'next/link';
import NextRouter, { SingletonRouter, useRouter } from 'next/router';
import React from 'react';
import { parse } from 'url';
import {
  InvalidParameterError,
  UndefinedRouteOrHrefError,
  UndefinedChildrenError
} from './exceptions';
import {
  CustomHandler,
  FindRouteResult,
  HrefCorrector,
  Params,
  MatchResult,
  RouteOptions,
  RouterOptions,
  RoutesRouter,
  RoutesRouteMethod
} from './interfaces';
import Route from './Route';

interface LinkRoutesProps extends Partial<LinkProps> {
  route?: string;
  to?: string;
  params?: Params;
  exact?: object;
  activeClassName?: string;
  children?: any;
}

type RoutesNextLink = React.FC<LinkRoutesProps>;

export default class Routes {
  routes: Route[];
  Link: RoutesNextLink;
  Router: RoutesRouter;

  constructor({
    Link = NextLink,
    Router = NextRouter,
    hrefCorrector = (v: any) => v
  }: RouterOptions = {}) {
    this.routes = [];
    this.Link = this.getLink(Link, hrefCorrector);
    this.Router = this.getRouter(Router);
  }

  /**
   * Register new route in Router
   */
  add(parameters: RouteOptions) {
    const { name, pattern, page } = parameters;

    if (![name, pattern, page].every(v => !!v)) {
      const undefinedKeys = (Object.keys(parameters) as Array<
        keyof RouteOptions
      >).filter(k => parameters[k]);
      throw new InvalidParameterError(undefinedKeys);
    }

    if (this.findByName(name)) {
      throw new Error(`Route "${name}" already exists`);
    }

    this.routes.push(new Route({ name, pattern, page }));
    return this;
  }

  /**
   * Find route name by name
   */
  findByName(name: string) {
    if (name) {
      return this.routes.filter(route => route.name === name)[0];
    }
  }

  /**
   * Find route by url and return MatchResult
   * @param url
   * @returns {MatchResult}
   */
  match(url: string): MatchResult {
    const parsedUrl = parse(url, true);
    const { pathname, query } = parsedUrl;
    return this.routes.reduce(
      (result, route) => {
        if (result.route) {
          return result;
        }
        const { params } = route.match(pathname as string) || {};
        if (!params) {
          return result;
        }
        return {
          ...result,
          route,
          params,
          query: { ...query, ...params }
        } as MatchResult;
      },
      { query, parsedUrl, route: undefined, params: undefined } as any
    );
  }

  /**
   * Find route by name and return FindRouteResult ({route: Route, urls: {href: string, as: string}})
   * When match is unsuccessfuly we just return nameOrUrl as 'href' and 'as'
   */
  findAndGetUrls(nameOrUrl: string, params?: Params): FindRouteResult {
    const route = this.findByName(nameOrUrl);
    if (route) {
      return { route, urls: route.getUrls(params), byName: true };
    } else {
      const mr = this.match(nameOrUrl);
      const { route, query } = mr;
      const href = route ? route.getHref(query as Params) : nameOrUrl;
      const urls = { href, as: nameOrUrl };
      return { route, urls, byName: false };
    }
  }

  getRequestHandler(app: Server, customHandler?: CustomHandler) {
    const nextHandler = app.getRequestHandler();
    return (req: any, res: any) => {
      const { route, query, parsedUrl } = this.match(req.url);

      if (route) {
        if (customHandler) {
          customHandler({ req, res, route, query });
        } else {
          app.render(req, res, route.page, query);
        }
      } else {
        nextHandler(req, res, parsedUrl);
      }
    };
  }

  /**
   * Create wrapper-component for next/link
   */
  getLink(Link: typeof NextLink, hrefCorrector: HrefCorrector): RoutesNextLink {
    const LinkRoutes: React.FC<LinkRoutesProps> = (props: LinkRoutesProps) => {
      const {
        route,
        params,
        to,
        //
        exact = true,
        activeClassName = 'active',
        children,
        ...newProps
      } = props;
      const router = useRouter();
      const nameOrUrl = route || to;
      let active = false;

      if (!children) {
        throw new UndefinedChildrenError();
      }

      if (!nameOrUrl && !newProps.href) {
        throw new UndefinedRouteOrHrefError(nameOrUrl, newProps.href, params);
      }

      if (nameOrUrl) {
        const { urls, route } = this.findAndGetUrls(nameOrUrl, params);
        Object.assign(newProps, urls);
        // check matching of current pathname in browser address and this link
        if (route) {
          if (exact) {
            active = route.getAs(params) === hrefCorrector(router.asPath);
          } else {
            active = !!route.match(hrefCorrector(router.asPath));
          }
        }
      }

      // get new className for children element
      const className = `${children.props.className || ''} ${
        active ? activeClassName : ''
      }`;

      const _children = React.cloneElement(
        children,
        className
          ? {
              className
            }
          : {}
      );

      return <Link {...(newProps as LinkProps)}>{_children}</Link>;
    };
    (LinkRoutes as any).displayName = 'LinkRoutes';
    return LinkRoutes;
  }

  /**
   * Create wrapped router
   */
  getRouter(Router: SingletonRouter): RoutesRouter {
    const wrap = (method: string): RoutesRouteMethod => (
      route: string,
      params: Params,
      options?: object
    ) => {
      const fr = this.findAndGetUrls(route, params);
      const {
        byName,
        urls: { as, href }
      } = fr as FindRouteResult;
      return (Router as any)[method](href, as, byName ? options : params);
    };
    const router = {
      ...Router,
      pushRoute: wrap('push'),
      replaceRoute: wrap('replace'),
      prefetchRoute: wrap('prefetch')
    } as RoutesRouter;

    return router;
  }
}
