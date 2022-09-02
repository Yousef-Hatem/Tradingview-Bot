import TradingviewAPI from "./tradingview";
import fs from 'fs';
import { Idea } from "./interfaces/Idea";
import { Event } from "./interfaces/event";
import Coinmarketcal from "./coinmarketcal";

export default class Databases {

    getIdeas(symbol: string): Promise<{time: number, ideas: Idea[]} | null> {
        return new Promise((resolve) => {
            fs.readFile(`data/ideas/${symbol}.json`, 'utf8', async (err, res) => {
                let data: {time: number, ideas: Idea[]} | null = null;
                
                if (err) {
                    await this.addSymbol(symbol).then(response => {
                        data = response
                    });
                } else {
                    if (res) {
                        data = JSON.parse(res);
                        if (!data?.ideas) {
                            await this.addSymbol(symbol).then(response => {
                                data = response
                            });
                        }
                        if (!data?.ideas.length) {
                            await this.addSymbol(symbol).then(response => {
                                data = response
                            });
                        }
                    } else {
                        console.log("Error getIdeas ------------>>>", res);
                        this.getIdeas(symbol).then(d => {
                            data = d;
                        });
                    }
                }

                resolve(data);
            })
        })
    }

    async addSymbol(symbol: string): Promise<{time: number, ideas: Idea[]} | null> {
        const tradingview = new TradingviewAPI();
        let ideas: Idea[] | null = null;
        let time: number = 0;
        let t: number = new Date().getTime();

        console.log(`${symbol} ideas data is stored...`);

        await tradingview.getIdeas(symbol).then(data => {
            ideas = data;
            time = new Date().getTime();
        });

        if (ideas) {
            fs.readFile('data/symbols.json', 'utf8', (err, data) => {
                let symbols: string[] = [symbol];
    
                if (!err && data) {
                    if (JSON.parse(data).indexOf(symbol) === -1) {
                        symbols.push(...JSON.parse(data));
                    } else {
                        symbols = JSON.parse(data);
                    }
                }
    
                fs.writeFile('data/symbols.json', JSON.stringify(symbols), () => {
                    fs.writeFile(`data/ideas/${symbol}.json`, JSON.stringify({time, ideas}), () => {
                        t = (new Date().getTime() - t)/1000;

                        console.log(`${symbol} Ideas Data Stored (${t}s)`);
                    })                        
                })
            })

            return {time, ideas};
        } else {
            t = (new Date().getTime() - t)/1000;

            console.log(`No data was found for ideas for ${symbol} (${t}s)`);
            
            return null;
        }
    }

    updatingIdeas() {
        fs.readFile('data/symbols.json', 'utf8', (err, symbols: any) => {
            if (!err && symbols) {
                symbols = JSON.parse(symbols);
                
                symbols.forEach((symbol: string) => {
                    let t: number = new Date().getTime();
                    fs.readFile(`data/ideas/${symbol}.json`, 'utf8', (err, data: any) => {
                        if (err) {
                            data = {time: 0, ideas: []};
                        } else {
                            if (data) {
                                data = JSON.parse(data);
                            } else {
                                console.log("-------------------------- Error Return updatingIdeas --------------------------");
                                return;
                            }
                        }

                        const time: number = data.time;                        
                        if ((new Date().getTime() - time) > Number(process.env.DELAYED_UPDATING_OF_IDEAS_DATA)*1000) {
                            data.time = new Date().getTime() + 180000;
                            fs.writeFile(`data/ideas/${symbol}.json`, JSON.stringify(data), () => {
                                console.log(`${symbol} is updated...`);
                                const tradingview = new TradingviewAPI();
                                
                                tradingview.getIdeas(symbol).then(ideas => {
                                    fs.writeFile(`data/ideas/${symbol}.json`, JSON.stringify({time: new Date().getTime(), ideas}), () => {
                                        t = (new Date().getTime() - t)/1000;
                                        console.log(`${symbol} ideas data has been updated (${t}s)`);
                                    })
                                })
                            })
                        }
                    })
                })
            }
        })
    }

    getEvents(coin: string): Promise<{time: number, events: Event[]} | null> {
        return new Promise((resolve) => {
            fs.readFile(`data/events/${coin}.json`, 'utf8', async (err, res) => {
                let data: {time: number, events: Event[]} | null = null;
                
                if (err) {
                    await this.addCoin(coin).then(response => {
                        data = response
                    });
                } else {
                    if (res) {
                        data = JSON.parse(res);
                        if (!data?.events.length) {
                            await this.addCoin(coin).then(response => {
                                data = response
                            });
                        }
                    } else {
                        console.log("Error getEvents ------------>>>", res);
                    }
                }

                resolve(data);
            })
        })
    }

    async addCoin(coin: string): Promise<{time: number, events: Event[]} | null> {
        const coinmarketcal = new Coinmarketcal();
        let events: Event[] = [];
        let time: number = 0;
        let t: number = new Date().getTime();

        console.log(`${coin} events data is stored...`);

        await coinmarketcal.getEvents(coin).then(data => {
            events = data;
            time = new Date().getTime();
        });

        if (events.length) {
            fs.readFile('data/coins.json', 'utf8', (err, data) => {
                let coins: string[] = [coin];
    
                if (!err && data) {
                    if (JSON.parse(data).indexOf(coin) === -1) {
                        coins.push(...JSON.parse(data));
                    } else {
                        coins = JSON.parse(data);
                    }
                }
    
                fs.writeFile('data/coins.json', JSON.stringify(coins), () => {
                    fs.writeFile(`data/events/${coin}.json`, JSON.stringify({time, events}), () => {
                        t = (new Date().getTime() - t)/1000;

                        console.log(`${coin} Events Data Stored (${t}s)`);
                    })                        
                })
            })

            return {time, events};
        } else {
            t = (new Date().getTime() - t)/1000;

            console.log(`No data was found for events for ${coin} (${t}s)`);
            
            return null;
        }
    }

    updatingEvents() {
        fs.readFile('data/coins.json', 'utf8', (err, coins: any) => {
            if (!err && coins) {
                coins = JSON.parse(coins);
                
                coins.forEach((coin: string) => {
                    let t: number = new Date().getTime();
                    fs.readFile(`data/events/${coin}.json`, 'utf8', (err, data: any) => {
                        if (err) {
                            data = {time: 0, events: []};
                        } else {
                            if (data) {
                                data = JSON.parse(data);
                            } else {
                                console.log("-------------------------- Error Return updatingEvents --------------------------");
                                return;
                            }
                        }

                        const time: number = data.time;
                        if ((new Date().getTime() - time) > Number(process.env.DELAYED_UPDATING_OF_EVENTS_DATA)*1000) {
                            data.time = new Date().getTime() + 180000;
                            fs.writeFile(`data/events/${coin}.json`, JSON.stringify(data), () => {
                                console.log(`${coin} is updated...`);
                                const coinmarketcal = new Coinmarketcal();

                                coinmarketcal.getEvents(coin).then(events => {
                                    fs.writeFile(`data/events/${coin}.json`, JSON.stringify({time: new Date().getTime(), events}), () => {
                                        t = (new Date().getTime() - t)/1000;
                                        console.log(`${coin} events data has been updated (${t}s)`);
                                    })
                                })
                            })
                        }
                    })
                })
            }
        })
    }

    updatingData() {
        setInterval(() => {
            this.updatingIdeas();
            this.updatingEvents();
        }, 1000);
    }
}