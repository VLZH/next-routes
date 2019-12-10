import { compile, Key, PathFunction, pathToRegexp } from 'path-to-regexp';
import { InvalidRouteParameters } from './exceptions';
import {
  IncommingParams,
  MatchedParams,
  RouteOptions,
  Urls
} from './interfaces';
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
  match(path: string): { params: MatchedParams } | undefined {
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
  valuesToParams(values: string[]): MatchedParams {
    return values.reduce((params, val, i) => {
      if (val === undefined) return params;
      return (Object as any).assign(params, {
        [this.keys[i].name]: decodeURIComponent(val)
      });
    }, {});
  }

  /*
   * Get url for next.js like: '/somepage?param=1'
   */
  getHref(params: IncommingParams = {}): string {
    return `${this.page}?${toQuerystring(params)}`;
  }

  /*
   * Get url for address line in browser like: '/a/:param/?param=1'
   */
  getAs(params: IncommingParams = {}): string {
    let as;
    try {
      as = this.toPath(params) || '/';
    } catch (error) {
      throw new InvalidRouteParameters(this, params);
    }
    // filter params only declared in path-regexp
    const keys = Object.keys(params);
    const qsKeys = keys.filter(key => this.keyNames.indexOf(key) === -1);

    if (!qsKeys.length) return as;

    const qsParams = qsKeys.reduce(
      (qs, key) =>
        (Object as any).assign(qs, {
          [key]: params[key]
        }),
      {}
    );

    return `${as}?${toQuerystring(qsParams)}`;
  }

  /**
   * Get Urls for this route by parameters
   * @param params IncommingParams
   */
  getUrls(params: IncommingParams): Urls {
    const as = this.getAs(params);
    const href = this.getHref(params);
    return { as, href };
  }
}
