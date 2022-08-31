import { config } from "dotenv";
import express from "express";
import bodyParser from "body-parser";
import TelegramAPI from "./telegram";
import Databases from "./databases";

config();

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

    if (req.body.callback_query) {        
        chateId = req.body.callback_query.message.chat.id;
        message = req.body.callback_query.data;
        messageId = req.body.callback_query.message.message_id;
        from = req.body.callback_query.message.chat.username;
    } else {
        chateId = req.body.message.chat.id;
        message = req.body.message.text;
        messageId = req.body.message.message_id;
        from = req.body.message.from.username;
    }

    let t = new Date().getTime();

    if (message) {
        message = message.toUpperCase();
        const parseMode: string = "HTML";

        if (message === "/START") {
            const fullName: string = req.body.message.from.first_name + ' ' + req.body.message.from.last_name;
            const msg = `Hi <b>${fullName}</b>, I am a Tradingview Bot. Let's try typing the name of a symbol and see the ideas of this symbol For example try typing /BTCUSDT or /ETHUSDT or any symbol you want to know ideas`;
            const replyMarkup = {
                keyboard: [[
                    {text: "BTCUSDT"},
                    {text: "ETHUSDT"}
                ]],
                resize_keyboard: true,
                one_time_keyboard: true,
                input_field_placeholder: 'Type the symbol you want'
            }
            telegram.sendMessage(chateId, msg, parseMode, undefined, replyMarkup).then(() => {
                t = (new Date().getTime() - t)/1000;

                console.log(`${from} has started using the bot (${t}s)`);
            });
        } else {
            let symbol: string = message;
            let index: number = 0;

            if (message[0] === '/') {
                symbol = message.split('/')[1];
            }

            if (req.body.callback_query) {
                symbol = message.split("#")[0];
                index = Number(message.split("#")[1]);
            }

            db.getIdeas(symbol).then(data => {
                if (data) {
                    let replyMarkup: {};
                    let idea = data.ideas[index];

                    let date = new Date(idea.time).toISOString().split('.')[0].split('T');

                    let caption = `<a href="https://www.tradingview.com/chart/${idea.url}">${idea.title}</a>\n  |   ╰${idea.symbol} \n<b>👤 Analyst: ${idea.username}</b>\n  |   ╰${idea.badgeWrap}\n<i>📅 ${date[0]} ${date[1]}</i>`;

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

                            console.log(`${idea.symbol} idea data updated to ${from} (${t}s)`);
                        }).catch(err => {
                            console.log(err);
                        })
                    } else {
                        replyMarkup = {
                            inline_keyboard: [[{text: "➡️", callback_data: `${symbol}#1`}]]
                        }

                        telegram.sendPhoto(chateId, idea.img, caption, parseMode, messageId, replyMarkup).then(() => {
                            t = (new Date().getTime() - t)/1000;
        
                            console.log(`${idea.symbol} idea data sent to ${from} (${t}s)`);
                        }).catch(err => {
                            console.log(err);
                        });
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