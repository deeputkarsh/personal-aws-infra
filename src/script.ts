import { SCRIPT_CONFIG, TASKS } from './config'
import Timer from './utility/timer';

(async function start () {
  const mainTimer = new Timer('main')
  try {
    mainTimer.printMessage('Started at')
    let data: any
    switch (SCRIPT_CONFIG.TASK_NAME) {
      case TASKS.TEST:
        data = 'TEST TASK'
        break
      default:
        data = 'no op'
    }
    mainTimer.printMessage('Total TimeTaken')
    console.log(`Result : ${JSON.stringify(data, null, 2)}`)
    process.exit(0)
  } catch (error) {
    console.error(error)
    process.exit(1)
  }
}()).then(() => { console.log('done') }).catch(console.error)
