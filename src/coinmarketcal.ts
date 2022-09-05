import { AxiosResponse } from 'axios';
import axios from 'axios';
import { IEvent } from './interfaces/events';
export default class Coinmarketcal {

    async request(route: string): Promise<AxiosResponse<any, any>> {
        let response: any = null;

        await axios.get(`https://coinmarketcal.com/en/${route}`, {
            headers: {"User-Agent": "PostmanRuntime/7.29.2"}
        }).then(data => {
            response = data;
        }).catch(err => {
           console.log("Error Coinmarketcal: ", err);
        })

        return response;
    }

    async getEvents(coin: string): Promise<IEvent[]> {
        let events: IEvent[] = [];
        let route: string = `?form%5Bdate_range%5D=02%2F09%2F2022+-+01%2F08%2F2024&form%5Bkeyword%5D=${coin}&form%5Bsort_by%5D=revelance&form%5Bsubmit%5D=&form%5Bshow_reset%5D=`;

        await this.request(route).then(req => {
            events = this.dataHandling(req.data)
        })

        return events;
    }

    dataHandling(HTML: string) {
        let events: IEvent[] = [];
        let items = HTML.split('<article class="col-xl-3 col-lg-4 col-md-6 py-3">');
        items.shift();

        items.forEach(item => {
            let event: IEvent = {
                title: item.split('<h5 class="card__title mb-0 ellipsis">')[1].split('</h5>')[0],
                description: item.split('<p class="card__description">')[1].split('</p>')[0].replace(/\s+/g, ' ').trim(),
                date: item.split('<h5 class="card__date mt-0">')[1].split('</h5>')[0].replace(/\s+/g, ' ').trim(),
                source: item.split('target="_blank" rel="noopener"')[1].split('href="')[1].split('">Source</a>')[0],
                url: item.split('<a href="/en/event/')[1].split('"')[0]
            }

            events.push(event);
        })

        return events;
    }
}