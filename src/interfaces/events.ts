import { IDatabase } from './database';
import { Types } from 'mongoose';

export interface IEvent {
    readonly _id?: Types.ObjectId
    title: string;
    description: string;
    date: string;
    source: string;
    url: string;
}

export interface IEvents extends IDatabase {
    coin: string
    events: IEvent[]
}