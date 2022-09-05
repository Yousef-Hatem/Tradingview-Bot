import { IIdeas } from '../interfaces/ideas';
import { Schema, model } from 'mongoose';

const ideasSchema = new Schema<IIdeas>({
    symbol: {type: String, unique : true, required: true, dropDups: true},
    ideas: [{
        title: String,
        description: String,
        img: String,
        url: String,
        date: Date
    }]
}, {timestamps: true});

export default model<IIdeas>("Ideas", ideasSchema);