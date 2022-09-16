import { IDatabase } from './database';
export interface IUser extends IDatabase {
    telegramUserId: number
}