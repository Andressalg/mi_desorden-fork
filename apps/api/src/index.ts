import { app } from "./app";
import { env } from "./lib/env";

app.listen(env.port);

console.log(`API en http://localhost:${env.port} — docs en /docs`);
