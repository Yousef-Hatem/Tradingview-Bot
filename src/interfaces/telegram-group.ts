import { IDatabase } from "./database"

export interface ITelegramGroup extends IDatabase {
    telegramId: number
    title: string
    gotFired?: boolean
    username?: string
}