import { RouterOptions } from './interfaces';
import Route from './Route';
import Routes from './Routes';

export { Route, Routes };

export default (opts?: RouterOptions): Routes => new Routes(opts);
