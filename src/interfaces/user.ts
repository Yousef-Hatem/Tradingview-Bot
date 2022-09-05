import { Types } from 'mongoose';

export interface IUser {
    _id?: Types.ObjectId
    telegramUserId: number
    createdAt?: Date
    updatedAt?: Date
}