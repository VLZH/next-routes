import { Route } from '.';

export class InvalidParameterError extends Error {
  constructor(parameters: string[]) {
    super(`You do not define parameter: [${parameters.concat(', ')}]`);
  }
}

export class InvalidRouteParameters extends Error {
  constructor(route: Route, params: any) {
    super(
      `Invalid parameters for route; route name: ${
        route.name
      }; parameters: ${JSON.stringify(params)}`
    );
  }
}
