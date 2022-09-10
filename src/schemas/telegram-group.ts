import { ITelegramGroup } from '../interfaces/telegram-group';
import { Schema, model } from 'mongoose';

const telegramGroupSchema = new Schema<ITelegramGroup>({
    telegramId: {type: Number, unique : true, required: true, dropDups: true},
    title: {type: String, required: true},
    username: {type: String, unique : true, dropDups: true},
    gotFired: {type: Boolean, required: true, default: false}
}, {timestamps: true});

export default model<ITelegramGroup>("Telegram-Group", telegramGroupSchema);