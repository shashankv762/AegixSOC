import { adminAuth } from './src/backend/firebaseAdmin.js';

async function test() {
  console.log("Testing firebase admin initialization...");
  console.log("Project ID:", adminAuth.app.options.projectId);
}

test().catch(console.error);
