import { config } from "dotenv";
config();
// import express from "express";
// import bodyParser from "body-parser";
// import axios from "axios";
import TelegramAPI from "./telegram";
const telegram = new TelegramAPI(<string> process.env.BOTKEY);

// telegram.request('sendMessage', body);


// const URL: string = `/webhook/${process.env.BOTKEY}`;
// const WEBHOOK_URL: string = process.env.SERVER_URL+URL;

// const app = express();
// app.use(bodyParser.json());

// const init = async () => {
//     await axios.get(`${TELEGRAM_API}/getWebhookInfo`).then(async (data: any) => {
//         if (data.result.url !== WEBHOOK_URL) {
//             const res = await axios.get(`${TELEGRAM_API}/setWebhook?url=${WEBHOOK_URL}`);
//             console.log(res.data);
//         }
//     });
// };

// app.post(URL, async (req, res) => {
//     console.log(req.body);

//     const chateId = req.body.message.chat.id;
//     const text = req.body.message.text;

//     await axios.get(`${TELEGRAM_API}/sendMessage`, {
//         params: {
//             chat_id: chateId,
//             text: text
//         }
//     });

//     return res.send();
// });

// app.listen(process.env.PORT || 5000, async () => {
//     console.log(`🚀 app running on port`, process.env.PORT || 5000);
//     await init();
// });