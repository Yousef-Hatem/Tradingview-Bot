import { config } from "dotenv";
import express from "express";
import bodyParser from "body-parser";
import TelegramAPI from "./telegram";
import HandlingErrors from "./handling-errors";
import Bot from "./bot";

config();

const handlingErrors = new HandlingErrors();
const bot = new Bot();
const telegram = new TelegramAPI();
const app = express();
app.use(bodyParser.json());

app.post(`/webhook/${process.env.BOTKEY}`, async (req, res) => {
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
                const chateId = req.body.my_chat_member.chat.id;
                const userId = req.body.my_chat_member.from.id;
                const oldStatus = req.body.my_chat_member.old_chat_member.status;
                const newStatus = req.body.my_chat_member.new_chat_member.status;
                const title = req.body.my_chat_member.chat.title;
                let username = req.body.my_chat_member.from.first_name + ' ' + req.body.my_chat_member.from.last_name;
                if (req.body.my_chat_member.from.username) {
                    username = req.body.my_chat_member.from.username;
                }

                switch (newStatus) {
                    case 'member':
                        if (oldStatus === "left") {
                            telegram.sendMessage(userId, `<b>You added me to the ${title} group, and in case I don't work in the group, all you have to do is make me administrator</b>`, parseMode);

                            telegram.getChatMembersCount(chateId).then(request => {
                                console.log(`I joined the ${title} group and it has ${request.data.result} members :)`);
        
                                if (request.data.result >= 100) {
                                    bot.addUser(userId, username).then(() => {
                                        telegram.sendMessage(userId, `<b>Congratulations 🎉🎊 \nYou have added the bot to the ${title}, you can now use the bot in private</b>`, parseMode);
                                    });
                                }
                            })
                        } else if (oldStatus === "administrator") {
                            const message = "<b>You removed me from administrators I may not be able to reply to messages so if I don't have permission to reply you can make me administrator to solve the problem</b>";
                            
                            telegram.sendMessage(chateId, message, parseMode).then(() => {
                                console.log(`I have been removed from administrators by Aljadida ${title} group :(`);
                            });
                        }
                        break;
                    case 'administrator':
                        if (oldStatus !== "administrator") {
                            const message = "<b>I have been activated in the group. Congratulations! 🎉🎊</b>";
                            
                            telegram.sendMessage(chateId, message, parseMode).then(() => {
                                console.log(`I became the administrator of the ${title} group :)`);
                            });
                        }
                        break;
                    
                    default:
                        break;
                }

                return res.send();
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

            await telegram.sendMessage(chateId, msg, parseMode, undefined).then(() => {
                t = (new Date().getTime() - t)/1000;

                console.log(`<=${from}=> has started using the bot (${t}s)`);
            }).catch(handlingErrors.axios);
        }

        if (type == "private") {
            let status: any;
            await bot.verifyUser(chateId).then(st => {
                status = st;
            }).catch(st => {
                status = st;
            });
            if (!status) {
                telegram.sendMessage(chateId, '<b>To be able to use the bot privately, you must add the bot in a group with at least 100 members</b>', parseMode, messageId)
                .then(() => {
                    t = (new Date().getTime() - t)/1000;
                    console.log(`The user <=${from}=> was told that he needs to add me to a group in order to use my services (${t}s)`);
                })
                .catch(error => {
                    console.log("Error ---------------------Verify User-----------------------");
                    console.log(error);
                });
                return res.send();
            }
        }

        if (message === "/START") {
            return res.send();
        } else if (!message.split('/EVENT')[0] || req.body.callback_query && message.split("#")[2] === "EVENT") {
            let coin: string = '';
            
            if (req.body.callback_query) {
                index = Number(message.split("#")[1])
                coin = message.split('#')[0];
            } else {
                coin = message.split('/EVENT')[1].replace(/\s+/g, ' ').trim();
            }

            bot.getEvents(coin)
            .then(events => {
                const event = events[index];
                let msg = `<b><a href='https://coinmarketcal.com/en/event/${event.url}'>${event.title}</a>\n📅 ${event.date} \n${event.description} \n<a href='${event.source}'>SOURCE</a></b>`;
                let replyMarkup: any;

                if (req.body.callback_query) {
                    let i1 = index - 1;
                    let i2 = index + 1;
                    let InlineKeyboardButton: {}[] = [{text: "⬅️", callback_data: `${coin}#${i1}#EVENT`}, {text: "➡️", callback_data: `${coin}#${i2}#EVENT`}];

                    if (index == 0) {
                        InlineKeyboardButton = [{text: "➡️", callback_data: `${coin}#` + ++index + '#EVENT'}];
                    } else if (index == events.length -1) {
                        InlineKeyboardButton = [{text: "⬅️", callback_data: `${coin}#` + --index + '#EVENT'}];
                    }

                    replyMarkup = {inline_keyboard: [InlineKeyboardButton]}
                    
                    telegram.editMessage(chateId, messageId, msg, parseMode, replyMarkup).then(() => {
                        t = (new Date().getTime() - t)/1000;

                        console.log(`${coin} event data updated to <=${from}=> (${t}s)`);
                    }).catch(handlingErrors.axios)
                } else {
                    if (events.length > 1) {
                        replyMarkup = {
                            inline_keyboard: [[{text: "➡️", callback_data: `${coin}#1#EVENT`}]]
                        }
                    }
                    telegram.sendMessage(chateId, msg, parseMode, messageId, replyMarkup).then(() => {
                        t = (new Date().getTime() - t)/1000;

                        console.log(`${coin} event data sent to <=${from}=> (${t}s)`);
                    }).catch(handlingErrors.axios);
                }
            })
            .catch(err => {
                if (err.code === 404) {
                    telegram.sendMessage(chateId, "There is no upcoming events for this coin", '', messageId).catch(handlingErrors.axios);
                } else {
                    console.log(err);
                }
            })

        } else {            
            let symbol: string = message;

            if (message[0] === '/') {
                symbol = message.split('/')[1];
            } else if (type !== "private" && !req.body.callback_query) {
                return res.send();
            }

            if (type === 'group' || type === 'supergroup') {
                let result: number = 0;
                await telegram.getChatMembersCount(chateId).then(request => {
                    result = request.data.result;
                    if (result < 100) {
                        telegram.sendMessage(chateId, "In order to activate the bot in the group, the number of members in the group must not be less than 100", "HTML", messageId);
                    }
                });
                
                if (result < 100) {
                    return res.send();
                }
            }

            if (req.body.callback_query) {
                symbol = message.split("#")[0];
                index = Number(message.split("#")[1]);
            }

            bot.getIdeas(symbol)
            .then(ideas => {
                let replyMarkup: {};
                let idea = ideas[index];

                if (!idea) {
                    console.log("Error -------------------index---------------------");
                    console.log(ideas);
                }

                let date = idea.date.toISOString().split('.')[0].split('T');

                let caption = `<a href='https://www.tradingview.com/chart/${idea.url}'>${idea.title}</a> \n ${idea.description} \n\n📅 ${date[0]} ${date[1]}`;

                if (req.body.callback_query) {
                    let i1 = index - 1;
                    let i2 = index + 1;
                    let InlineKeyboardButton: {}[] = [{text: "⬅️", callback_data: `${symbol}#${i1}#IDEA`}, {text: "➡️", callback_data: `${symbol}#${i2}#IDEA`}];

                    if (index == 0) {
                        InlineKeyboardButton = [{text: "➡️", callback_data: `${symbol}#` + ++index + '#IDEA'}];
                    } else if (index == ideas.length -1) {
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
            })
            .catch(err => {
                if (err.code === 404) {
                    telegram.sendMessage(chateId, "No ideas for this currency", '', messageId);
                } else {
                    console.log(err);
                }
            })
        }
    }

    return res.send();
});

app.listen(process.env.PORT || 5000, async () => {
    console.log(`Bot running on port`, process.env.PORT || 5000);
    bot.start();
});
