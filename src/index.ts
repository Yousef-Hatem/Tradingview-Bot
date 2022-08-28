import { config } from "dotenv";
config();

import Databases from "./databases";
const db = new Databases();

// setInterval(() => {
//     db.updatingData();
// }, 1000);
db.dataRecording();