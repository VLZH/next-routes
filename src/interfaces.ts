import Link from 'next/link';
import { SingletonRouter } from 'next/router';
import { ParsedUrlQuery } from 'querystring';
import Route from './Route';
import { UrlWithParsedQuery } from 'url';

export type HrefCorrector = (href: string) => string;

export interface RouterOptions {
  Link?: typeof Link;
  Router?: SingletonRouter;
  hrefCorrector?: HrefCorrector;
}

export interface RouteOptions {
  name: string;
  pattern: string;
  page: string;
}

export interface Params {
  [key: string]: string;
}

export interface Urls {
  as: string;
  href: string;
}

export interface MatchResult {
  route?: Route;
  parsedUrl: UrlWithParsedQuery;
  params: Params;
  query: ParsedUrlQuery;
}

export interface FindRouteResult {
  route?: Route;
  urls: Urls;
  byName: boolean;
}

export type CustomHandler = (options: {
  req: any;
  res: any;
  route: any;
  query: any;
}) => void;
