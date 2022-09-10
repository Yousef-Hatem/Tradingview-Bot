import { ITelegramGroup } from './interfaces/telegram-group';
import mongoose from "mongoose"
import { IUser } from './interfaces/user';
import { IIdeas } from "./interfaces/ideas";
import { IEvents } from "./interfaces/events";
import Ideas from "./schemas/ideas";
import Events from "./schemas/events";
import User from "./schemas/user";
import TelegramGroup from './schemas/telegram-group';

export default class Databases {

    connect() {
        mongoose.connect(<string> process.env.MONGODB_URL)
        .then(() => {
            console.log("Database connected successfully.");
        })
        .catch((err) => {
            console.log("Error in connecting to database", err);
        })
    }

    addIdeas(ideas: IIdeas): Promise<IIdeas> {
        return new Promise((resolve, reject) => {            
            let newIdeas = new Ideas(ideas);

            newIdeas.save()
            .then(doc => {
                resolve(doc);
            })
            .catch(err => {
                reject(err);
                console.log("Problem is saving to database", err);
            }); 
        });
    }

    getAllIdeas(): Promise<IIdeas[]> {
        return new Promise((resolve, reject) => {
            Ideas.find({})
            .then(doc => {
                resolve(doc);
            })
            .catch(err => {
                reject(err);
            })
        })
    }

    getIdeasBySymbol(symbol: string): Promise<IIdeas> {
        return new Promise((resolve, reject) => {
            const query = {symbol};
            Ideas.find(query)
            .then(doc => {
                resolve(doc[0]);
            })
            .catch(err => {
                reject(err);
            });
        });
    }

    updateIdeas(ideas: IIdeas): Promise<IIdeas> {
        return new Promise((resolve, reject) => {
            Ideas.findByIdAndUpdate(ideas["_id"], ideas)
            .then(doc => {
                if (doc) {
                    resolve(doc)
                } else {
                    reject()
                }
            })
            .catch(err => {
                reject(err);
            });
        });
    }

    addEvents(events: IEvents): Promise<IEvents> {
        return new Promise((resolve, reject) => {            
            let newEvents = new Events(events);

            newEvents.save()
            .then(doc => {
                resolve(doc);
            })
            .catch(err => {
                reject(err);
                console.log("Problem is saving to database", err);
            }); 
        });
    }

    getAllEvents(): Promise<IEvents[]> {
        return new Promise((resolve, reject) => {
            Events.find({})
            .then(doc => {
                resolve(doc);
            })
            .catch(err => {
                reject(err);
            })
        })
    }

    getEventsByCoin(coin: string): Promise<IEvents> {
        return new Promise((resolve, reject) => {
            const query = {coin};
            Events.find(query)
            .then(doc => {
                resolve(doc[0]);
            })
            .catch(err => {
                reject(err);
            });
        });
    }

    updateEvents(events: IEvents): Promise<IEvents> {
        return new Promise((resolve, reject) => {
            Events.findByIdAndUpdate(events["_id"], events)
            .then(doc => {
                if (doc) {
                    resolve(doc)
                } else {
                    reject()
                }
            })
            .catch(err => {
                reject(err);
            });
        });
    }

    addUser(telegramUserId: number): Promise<IUser> {
        return new Promise((resolve, reject) => {            
            let newUser = new User({telegramUserId});

            newUser.save()
            .then(doc => {
                resolve(doc);
            })
            .catch(err => {
                reject(err);
                console.log("Problem is saving to database", err);
            }); 
        });
    }

    getUserByTelegramUserId(telegramUserId: number): Promise<IUser> {
        return new Promise((resolve, reject) => {
            const query = {telegramUserId};
            User.find(query)
            .then(doc => {
                resolve(doc[0])
            })
            .catch(err => {
                reject(err)
            });
        });
    }

    addTelegramGroup(telegramGroups: ITelegramGroup): Promise<ITelegramGroup> {
        return new Promise((resolve, reject) => {            
            let newTelegramGroups = new TelegramGroup(telegramGroups);

            newTelegramGroups.save()
            .then(doc => {
                resolve(doc)
            })
            .catch(err => {
                reject(err);
                console.log("Problem is saving to database", err)
            }); 
        });
    }

    getTelegramGroups(): Promise<ITelegramGroup[]> {
        return new Promise((resolve, reject) => {
            TelegramGroup.find({})
            .then(doc => {
                resolve(doc)
            })
            .catch(err => {
                reject(err)
            })
        })
    }

    getTelegramGroupByTelegramId(telegramId: number): Promise<ITelegramGroup> {
        return new Promise((resolve, reject) => {
            const query = {telegramId};
            TelegramGroup.find(query)
            .then(doc => {
                resolve(doc[0])
            })
            .catch(err => {
                reject(err)
            })
        })
    }

    updateTelegramGroup(telegramGroup: ITelegramGroup): Promise<ITelegramGroup> {
        return new Promise((resolve, reject) => {
            TelegramGroup.findByIdAndUpdate(telegramGroup["_id"], telegramGroup)
            .then(doc => {
                if (doc) {
                    resolve(doc)
                } else {
                    reject()
                }
            })
            .catch(err => {
                reject(err);
            })
        })
    }
}