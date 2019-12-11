import { Route } from '.';

export class InvalidParameterError extends Error {
  constructor(parameters: string[]) {
    super(
      `all parameters for each route is required. you must to define ['name', 'pattern', 'page'] for each route
      missing parameters: [${parameters.concat(', ')}]`
    );
  }
}

export class InvalidRouteParametersError extends Error {
  constructor(route: Route, params: any) {
    super(
      `invalid params for route; route name: ${
        route.name
      }; parameters: ${JSON.stringify(params)}`
    );
  }
}

export class UndefinedChildrenError extends Error {
  constructor() {
    super(
      'invalid props for <Link> component. prop "children" for <Link> is required'
    );
  }
}

export class UndefinedRouteOrHrefError extends Error {
  constructor(nameOrUrl: any, href: any, params: any) {
    super(
      `invalid props for <Link> component. props 'route' of 'href' is required,
      but props of <Link> is {route: ${nameOrUrl}, to: ${nameOrUrl}, href: ${href}, params: ${JSON.stringify(
        params
      )}}`
    );
  }
}
