import { config } from "dotenv";
import express from "express";
import bodyParser from "body-parser";
import TelegramAPI from "./telegram";
import Databases from "./databases";
import HandlingErrors from "./handling-errors";

config();

const handlingErrors = new HandlingErrors();
const db = new Databases();
const telegram = new TelegramAPI(<string> process.env.BOTKEY);
const app = express();
app.use(bodyParser.json());

const webhookRoute: string = `/webhook/${process.env.BOTKEY}`;

app.post(webhookRoute, async (req, res) => {
    let chateId: number;
    let message: string;
    let messageId: number;
    let from: string;
    let type: string = '';

    if (req.body.chat_join_request) {
        console.log(`Request to join the ${req.body.chat_join_request.chat.title} group from ${req.body.chat_join_request.from.username}`);
        return res.send();
    }

    if (req.body.callback_query) {        
        chateId = req.body.callback_query.message.chat.id;
        message = req.body.callback_query.data;
        messageId = req.body.callback_query.message.message_id;
        from = req.body.callback_query.from.username;
    } else {
        if (req.body.message) {
            chateId = req.body.message.chat.id;
            type = req.body.message.chat.type;
        } else {
            console.log("Telegram -------------------------------------");
            console.log(req.body);
            return res.send();
        }
        message = req.body.message.text;
        messageId = req.body.message.message_id;
        from = req.body.message.from.username;
        if (req.body.message.from.is_bot === true) {
            return res.send();
        }
    }

    let t = new Date().getTime();

    if (process.env.maintenance === "OK") {
        telegram.sendMessage(chateId, "I'm under maintenance now, try again later", '', messageId);
        console.log(`<=${from}=> tried to order during maintenance`);
        return res.send();
    }

    if (message) {
        message = message.toUpperCase();
        const parseMode: string = "HTML";

        if (message === "/START") {
            const fullName: string = req.body.message.from.first_name + ' ' + req.body.message.from.last_name;
            const msg = `Hi <b>${fullName}</b>, I am a Tradingview Bot. Let's try typing the name of a symbol and see the ideas of this symbol For example try typing /BTCUSDT or /ETHUSDT or any symbol you want to know ideas`;

            telegram.sendMessage(chateId, msg, parseMode, undefined).then(() => {
                t = (new Date().getTime() - t)/1000;

                console.log(`<=${from}=> has started using the bot (${t}s)`);
            }).catch(handlingErrors.axios);
        } else {
            let symbol: string = message;
            let index: number = 0;

            if (message[0] === '/') {
                symbol = message.split('/')[1];
            } else if (type !== "private" && !req.body.callback_query) {
                return res.send();
            }

            if (req.body.callback_query) {
                symbol = message.split("#")[0];
                index = Number(message.split("#")[1]);
            }

            db.getIdeas(symbol).then(data => {
                if (data) {
                    let replyMarkup: {};
                    let idea = data.ideas[index];

                    console.log();
                    
                    if (`${idea.time}`.length === 10) {
                        idea.time = Number(idea.time+'000');
                    }

                    let date = new Date(idea.time).toISOString().split('.')[0].split('T');

                    if (!idea.badgeWrap) {
                        idea.badgeWrap = "Free";
                    }

                    let caption = `<a href='https://www.tradingview.com/chart/${idea.url}'>${idea.title}</a> \n ${idea.description} \n\n📅 ${date[0]} ${date[1]}`;

                    if (req.body.callback_query) {
                        let i1 = index - 1;
                        let i2 = index + 1;
                        let InlineKeyboardButton: {}[] = [{text: "⬅️", callback_data: `${symbol}#${i1}`}, {text: "➡️", callback_data: `${symbol}#${i2}`}];

                        if (index == 0) {
                            InlineKeyboardButton = [{text: "➡️", callback_data: `${symbol}#` + ++index}];
                        } else if (index == data.ideas.length -1) {
                            InlineKeyboardButton = [{text: "⬅️", callback_data: `${symbol}#` + --index}];
                        }

                        replyMarkup = {
                            inline_keyboard: [InlineKeyboardButton]
                        }
                        
                        const media = {
                            type: 'photo',
                            media: idea.img,
                            caption: caption,
                            parse_mode: parseMode
                        }
                        
                        telegram.editMessageMedia(chateId, messageId, media, replyMarkup).then(() => {
                            t = (new Date().getTime() - t)/1000;

                            console.log(`${symbol} idea data updated to <=${from}=> (${t}s)`);
                        }).catch(handlingErrors.axios)
                    } else {
                        replyMarkup = {
                            inline_keyboard: [[{text: "➡️", callback_data: `${symbol}#1`}]]
                        }

                        telegram.sendPhoto(chateId, idea.img, caption, parseMode, messageId, replyMarkup).then(() => {
                            t = (new Date().getTime() - t)/1000;
        
                            console.log(`${symbol} idea data sent to <=${from}=> (${t}s)`);
                        }).catch(handlingErrors.axios);
                    }

                } else {
                    telegram.sendMessage(chateId, "No ideas for this currency", '', messageId);
                }
            })
        }
    }

    return res.send();
});

app.listen(process.env.PORT || 5000, async () => {
    console.log(`🚀 Bot running on port`, process.env.PORT || 5000);
    telegram.webhook(process.env.SERVER_URL+webhookRoute);
    setInterval(db.updatingData, 1000);
});