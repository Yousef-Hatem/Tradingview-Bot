import TradingviewAPI from "./tradingview";
import fs from 'fs';

export default class Databases {

    getIdeas(verification: boolean = false): Promise<{time: number, ideas: any[]}> {
        return new Promise((resolve, reject) => {
            fs.readFile('data/ideas.txt', 'utf8', (err, data) => {
                if (err) {                
                    if (verification) {
                        resolve({time: 0, ideas: []});
                    } else {
                        reject(err)
                        console.log("ERR:2100 - " + err);
                    }
                } else {
                    resolve(JSON.parse(data));
                }
            });
        })
    }

    dataRecording() {
        const tradingview = new TradingviewAPI();
        let fileData: any;
        this.getIdeas(true).then(data => {
            fileData = data;
            if (data.ideas[0]) {
                console.log("Idea data is updated...");
            } else {
                console.log("The ideas are stored...");
            }
        })

        let time: number = new Date().getTime();
        tradingview.getIdeas('ethusd').then(ideas => {
            ideas = {time: new Date().getTime(), ideas};
            fs.writeFile('data/ideas.txt', JSON.stringify(ideas), (err) => {
                time = (new Date().getTime() - time)/1000;
                if (err) {
                    console.log("ERR:2000 - " + err);
                } else {
                    if (fileData.ideas[0]) {
                        console.log(`Ideas data updated - time ${time}s`);
                    } else {
                        console.log(`Thoughts data is stored - time ${time}s`);
                    }
                }
            });
        })
    }

    updatingData() {
        this.getIdeas(true).then(data => {
            const time: number = data.time;
            if (new Date().getTime() - time > 60000 && time !== 0) {
                data.time = 0;
                fs.writeFile('data/ideas.txt', JSON.stringify(data), () => {
                    this.dataRecording();
                });
            } else if (!data.ideas.length) {
                data.ideas = [0];
                fs.writeFile('data/ideas.txt', JSON.stringify(data), () => {
                    this.dataRecording();
                });
            }
        });
    }
}