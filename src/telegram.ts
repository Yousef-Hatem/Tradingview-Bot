import axios from "axios";
import HandlingErrors from "./handling-errors";
export default class Telegram {
    BotKey: string;
    constructor(BotKey: string) {
        this.BotKey = BotKey;
    }
    
    async request(route: string, body: {} = {}) {
        const response = await axios.post(`https://api.telegram.org/bot${this.BotKey}/${route}`, body, {
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
        const body: any = {chat_id: chatId, photo: photoURL, protect_contentL: process.env.PROTECTCONTENT};

        caption? body.caption = caption : null;
        
        parseMode? body.parse_mode = parseMode : null;
        
        replyToMessageId? body.reply_to_message_id = replyToMessageId : null;
        
        replyMarkup? body.reply_markup = replyMarkup : null;

        const response = await this.request("sendPhoto", body);

        return response;
   }

   webhook(url: string) {
        const handlingErrors = new HandlingErrors();

        this.request(`getWebhookInfo`).then(async response => {
            if (response.data.result.url !== url) {            
                const res = await this.request(`setWebhook?url=${url}`);
                console.log(res.data);
            }
        }).catch(handlingErrors.axios);
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