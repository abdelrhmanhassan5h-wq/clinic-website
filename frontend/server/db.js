```js
const mongoose = require("mongoose");

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("MONGODB_URI is not set");
}

async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI);

    console.log("=================================");
    console.log("MONGODB CONNECTED SUCCESSFULLY");
    console.log("=================================");
  } catch (error) {
    console.error("MONGODB CONNECTION ERROR:");
    console.error(error.message);
    process.exit(1);
  }
}

module.exports = connectDB;
```
