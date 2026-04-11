import { db } from "./src/backend/database.js";
db.prepare("DELETE FROM logs WHERE event_type = 'api_access'").run();
console.log("Cleared fake API access logs.");
