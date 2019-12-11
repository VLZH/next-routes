import { Params } from './interfaces';

/**
 * Serialize params to querystring
 */
export const toQuerystring = (obj: Params): string =>
  Object.keys(obj)
    .filter(key => obj[key] !== null && obj[key] !== undefined)
    .map(key => {
      const value = obj[key];

      if (Array.isArray(value)) {
        return value
          .map(
            arrayValue =>
              `${encodeURIComponent(key)}=${encodeURIComponent(arrayValue)}`
          )
          .join('&');
      }
      return [encodeURIComponent(key), encodeURIComponent(value)].join('=');
    })
    .join('&');
