import { Types } from 'mongoose';

export interface IDatabase {
    readonly _id?: Types.ObjectId
    readonly createdAt?: Date
    readonly updatedAt?: Date
}