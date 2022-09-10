import { Types } from 'mongoose';

export interface ITelegramGroup {
    _id?: Types.ObjectId
    telegramId: number
    title: string
    gotFired?: boolean
    username?: string
    createdAt?: Date
    updatedAt?: Date
}