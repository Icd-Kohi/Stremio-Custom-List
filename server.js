import { createApp } from "./app.js";
// CHANGE THE PORT IF YOU WANT
const app = createApp();
const port = Number.parseInt(process.env.PORT || "7000", 10);

app.listen(port, () => {
  console.log(`Addon server on http://localhost:${port}`);
});
