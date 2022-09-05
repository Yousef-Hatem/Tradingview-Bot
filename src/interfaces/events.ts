import { Types } from 'mongoose';

export interface IEvent {
    _id?: Types.ObjectId
    title: string;
    description: string;
    date: string;
    source: string;
    url: string;
}

export interface IEvents {
    _id?: Types.ObjectId
    coin: string
    events: IEvent[]
    createdAt?: Date
    updatedAt?: Date
}