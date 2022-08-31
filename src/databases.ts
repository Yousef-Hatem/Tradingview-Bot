import TradingviewAPI from "./tradingview";
import fs from 'fs';
import { Idea } from "./interfaces/Ideas";

export default class Databases {

    getIdeas(symbol: string): Promise<{time: number, ideas: Idea[]} | null> {
        return new Promise((resolve) => {
            fs.readFile('data/ideas.json', 'utf8', async (err, symbols) => {
                let data: {time: number, ideas: Idea[]} | null = null;
                
                if (err) {
                    await this.addSymbol(symbol).then(response => {
                        data = response
                    });
                } else {
                    symbols = JSON.parse(symbols);
                    if (symbols[symbol]) {
                        data = symbols[symbol];
                    } else {
                        await this.addSymbol(symbol).then(response => {
                            data = response
                        });
                    }
                }

                resolve(data);
            })
        })
    }

    updatingData() {
        fs.readFile('data/symbols.json', 'utf8', async (err, symbols: any) => {
            if (!err) {    
                symbols = JSON.parse(symbols);
                
                function forLube(num = 0) {
                    const symbol = symbols[num];

                    if (symbol) {
                        let t: number = new Date().getTime();

                        fs.readFile('data/ideas.json', 'utf8', (err, symbols: any) => {
                            if (err) {
                                symbols = {};
                            } else {
                                symbols = JSON.parse(symbols);
                            }

                            if (!symbols[symbol]) {
                                symbols[symbol] = {time: 0};
                            }
                                
                            if (new Date().getTime() - symbols[symbol].time > <any> process.env.DATA_UPDATE_DELAY*1000) {
                                symbols[symbol].time = new Date().getTime() + 180000;

                                fs.writeFile('data/ideas.json', JSON.stringify(symbols), () => {
                                    console.log(`${symbol} is updated`);

                                    forLube(++num);

                                    const tradingview = new TradingviewAPI();

                                    tradingview.getIdeas(symbol).then(ideas => {
                                        let time = new Date().getTime();
    
                                        fs.readFile('data/ideas.json', 'utf8', (err, symbols: any) => {
                                            if (err) {
                                                console.log(err);
                                            }
    
                                            symbols = JSON.parse(symbols);
    
                                            symbols[symbol] = { time, ideas };
    
                                            fs.writeFile('data/ideas.json', JSON.stringify(symbols), () => {
                                                t = (new Date().getTime() - t) / 1000;
                                                console.log(`${symbol} ideas data has been updated (${t}s)`);
                                            })
                                        })
                                    }).catch(err => {
                                        console.log(err);
                                    })
                                })
                            } else {
                                forLube(++num);
                            }
                        })
                    }
                }
                forLube();
            }
        })
    }

    async addSymbol(symbol: string): Promise<{time: number, ideas: Idea[]} | null> {
        const tradingview = new TradingviewAPI();
        let ideas: Idea[] | null = null;
        let time: number = 0;
        let t: number = new Date().getTime();

        console.log(`${symbol} ideas data is stored`);

        await tradingview.getIdeas(symbol).then(data => {
            ideas = data;
            time = new Date().getTime();
        }).catch(err => {
            console.log(err);
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
                    fs.readFile('data/ideas.json', 'utf8', (err, symbols: any) => {
                        err? symbols = {} : symbols = JSON.parse(symbols);

                        symbols[symbol] = {time, ideas};

                        fs.writeFile('data/ideas.json', JSON.stringify(symbols), () => {
                            t = (new Date().getTime() - t)/1000;

                            console.log(`${symbol} Ideas Data Stored (${t}s)`);
                        })                        
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