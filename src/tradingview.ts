import axios, { AxiosResponse } from "axios";
import { Idea } from './interfaces/Idea';

export default class Tradingview {

    async request(route: string): Promise<AxiosResponse<any, any>> {
        let response: any = null;

        await axios.get(`https://www.tradingview.com/ideas/${route}`).then(data => {
            response = data;
        }).catch(async err => {
            if (err.message != "Request failed with status code 404") {
                await this.sleep(3000);
                response = await this.request(route);
            } 
        })

        return response;
    }

    dataHandling(HTML: string): Idea[] {
        let ideas: Idea[] = [];
        let items: string[] = HTML.split('tv-feed__item tv-feed-layout__card-item');
        items.shift();

        items.forEach(item => {
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
        })

        return ideas;
    }

    async getIdeas(symbol: string): Promise<Idea[] | null> {
        let error = false;
        let ideasRecent: Idea[] = [];
        let ideas: Idea[] = [];

        await this.request(symbol + "?sort=recent").then(async req => {
            if (req) {
                ideasRecent = this.dataHandling(req.data);
            }
        });

        if (!ideasRecent.length) {
            return null;
        }

        await this.request(symbol).then(async req => {
            ideas = this.dataHandling(req.data);
        });

        if (error) {
            console.log(`${symbol} update failed, I will try to update it again`);
            await this.sleep(2000);
            let data: any;
            let time = new Date().getTime();
            await this.getIdeas(symbol).then(req => {
                time = (new Date().getTime() - time)/1000;
                data = req;
            });
            
            return data;
        }
        
        return [...ideasRecent, ...ideas];
    }

    sleep (ms: number) {
        return new Promise((resolve) => {
          setTimeout(resolve, ms);
        });
    }
}