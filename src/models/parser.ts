import fs from 'fs'
import { Game } from './game'
import { Player } from './player'

interface GameSummary {
  [key: string]: {
    hostname: string
    version: string
    total_kills: number
    players: string[]
    kills: { [playerName: string]: number }
  }
}

export interface GameStats {
  totalKills: number
  killsByMeans: Record<string, number>
  killsByPlayers: Record<string, number>
  players: Player[]
}

const GET_LINE_COMMAND = /^.{0,7}([a-z A-Z][^:]*)/

export class Parser {
  games: Map<number, Game>
  private currentGame: number

  constructor() {
    this.games = new Map()
    this.currentGame = 0
  }

  /**
   * Adds new game to games collection
   * @param {Game} game The new game
   */
  addGame(game: Game): this {
    this.currentGame++
    this.games.set(this.currentGame, game)
    return this
  }

  /**
   * Converts games map in Object to be used on routes return
   * @return {Object} The converted games
   */
  toObject(): GameSummary {
    return Array.from(this.games.entries()).reduce(
      (ret, [idx, item]) => ({
        ...ret,
        [`game_${idx}`]: {
          hostname: item.hostname,
          version: item.version,
          total_kills: item.total_kills,
          players: item.playersNames(),
          kills: item.playersKills(),
        },
      }),
      {},
    )
  }

  /**
   * Reads the content of log file
   * @param {string} logFile Log file full path
   */
  async readFile(logFile: string): Promise<void> {
    const lines = (await fs.promises.readFile(logFile)).toString().split('\n')
    this.parseLines(lines)
  }

  /**
   * Loop through the array of lines and parse each one
   * @param {array} lines The lines that will be parsed
   */
  parseLines(lines: string[]): void {
    let command = ''
    let i = 0

    for (const line of lines) {
      command = line.match(GET_LINE_COMMAND)?.[1] ?? ''
      if (command) {
        this.checkCommand(command, line, i)
      } else {
        console.log(`Could not find command on line ${i}`)
      }
      i++
    }
  }
  /**
   * Checks if the found command found in the passed line
   * and execute a routine like create a new game, a new player
   * count kills or update a player information
   * @param  {string} command The command
   * @param  {string} line    The line that will be parsed
   * @param  {integer}    idx     The line number
   * @return {void}
   */

  checkCommand(command: string, line: string, idx: number): void {
    const commands: Record<string, () => void> = {
      InitGame: () => Game.new(this, line),
      ClientConnect: () => Player.new(this, line),
      ClientUserinfoChanged: () => Player.update(this, line),
      Kill: () => Player.kill(this, line),
    }
    const commandFn = commands[command]
    if (commandFn) {
      commandFn()
    } else {
      console.log(`[INFO] Command ${command} ignored (line: ${idx})`)
    }
  }

  getGameStats(log: string): GameStats {
    const gameStats: GameStats = {
      totalKills: 0,
      killsByMeans: {},
      killsByPlayers: {},
      players: [],
    }

    const lines = log.split('\n')

    for (const line of lines) {
      if (line.startsWith('InitGame')) {
        gameStats.players = []
        continue
      }

      if (line.startsWith('ClientUserinfoChanged')) {
        const [, userId, playerInfo] = line.match(
          /^ClientUserinfoChanged:\s\d+\s(.*)$/,
        ) || [, '', '']

        const [, name] = playerInfo.match(/n\\([^\\]*)\\/) || [, '']

        gameStats.players.push({ id: userId, name })
      }

      if (line.includes('killed')) {
        const [, killer, victim, mean] = line.match(
          /^.*\d:\d+\s(.*)\skilled\s(.*)\sby\s(.*)$/,
        ) || [, '', '', '']

        gameStats.totalKills++

        if (mean === '<world>') {
          if (!gameStats.killsByPlayers[victim]) {
            gameStats.killsByPlayers[victim] = 0
          }

          gameStats.killsByPlayers[victim]--
        } else {
          if (!gameStats.killsByMeans[mean]) {
            gameStats.killsByMeans[mean] = 0
          }

          if (!gameStats.killsByPlayers[killer]) {
            gameStats.killsByPlayers[killer] = 0
          }

          gameStats.killsByMeans[mean]++
          gameStats.killsByMeans[killer]++
        }
      }
    }

    return gameStats
  }

  /**
   * Returns the current game of parser in progress
   * @return {Game} The Game
   */
  getCurrentGame(game: Game) {
    return this.games.get(this.currentGame)
  }
}
