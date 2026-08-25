import { createApp } from "./createApp.js";

const host = process.env.MODCELL_HOST ?? "127.0.0.1";
const port = Number.parseInt(process.env.MODCELL_PORT ?? "4317", 10);

const app = await createApp();

const close = async (signal: string) => {
  app.log.info({ signal }, "Stopping ModCell daemon");
  await app.close();
  process.exit(0);
};

process.on("SIGINT", () => { void close("SIGINT"); });
process.on("SIGTERM", () => { void close("SIGTERM"); });

await app.listen({ host, port });
