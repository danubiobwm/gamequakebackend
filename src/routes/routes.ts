import { FastifyInstance } from 'fastify'
import { Parser } from '../models/parser'

import GamesController from '../controller/games_controller'

// Routes definition
const Router = (server: FastifyInstance, parser: Parser) => {
  const gamesController = new GamesController(parser)

  server.get('/api/v1/games', gamesController.index())
  server.get('/api/v1/games/:id', gamesController.show())
}

export default Router
