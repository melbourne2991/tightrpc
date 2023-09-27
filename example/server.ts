import { createApp, toWebHandler } from "h3";
import { operationHandler } from "../src/server/h3.ts";
import { getThings } from "./operations.ts";

const app = createApp();

app.use(
  getThings.path,
  operationHandler(getThings, (_event, { query }) => {
    return {
      status: 200,
      data: {
        name: "test",
        flowers: query.flowers
      },
    }
  })
);

const handler = toWebHandler(app);

Deno.serve({ port: 4338 }, (req) => handler(req));
