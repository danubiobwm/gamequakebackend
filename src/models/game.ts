import { Player } from './player'
import { Parser } from './parser'

export class Game {
  public players: Map<string, Player>
  public total_kills: number
  public hostname: string
  public version: string

  constructor(line: string = '') {
    this.players = new Map()
    this.total_kills = 0
    this.hostname = this.version = ''
    if (line.length > 0) {
      const hostnameMatch = line.match(/sv_hostname\\([a-z A-Z 0-9][^\\]*)/)
      if (hostnameMatch) {
        this.hostname = hostnameMatch[1]
      }
      const versionMatch = line.match(/version\\(.*)\\protocol/)
      if (versionMatch) {
        this.version = versionMatch[1]
      }
    }
  }

  /**
   * Creates a new Game and add it to the parser
   * @param  {Parser} parser The Parser
   * @param  {string} line   The line that will be parsed to create a new Game
   * @return {void}
   */
  public static new(parser: Parser, line: string): void {
    parser.addGame(new Game(line))
  }

  /**
   * Increment game number of kills
   * @return {void}
   */
  public addKill(): void {
    this.total_kills++
  }

  /**
   * Finds a player by ID on game and return it
   * @param  {string} id The Player ID
   * @return {Player}    The Player
   */
  public getPlayerById(id: string): Player | null {
    const player = this.players.get(id)
    return player !== undefined ? player : null
  }

  /**
   * Adds the passed player to the game
   * @param  {Player} player The new game player
   * @return {void}
   */
  public newPlayer(player: Player): void {
    this.players.set(player.id, player)
  }

  /**
   * Returns the players names of the game
   * @example ['DANJOS']
   * @return {array} The players names
   */
  public playersNames(): string[] {
    return Array.from(this.players.values()).map((player) => player.username)
  }

  /**
   * Returns the number of kills by each player
   * @example { 'DANJOS': 1 }
   * @return {Object} The players kills
   */
  public playersKills(): Record<string, number> {
    return Array.from(this.players.values()).reduce((result, player) => {
      result[player.username] = player.calcScore()
      return result
    }, {} as Record<string, number>)
  }
}
