import axios from "axios";
import HandlingErrors from "./handling-errors";
import { Idea } from './interfaces/Ideas';

export default class Tradingview {

    async dataHandler(HTML: string): Promise<Idea[]> {
        let ideas: Idea[] = [];

        let items: string[] = HTML.split('tv-feed__item tv-feed-layout__card-item');

        items.shift();

        items.forEach(async item => {
            if (ideas.length < 5) {
                let idea: Idea = {
                    title: item.split('tv-widget-idea__title apply-overflow-tooltip js-widget-idea__popup" data-href="')[1].split("</a>")[0].split('">')[1],
                    description: item.split('tv-widget-idea__description-row tv-widget-idea__description-row--clamped js-widget-idea__popup"')[1].split('/">')[1].split('</p>')[0].replace(/\s+/g, ' ').trim(),
                    symbol: item.split('class="tv-widget-idea__symbol')[1].split('">')[1].split('</a></div>')[0],
                    username: item.split('<span class="tv-card-user-info__name">')[1].split('</span>')[0],
                    badgeWrap: (item.split('<span class="content-s1XFg_zx">')[1] || '').split('</span>')[0],
                    img: item.split('type="image/webp"><img data-src="')[1].split('" src="')[0],
                    url: item.split(`publishedUrl&#34;:&#34;/chart/`)[1].split('/&#34;')[0],
                    time: Number(item.split(`" data-timestamp="`)[1].split('.0"')[0]),
                };

                let lengthDescription = 180;

                if (idea.description.length > lengthDescription) {
                    idea.description = idea.description.slice(0, lengthDescription - idea.description.length) + '...';
                }
        
                ideas.push(idea);
            }
        });      

        return ideas;
    }

    async getIdeas(symbol: string): Promise<Idea[] | null> {
        const handlingErrors = new HandlingErrors();

        let url = 'https://www.tradingview.com/ideas/' + symbol;

        let ideas: Idea[] = [];

        await axios.get(url).then(async req => {
            await this.dataHandler(req.data).then(data => {
                ideas = data;
            });
        }).catch(handlingErrors.axios);

        if (!ideas.length) {
            return null;
        }
        
        let ideasRecent: Idea[] = [];

        await axios.get(url + "?sort=recent").then(async req => {
            await this.dataHandler(req.data).then(data => {            
                ideasRecent = data;
            });
        }).catch(handlingErrors.axios);
        
        return [...ideasRecent, ...ideas];
    }
}