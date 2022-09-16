import { Types } from 'mongoose';
import { IDatabase } from './database';

export interface IIdea {
    readonly _id?: Types.ObjectId
    title: string
    description: string
    img: string
    date: Date
}

export interface IIdeas extends IDatabase {
    symbol: string
    ideas: IIdea[]
}