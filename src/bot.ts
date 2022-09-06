import Coinmarketcal from './coinmarketcal';
import Databases from './databases';
import { IEvent, IEvents } from './interfaces/events';
import { IIdea, IIdeas } from './interfaces/ideas';
import { IUser } from './interfaces/user';
import Telegram from './telegram';
import Tradingview from './tradingview';
export default class Bot {

    start() {
        const db = new Databases();
        const telegram = new Telegram();

        db.connect();
        telegram.webhook(`${process.env.SERVER_URL}/webhook/${process.env.BOTKEY}`);

        setInterval(() => {
            this.updateIdeas();
            this.updateEvents();
        }, 1000);
    }
    
    getIdeas(symbol: string): Promise<IIdea[]> {
        return new Promise((resolve, reject) => {
            const db = new Databases();

            db.getIdeasBySymbol(symbol)
            .then(doc => {
                if (doc) {
                    resolve(doc.ideas);
                } else {
                    this.addIdeas(symbol)
                    .then(ideas => {
                        resolve(ideas);
                    })
                    .catch(err => {
                        if (err.code === 404) {
                            reject(err);
                        } else {
                            console.log(err);
                            reject(err);
                        }
                    })
                }
            })
            .catch(err => {
                console.log(err);
            })
        })
    }

    addIdeas(symbol: string): Promise<IIdea[]> {
        return new Promise((resolve, reject) => {
            const tradingview = new Tradingview();
            let time: number = new Date().getTime();

            console.log(`${symbol} ideas data is stored...`);

            tradingview.getIdeas(symbol)
            .then(ideas => {
                if (ideas) {
                    const db = new Databases();

                    db.addIdeas({symbol, ideas})
                    .then(() => {
                        time = (new Date().getTime() - time)/1000;

                        console.log(`${symbol} Ideas Data Stored (${time}s)`);
                    })
                    .catch(err => {
                        console.log(err);
                    })

                    resolve(ideas);
                } else {
                    time = (new Date().getTime() - time)/1000;
        
                    console.log(`No data was found for ideas for ${symbol} (${time}s)`);

                    reject({code: 404})
                }
            })
            .catch(err => {
                console.log(err);
            })
        })
    }

    updateIdeas() {
        const db = new Databases();

        db.getAllIdeas()
        .then(data => {
            if (data) {                
                data.forEach((ideas: IIdeas) => {
                    let time: number = new Date().getTime();
                    const updatedAt = <number>ideas.updatedAt?.getTime();

                    if ((new Date().getTime() - updatedAt) > Number(process.env.DELAYED_UPDATING_OF_IDEAS_DATA)*1000) {
                        db.updateIdeas(ideas)
                        .then((data: IIdeas) => {
                            console.log(`${data.symbol} is updated...`);
                            const tradingview = new Tradingview();
                            
                            tradingview.getIdeas(data.symbol)
                            .then(ideas => {
                                if (ideas) {
                                    data.ideas = ideas;
                                    db.updateIdeas(data)
                                    .then((data: IIdeas) => {
                                        time = (new Date().getTime() - time)/1000;
                                        console.log(`${data.symbol} ideas data has been updated (${time}s)`);
                                    })
                                } else {
                                    console.log("Error updating ideas - TradingView get ideas");
                                }
                            })
                            .catch(err => {
                                console.log(err);
                            })
                        })
                        .catch(err => {
                            console.log(err);
                        })
                    }
                })
            }
        })
        .catch(err => {
            console.log(err);
        })
    }

    getEvents(symbol: string): Promise<IEvent[]> {
        return new Promise((resolve, reject) => {
            const db = new Databases();

            db.getEventsByCoin(symbol)
            .then(doc => {
                if (doc) {
                    resolve(doc.events);
                } else {
                    this.addEvents(symbol)
                    .then(events => {
                        resolve(events);
                    })
                    .catch(err => {
                        if (err.code === 404) {
                            reject(err);
                        } else {
                            console.log(err);
                            reject(err);
                        }
                    })
                }
            })
            .catch(err => {
                console.log(err);
            })
        })
    }

    addEvents(coin: string): Promise<IEvent[]> {
        return new Promise((resolve, reject) => {
            const coinmarketcal = new Coinmarketcal();
            let time: number = new Date().getTime();

            console.log(`${coin} events data is stored...`);

            coinmarketcal.getEvents(coin)
            .then(events => {
                if (events.length) {
                    const db = new Databases();

                    db.addEvents({coin, events})
                    .then(() => {
                        time = (new Date().getTime() - time)/1000;

                        console.log(`${coin} events Data Stored (${time}s)`);
                    })
                    .catch(err => {
                        console.log(err);
                    })

                    resolve(events);
                } else {
                    time = (new Date().getTime() - time)/1000;
        
                    console.log(`No data was found for events for ${coin} (${time}s)`);

                    reject({code: 404})
                }
            })
            .catch(err => {
                console.log(err);
            })
        })
    }

    updateEvents() {
        const db = new Databases();

        db.getAllEvents()
        .then(data => {
            if (data) {
                data.forEach((events: IEvents) => {
                    let time: number = new Date().getTime();
                    const updatedAt = <number>events.updatedAt?.getTime();

                    if ((new Date().getTime() - updatedAt) > Number(process.env.DELAYED_UPDATING_OF_EVENTS_DATA)*1000) {
                        db.updateEvents(events)
                        .then((data: IEvents) => {
                            console.log(`${data.coin} is updated...`);
                            const coinmarketcal = new Coinmarketcal();
                            
                            coinmarketcal.getEvents(data.coin)
                            .then(events => {
                                if (events) {
                                    data.events = events;
                                    db.updateEvents(data)
                                    .then((data: IEvents) => {
                                        time = (new Date().getTime() - time)/1000;
                                        console.log(`${data.coin} events data has been updated (${time}s)`);
                                    })
                                } else {
                                    console.log("Error updating events - TradingView get events");
                                }
                            })
                            .catch(err => {
                                console.log(err);
                            })
                        })
                        .catch(err => {
                            console.log(err);
                        })
                    }
                })
            }
        })
        .catch(err => {
            console.log(err);
        })
    }

    verifyUser(telegramUserId: number): Promise<IUser> {
        return new Promise((resolve, reject) => {
            const db = new Databases();

            db.getUserByTelegramUserId(telegramUserId)
            .then(user => {
                if (user) {
                    resolve(user)
                } else {
                    reject()
                }
            })
            .catch(err => {
                console.log(err);
                reject(err);
            })
        })
    }

    addUser(telegramUserId: number, username: string): Promise<IUser> {
        return new Promise((resolve, reject) => {
            const db = new Databases();
            this.verifyUser(telegramUserId)
            .then(() => {
                reject()
            })
            .catch(err => {
                if (err) {
                    reject(err)
                } else {
                    db.addUser(telegramUserId)
                    .then(user => {
                        console.log(`A new user has been added (${username})`);
                        resolve(user);
                    })
                    .catch(err => {
                        console.log(err);
                    })
                }
            })
        })
    }
}