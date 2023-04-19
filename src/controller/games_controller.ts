import { FastifyReply, FastifyRequest } from 'fastify'
import { Parser } from '../models/parser'

class GamesController {
  private parse: Parser

  constructor(parse: Parser) {
    this.parse = parse
  }

  index() {
    return async (_: FastifyRequest, reply: FastifyReply) => {
      reply.send(this.parse.toObject())
    }
  }

  show() {
    return async (
      req: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply,
    ) => {
      const gameId = `game_${req.params.id}`
      const game = this.parse.toObject()[gameId]

      if (game) {
        reply.send(game)
      } else {
        reply.status(404).send({ error: `Game ${req.params.id} not found` })
      }
    }
  }
}
export default GamesController
