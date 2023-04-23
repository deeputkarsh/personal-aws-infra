interface TimeObj {
  miliSecs: number
  seconds: number
  minutes: number
  hours: number
  days: number
  months: number
  messages: string[]
}

export class Timer {
  name: string

  totalTime: number

  interval: number

  resolved: boolean

  startTime: number

  elapsedTime: number

  constructor (timerName: string, totalTime: number = 0, interval: number = 0) {
    this.name = timerName
    this.totalTime = totalTime * 1000
    this.interval = interval * 1000
    this.resolved = false
    this.startTime = 0
    this.elapsedTime = 0
  }

  async wait (): Promise<string> {
    this.startTime = this.startTime ?? Date.now()
    this.elapsedTime = Date.now() - this.startTime
    if (this.resolved || this.elapsedTime >= this.totalTime) {
      return await Promise.resolve('done')
    }

    return await new Promise((resolve, reject) => {
      setTimeout(
        () => { this.wait().then(resolve).catch(reject) },
        this.interval
      )
    })
  }

  static async staticWait (interval: number): Promise<string> {
    return await new Promise((resolve) => {
      setTimeout(
        () => { resolve('done') },
        interval * 1000
      )
    })
  }

  printMessage (message: string): void {
    this.startTime = this.startTime ?? Date.now()
    this.elapsedTime = Date.now() - this.startTime
    // eslint-disable-next-line no-param-reassign
    message = `${this.name} : ${message}` ?? `${this.name} : TimeTaken`
    if (this.elapsedTime > 0) {
      const printMessage = [message]
      Timer.getString(this.elapsedTime, printMessage)
      return
    }
    console.log(`${message} ${new Date().toString()}`)
  }

  static getString (elapsedTime: number, printMessage: string[] = []): void {
    const { messages } = Timer.getTimeDiff(elapsedTime)
    console.log([...printMessage, ...messages].join(' '))
  }

  static getTimeDiff (elapsedTime: number): TimeObj {
    const timeObj: TimeObj = {
      miliSecs: 0,
      seconds: 0,
      minutes: 0,
      hours: 0,
      days: 0,
      months: 0,
      messages: []
    }
    timeObj.miliSecs = elapsedTime % 1000
    timeObj.messages.splice(0, 0, `${timeObj.miliSecs} ms`)
    timeObj.seconds = Math.floor(elapsedTime / 1000)
    if (timeObj.seconds > 60) {
      timeObj.minutes = Math.floor(timeObj.seconds / 60)
      timeObj.seconds %= 60
    }
    if (timeObj.seconds > 0) { timeObj.messages.splice(0, 0, `${timeObj.seconds} seconds`) }
    if (timeObj.minutes > 60) {
      timeObj.hours = Math.floor(timeObj.minutes / 60)
      timeObj.minutes %= 60
    }
    if (timeObj.minutes > 0) { timeObj.messages.splice(0, 0, `${timeObj.minutes} minutes`) }
    if (timeObj.hours > 24) {
      timeObj.days = Math.floor(timeObj.hours / 24)
      timeObj.hours %= 24
    }
    if (timeObj.hours > 0) {
      timeObj.messages.splice(0, 0, `${timeObj.hours} hours`)
    }
    if (timeObj.days > 30) {
      timeObj.months = Math.floor(timeObj.days / 30)
      timeObj.days %= 30
    }
    if (timeObj.days > 0) {
      timeObj.messages.splice(0, 0, `${timeObj.days} days`)
    }
    if (timeObj.months > 0) {
      timeObj.messages.splice(0, 0, `${timeObj.months} months`)
    }
    return timeObj
  }
}

export default Timer
