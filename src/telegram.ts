import axios from "axios";

export default class Telegram {
    BotKey: string;
    constructor(BotKey: string) {
        this.BotKey = BotKey;
    }

    async request(route: string, body: {} = {}) {        
        const response = await axios.post(`https://api.telegram.org/bot${this.BotKey}/${route}`, body);
        
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
}