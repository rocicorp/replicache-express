import type Express from "express";
import { getPokeBackend } from "../backend/poke/poke.js";
import type { SSEPokeBackend } from "../backend/poke/sse.js";

export async function handlePokeSSE(
  req: Express.Request,
  res: Express.Response,
  next: Express.NextFunction
): Promise<void> {
  if (req.query.spaceID === undefined) {
    res.status(400).send("Missing spaceID");
    return;
  }
  const { spaceID } = req.query;

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Content-Type", "text/event-stream;charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("X-Accel-Buffering", "no");

  res.write(`id: ${Date.now()}\n`);
  res.write(`data: hello\n\n`);

  const pokeBackend = getPokeBackend() as SSEPokeBackend;
  if (!pokeBackend.addListener) {
    throw new Error(
      "Unsupported configuration. Expected to be configured using server-sent events for poke."
    );
    next();
  }

  const unlisten = pokeBackend.addListener(spaceID as string, () => {
    console.log(`Sending poke for space ${spaceID}`);
    res.write(`id: ${Date.now()}\n`);
    res.write(`data: poke\n\n`);
  });

  setInterval(() => {
    res.write(`id: ${Date.now()}\n`);
    res.write(`data: beat\n\n`);
  }, 30 * 1000);

  res.on("close", () => {
    console.log("Closing poke connection");
    unlisten();
  });
}
