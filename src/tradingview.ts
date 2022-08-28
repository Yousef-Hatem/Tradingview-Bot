import fetch from 'node-fetch';
import { Idea } from './interfaces/Ideas';

export default class Tradingview {

    async dataHandler(data: Promise<string>): Promise<Idea[]> {
        let ideas: any[] = [];
        await data.then(async HTML => {
            let items: string[] = HTML.split('tv-feed__item tv-feed-layout__card-item');
            items.shift();
    
            items.forEach(async item => {
                if (ideas.length < 5) {
                    let idea = {
                        title: item.split('tv-widget-idea__title apply-overflow-tooltip js-widget-idea__popup" data-href="')[1].split("</a>")[0].split('">')[1],
                        symbol: item.split('class="tv-widget-idea__symbol apply-overflow-tooltip">')[1].split('</a></div>')[0],
                        username: item.split('<span class="tv-card-user-info__name">')[1].split('</span>')[0],
                        badgeWrap: (item.split('<span class="content-s1XFg_zx">')[1] || '').split('</span>')[0],
                        img: item.split('type="image/webp"><img data-src="')[1].split('" src="')[0],
                        time: item.split(`publishedUrl&#34;:&#34;/chart/`)[1].split('/&#34;')[0]
                    };
            
                    ideas.push(idea);
                }
            });
        });

        for (let i = 0; i < ideas.length; i++) {
            await this.dateHandler(ideas[i].time).then(date => {
                ideas[i].time = date.getTime();
            });
        }        

        return ideas;
    }

    async dateHandler(route: string): Promise<Date> {
        let url = 'https://www.tradingview.com/chart/' + route;
        let date: Date;
        const response: fetch = await fetch(url);
        
        return await response.text().then(html => { 
            date = new Date(html.split('"datePublished": "')[1].split('",')[0]);
            date.setHours(date.getHours() + 7);            
            return date;
        });
    }

    async getIdeas(symbol: string): Promise<Idea[]> {
        let url = 'https://www.tradingview.com/ideas/' + symbol;

        const response: fetch = await fetch(url);
        let ideas: Idea[] = [];
        await this.dataHandler(response.text()).then(data => {
            ideas = data;
        });
        
        
        const responseRecent: fetch = await fetch(url + "?sort=recent");        
        let ideasRecent: Idea[] = [];
        await this.dataHandler(responseRecent.text()).then(data => {            
            ideasRecent = data;
        });
        
        return [...ideas, ...ideasRecent];
    }

}