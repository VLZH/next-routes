import { compile, Key, PathFunction, pathToRegexp } from 'path-to-regexp';
import { InvalidRouteParametersError } from './exceptions';
import { Params, RouteOptions, Urls } from './interfaces';
import { toQuerystring } from './utils';

export default class Route {
  name: string;
  pattern: string;
  page: string;
  regex: RegExp;
  keys: Key[] = [];
  keyNames: (string | number)[];
  toPath: PathFunction;

  constructor({ name, pattern, page = name }: RouteOptions) {
    if (!name && !page) {
      throw new Error(`Missing page to render for route "${pattern}"`);
    }
    this.name = name;
    this.pattern = pattern || `/${name}`;
    this.page = page.replace(/(^|\/)index$/, '').replace(/^\/?/, '/');
    this.regex = pathToRegexp(this.pattern, this.keys);
    this.keyNames = this.keys.map(key => key.name);
    this.toPath = compile(this.pattern);
  }

  /**
   * Check path for match and on success match return object:
   * { params: {...params} }
   */
  match(path: string): { params: Params } | undefined {
    const values = this.regex.exec(path);
    if (values) {
      const params = this.valuesToParams(values.slice(1));
      return {
        params
      };
    }
  }

  /**
   * Convert values from regexp match to params
   */
  valuesToParams(values: string[]): Params {
    return values.reduce((params, val, i) => {
      if (val === undefined) return params;
      return Object.assign(params, {
        [this.keys[i].name]: decodeURIComponent(val)
      });
    }, {});
  }

  /*
   * Get url for next.js like: '/somepage?param=1'
   */
  getHref(incommingParams: Params = {}): string {
    return `${this.page}?${toQuerystring(incommingParams)}`;
  }

  /*
   * Get url for address line in browser like: '/a/:param/?param=1'
   */
  getAs(incommingParams: Params = {}): string {
    let as;
    try {
      as = this.toPath(incommingParams) || '/';
    } catch (error) {
      throw new InvalidRouteParametersError(this, incommingParams);
    }
    // filter params only declared in path-regexp
    const keys = Object.keys(incommingParams);
    const qsKeys = keys.filter(key => this.keyNames.indexOf(key) === -1);

    if (!qsKeys.length) return as;

    const qsParams = qsKeys.reduce(
      (qs, key) =>
        Object.assign(qs, {
          [key]: incommingParams[key]
        }),
      {}
    );

    return `${as}?${toQuerystring(qsParams)}`;
  }

  /**
   * Get Urls for this route by parameters
   * @param incommingParams IncommingParams
   */
  getUrls(incommingParams?: Params): Urls {
    const as = this.getAs(incommingParams);
    const href = this.getHref(incommingParams);
    return { as, href };
  }
}
