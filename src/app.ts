import fastify from 'fastify'
import { Parser } from './models/parser'
import GamesController from './controller/games_controller'

// Initialize Parser Object
const parser = new Parser()

// Parse the games.log file
parser.readFile(`${__dirname}/data/games.log`)

// Server connection setup
const server = fastify()

server.listen(
  process.env.PORT || 3333,
  process.env.HOST || '0.0.0.0',
  (err) => {
    if (err) {
      throw err
    }

    const address = server.server.address()
    if (address && typeof address !== 'string') {
      console.log(`Server listening on ${address.address}:${address.port}`)
    }
  },
)

// Define server routes
const gamesController = new GamesController(parser)

server.get('/api/v1/games', gamesController.index())
server.get('/api/v1/games/:id', gamesController.show())

export = server
