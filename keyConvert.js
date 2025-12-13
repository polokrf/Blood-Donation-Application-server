const fs = require('fs');
const key = fs.readFileSync('./blood-donation-applicati-fd3fb-firebase-adminsdk-fbsvc-6c42dc87bc.json', 'utf8');
const base64 = Buffer.from(key).toString('base64');
console.log(base64);
