import { IUser } from '../interfaces/user';
import { Schema, model } from 'mongoose';

const userSchema = new Schema<IUser>({
    telegramUserId: {type: Number, unique : true, required: true, dropDups: true}
}, {timestamps: true});

export default model<IUser>("User", userSchema);