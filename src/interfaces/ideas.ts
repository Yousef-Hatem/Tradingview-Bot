import { Types } from 'mongoose';

export interface IIdea {
    _id?: Types.ObjectId
    title: string
    description: string
    img: string
    url: string
    date: Date
}

export interface IIdeas {
    _id?: Types.ObjectId
    symbol: string
    ideas: IIdea[]
    createdAt?: Date
    updatedAt?: Date
}