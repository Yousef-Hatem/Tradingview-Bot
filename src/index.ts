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
    const parseMode: string = "HTML";
    let t = new Date().getTime();

    if (req.body.chat_join_request) {
        console.log(`Request to join the ${req.body.chat_join_request.chat.title} group from ${req.body.chat_join_request.from.username}`);
        return res.send();
    }
    
    if (req.body.callback_query) {
        chateId = req.body.callback_query.message.chat.id;
        message = req.body.callback_query.data;
        messageId = req.body.callback_query.message.message_id;
        from = req.body.callback_query.from.username;
        if (!from) {
            try {
                from = req.body.callback_query.from.first_name;
                from += ' ' + req.body.callback_query.from.last_name;
            } catch (error) {
                console.log(error);
            }
        }
    } else {
        if (req.body.message) {
            chateId = req.body.message.chat.id;
            type = req.body.message.chat.type;
        } else {
            if (req.body.my_chat_member) {
                let username = req.body.my_chat_member.from.first_name + ' ' + req.body.my_chat_member.from.last_name;
                if (req.body.my_chat_member.from.username) {
                    username = req.body.my_chat_member.from.username;
                }
                if (req.body.my_chat_member.chat.type === 'group' || req.body.my_chat_member.chat.type === 'supergroup') {
                    telegram.getChatMembersCount(req.body.my_chat_member.chat.id).then(request => {
                        console.log(`I joined the ${req.body.my_chat_member.chat.title} group and it has ${request.data.result} members`);
                        if (request.data.result >= 100) {
                            db.addUser(req.body.my_chat_member.from.id, username).then(() => {
                                telegram.sendMessage(req.body.my_chat_member.from.id, `<b>Hi ${req.body.my_chat_member.from.first_name} ${req.body.my_chat_member.from.last_name}, you have added me to the <a href='https://web.telegram.org/k/#${req.body.my_chat_member.chat.id}'>${req.body.my_chat_member.chat.title}</a> group and you have obtained permission to use me privately for free \n\nCongratulations 🎉🎊</b>`, parseMode);
                            });
                        }
                    }).catch(error => {
                        if (error.response.status == 403) {
                            console.log(`${username} kicked me out of the ${req.body.my_chat_member.chat.title} group :(`);
                        }
                    })
                    return res.send();
                }
            }

            console.log("Telegram -------------------------------------");
            console.log(req.body);
            return res.send();
        }
        message = req.body.message.text;
        messageId = req.body.message.message_id;
        from = req.body.message.from.username;
        if (!from) {
            try {
                from = req.body.message.from.first_name;
                from += ' ' + req.body.message.from.last_name;
            } catch (error) {
                console.log(error);
            }
        }
        if (req.body.message.from.is_bot === true) {
            return res.send();
        }

        if (type == "private") {
            let status: any;
            await db.verifyUser(chateId).then(st => {
                status = st;
            }).catch(st => {
                status = st;
            });
            if (!status) {
                telegram.sendMessage(chateId, '<b>You do not have access to use In order to obtain the permission, you must add me to a group whose number of members is not less than 100</b>', parseMode, messageId)
                .catch(error => {
                    console.log("Error ---------------------Verify User-----------------------");
                    console.log(error);
                });
                return res.send();
            }
        }
    }

    if (process.env.maintenance === "OK") {
        telegram.sendMessage(chateId, "I'm under maintenance now, try again later", '', messageId);
        console.log(`<=${from}=> tried to order during maintenance`);
        return res.send();
    }

    if (message) {
        message = message.toUpperCase();
        let index: number = 0;

        if (message === "/START") {
            const fullName: string = req.body.message.from.first_name + ' ' + req.body.message.from.last_name;
            const msg = `Hi <b>${fullName}</b>, I am a Comutrade. Let's try typing the name of a symbol and see the ideas of this symbol For example try typing /BTCUSDT or /ETHUSDT or any symbol you want to know ideas`;

            telegram.sendMessage(chateId, msg, parseMode, undefined).then(() => {
                t = (new Date().getTime() - t)/1000;

                console.log(`<=${from}=> has started using the bot (${t}s)`);
            }).catch(handlingErrors.axios);
        } else if (!message.split('/EVENT')[0] || req.body.callback_query && message.split("#")[2] === "EVENT") {            
            
            let coin: string = '';
            
            if (req.body.callback_query) {
                index = Number(message.split("#")[1])
                coin = message.split('#')[0];
            } else {
                coin = message.split('/EVENT')[1].replace(/\s+/g, ' ').trim();
            }

            db.getEvents(coin).then(data => {
                if (data) {
                    const event = data.events[index];
                    let msg = `<b><a href='https://coinmarketcal.com/en/event/${event.url}'>${event.title}</a>\n📅 ${event.date} \n${event.description} \n<a href='${event.source}'>SOURCE</a></b>`;
                    let replyMarkup: any;

                    if (req.body.callback_query) {
                        let i1 = index - 1;
                        let i2 = index + 1;
                        let InlineKeyboardButton: {}[] = [{text: "⬅️", callback_data: `${coin}#${i1}#EVENT`}, {text: "➡️", callback_data: `${coin}#${i2}#EVENT`}];

                        if (index == 0) {
                            InlineKeyboardButton = [{text: "➡️", callback_data: `${coin}#` + ++index + '#EVENT'}];
                        } else if (index == data.events.length -1) {
                            InlineKeyboardButton = [{text: "⬅️", callback_data: `${coin}#` + --index + '#EVENT'}];
                        }

                        replyMarkup = {inline_keyboard: [InlineKeyboardButton]}
                        
                        telegram.editMessage(chateId, messageId, msg, parseMode, replyMarkup).then(() => {
                            t = (new Date().getTime() - t)/1000;

                            console.log(`${coin} event data updated to <=${from}=> (${t}s)`);
                        }).catch(handlingErrors.axios)
                    } else {
                        if (data.events.length > 1) {
                            replyMarkup = {
                                inline_keyboard: [[{text: "➡️", callback_data: `${coin}#1#EVENT`}]]
                            }
                        }
                        telegram.sendMessage(chateId, msg, parseMode, messageId, replyMarkup).then(() => {
                            t = (new Date().getTime() - t)/1000;

                            console.log(`${coin} event data sent to <=${from}=> (${t}s)`);
                        }).catch(handlingErrors.axios);
                    }
                } else {
                    telegram.sendMessage(chateId, "There is no upcoming events for this coin", '', messageId).catch(handlingErrors.axios);
                }
            })

        } else {            
            let symbol: string = message;

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

                    if (!idea) {
                        console.log("Error -------------------index---------------------");
                        console.log(data);
                    }
                    
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
                        let InlineKeyboardButton: {}[] = [{text: "⬅️", callback_data: `${symbol}#${i1}#IDEA`}, {text: "➡️", callback_data: `${symbol}#${i2}#IDEA`}];

                        if (index == 0) {
                            InlineKeyboardButton = [{text: "➡️", callback_data: `${symbol}#` + ++index + '#IDEA'}];
                        } else if (index == data.ideas.length -1) {
                            InlineKeyboardButton = [{text: "⬅️", callback_data: `${symbol}#` + --index + '#IDEA'}];
                        }

                        replyMarkup = {inline_keyboard: [InlineKeyboardButton]}
                        
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
    console.log(`Bot running on port`, process.env.PORT || 5000);
    telegram.webhook(process.env.SERVER_URL+webhookRoute);
    db.updatingData();
});