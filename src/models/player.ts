const USER_WORLD_ID: string = '1022'

export class Player {
  id: string
  username: string
  kills: number
  deadsByWorld: number

  constructor(line = '') {
    this.id = Player.getPlayerId(line)
    this.username = ''
    this.kills = 0
    this.deadsByWorld = 0
  }

  /**
   * Retrieves player ID found in the line passed by argument
   * @param  {string} line The line
   * @return {string}      The player ID
   */
  static getPlayerId(line: string): string {
    const regex = /Client(Connect|UserinfoChanged): ([0-9]*)/
    const playerId = line.match(regex)
    return playerId ? playerId[2] : '0'
  }

  /**
   * Creates a new player based on line information,
   * and add it to the Parser
   * @param  {Parser} parser The Parser
   * @param  {string} line   The line
   * @return {void}
   */
  static new(parser: any, line: string): void {
    const currentGame = parser.getCurrentGame()
    currentGame.newPlayer(new Player(line))
  }

  /**
   * Updates information about Player of the passed Parser
   * @param  {Parser} parser The Parser
   * @param  {string} line   Line that contains informations about the player
   * @return {void}
   */
  static update(parser: any, line: string): void {
    const currentGame = parser.getCurrentGame()
    const player = currentGame.getPlayerById(Player.getPlayerId(line))

    if (player) {
      player.update(line)
    } else {
      console.log(`[WARNING] Could not find player by ID (line: ${line})`)
    }
  }

  /**
   * Increment a kill to the Player of the passed Parser,
   * unless that the killer is the <world> player, in this
   * case the loser player loses a kill
   * @param  {Parser} parser The parser
   * @param  {string} line   Line that contains informations about the kill
   * @return {void}
   */
  static kill(parser: any, line: string): void {
    const currentGame = parser.getCurrentGame()
    const regex = /Kill: ([0-9]+) ([0-9]+)/
    const players = line.match(regex) // players[1] => Killer user ID, players[2] => Loser user ID
    if (players) {
      currentGame.addKill()
      if (players[1] === USER_WORLD_ID) {
        currentGame.players.get(players[2]).deadsByWorld++
      } else {
        currentGame.players.get(players[1]).addKill()
      }
    } else {
      console.log(
        `[WARNING] Could not find players to count kills (line: ${line})`,
      )
    }
  }

  /**
   * Calcs number of Player kills by subtracting
   * the number of deads by world for your number of kills
   * @return {integer} The number of Player kills
   */
  calcScore(): number {
    const score = this.kills - this.deadsByWorld
    return score < 0 ? 0 : score
  }

  /**
   * Add a kill to the player
   * @return {void}
   */
  addKill(): void {
    this.kills++
  }

  /**
   * Removes a kill of player
   * @return {void}
   */
  removeKill(): void {
    const killsToBeRemoved = this.kills > 0 ? 1 : 0
    this.kills -= killsToBeRemoved
  }

  /**
   * Updates user information with the passed line parsed
   * @param  {string} line The line
   * @return {void}
   */
  update(line: string): void {
    const match = line.match(
      /ClientUserinfoChanged: [0-9]* n\\(.*)\\t\\[0-9]+\\model/,
    )
    this.username = match ? match[1] : ''
  }
}
