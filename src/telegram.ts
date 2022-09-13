import axios from "axios";
export default class Telegram {
    
    async request(route: string, body: {} = {}) {
        const response = await axios.post(`https://api.telegram.org/bot${process.env.BOTKEY}/${route}`, body, {
            headers: {'Content-Type': 'application/json'}
        });
        
        return response;
    }

    async sendMessage(chatId: number, message: string, parseMode: string, replyToMessageId?: number, replyMarkup?: {}) {
        const body: any = {chat_id: chatId, text: message};

        parseMode? body.parse_mode = parseMode : null;

        replyToMessageId? body.reply_to_message_id = replyToMessageId : null;

        replyMarkup? body.reply_markup = replyMarkup : null;

        const response = await this.request("sendMessage", body);

        return response;
    }

   async sendPhoto(chatId: number, photoURL: string, caption?: string, parseMode?: string, replyToMessageId?: number, replyMarkup?: {}) {
        const body: any = {chat_id: chatId, photo: photoURL};

        if (process.env.PROTECTCONTENT === "Yes") {
            body.protect_contentL = true;
        }

        caption? body.caption = caption : null;
        
        parseMode? body.parse_mode = parseMode : null;
        
        replyToMessageId? body.reply_to_message_id = replyToMessageId : null;
        
        replyMarkup? body.reply_markup = replyMarkup : null;

        const response = await this.request("sendPhoto", body);

        return response;
   }

   webhook(): Promise<any> {
        return new Promise((resolve, reject) => {
            const url = `${process.env.SERVER_URL}/webhook/${process.env.BOTKEY}`;
            this.request(`getWebhookInfo`).then(async response => {
                if (response.data.result.url !== url) {
                    this.request(`setWebhook?url=${url}`)
                    .then(response => {
                        resolve(response.data)
                    }).catch(err => reject(err))
                } else {
                    resolve(response.data)
                }
            }).catch(err => reject(err))
        })
   }

   async editMessage(chateId: number, messageId: number, message: string, parseMode?: string,  replyMarkup?: {}) {
        const body: any = {chat_id: chateId, message_id: messageId, text: message};

        replyMarkup? body.reply_markup = replyMarkup : null;
        parseMode? body.parse_mode = parseMode : null;

        const response = await this.request("editMessageText", body);

        return response;
    }

    async editMessageMedia(chateId: number, messageId: number, media: {}, replyMarkup?: {}) {
            const body: any = {chat_id: chateId, message_id: messageId, media};

            replyMarkup? body.reply_markup = replyMarkup : null;
        
            const response = await this.request("editMessageMedia", body);

            return response;
    }

    async getChatMembersCount(chateId: number) {
        const response = await this.request("getChatMembersCount", {chat_id: chateId});

        return response;
    }
}