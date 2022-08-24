import type Express from "express";
import { pull } from "../backend/pull.js";

export async function handlePull(
  req: Express.Request,
  res: Express.Response
): Promise<void> {
  if (req.query.spaceID === undefined) {
    res.status(400).json({ error: "spaceID is required" });
    return;
  }
  const { spaceID } = req.query;
  const resp = await pull(spaceID as string, req.body);
  res.json(resp);
}
