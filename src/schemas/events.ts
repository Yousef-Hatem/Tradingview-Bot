import { IEvents } from '../interfaces/events';
import { Schema, model } from 'mongoose';

const eventsSchema = new Schema<IEvents>({
    coin: {type: String, unique : true, required: true, dropDups: true},
    events: [{
        title: String,
        description: String,
        source: String,
        url: String,
        date: String
    }]
}, {timestamps: true});

export default model<IEvents>("Events", eventsSchema);