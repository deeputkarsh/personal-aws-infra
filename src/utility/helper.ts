import { promises as fsPromises } from 'fs'

type ChunkItem = any

export const Helper = {
  getChunks (itemsArray: ChunkItem[] = [], chunkSize: number = 10): ChunkItem[][] {
    const batches = []
    for (let i = 0; i < itemsArray.length; i += chunkSize) {
      batches.push(itemsArray.slice(i, i + chunkSize))
    }
    return batches
  },

  async writeToJson (fileName: string, json: any) {
    const filePath = `local/jsons/${fileName}.json`
    await Helper.ensureFolderExists(filePath)
    await fsPromises
      .writeFile(filePath, JSON.stringify(json, null, 2))
  },

  async ensureFolderExists (filePath: string) {
    const folder = filePath.split('/')
    folder.pop()
    const folderPath = folder.join('/')
    const exists = await fsPromises.access(folderPath).then(() => true).catch(() => false)
    if (!exists) {
      await fsPromises.mkdir(folderPath, { recursive: true })
    }
  },

  async readJson (fileName: string): Promise<any> {
    try {
      const filePath = `local/jsons/${fileName}.json`
      await Helper.ensureFolderExists(filePath)
      const fileContent = await fsPromises.readFile(filePath)
      const result = fileContent.toString()
      return JSON.parse(result)
    } catch (error) {
      return ''
    }
  }
}
