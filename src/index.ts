import { RouterOptions } from './interfaces';
import Route from './Route';
import Routes from './Routes';

const newRoutes = (opts?: RouterOptions): Routes => new Routes(opts);

export { Route, Routes, newRoutes };
export default newRoutes;
