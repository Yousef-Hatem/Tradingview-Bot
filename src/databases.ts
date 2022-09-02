import TradingviewAPI from "./tradingview";
import fs from 'fs';
import { Idea } from "./interfaces/Ideas";
import Tradingview from "./tradingview";

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

    updatingData() {
        fs.readFile('data/symbols.json', 'utf8', (err, symbols: any) => {
            if (!err) {
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
                                return;
                            }
                        }

                        const time: number = data.time;                        
                        if ((new Date().getTime() - time) > Number(process.env.DATA_UPDATE_DELAY)*1000) {
                            data.time = new Date().getTime() + 120000;
                            fs.writeFile(`data/ideas/${symbol}.json`, JSON.stringify(data), () => {
                                console.log(`${symbol} is updated...`);
                                
                                new Tradingview().getIdeas(symbol).then(ideas => {
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
    
                if (!err) {
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
}