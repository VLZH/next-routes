import * as http from 'http'
import * as next from 'next'
import routes from '../..'

const r = routes()
  .add({ name: 'login' })
  .add({ name: 'home', pattern: '/', page: 'index' })
  .add({ name: '/settings', pattern: '/users/:id/settings' })
  .add({ pattern: '/example', page: 'example' })
  .add({ name: 'objectstyle', pattern: '/cool', page: 'cool' })

export const createServer = () => {
  const app = next({ dev: true })
  return app.prepare().then(() => {
    return http.createServer(r.getRequestHandler(app))
  })
}

export default r
