import type Express from "express";
import { getCookie, createSpace as createSpaceImpl } from "../backend/data.js";
import { handleRequest as handleRequestImpl } from "../endpoints/handle-request.js";
import { transact } from "../backend/pg.js";
import type { MutatorDefs } from "replicache";

export async function spaceExists(spaceID: string) {
  try {
    const cookie = await transact(async (executor) => {
      return await getCookie(executor, spaceID);
    });
    return cookie !== undefined;
  } catch (e) {
    throw new Error(`Failed calling spaceExists: ${spaceID}`);
  }
}

export async function createSpace(spaceID: string) {
  try {
    await transact(async (executor) => {
      await createSpaceImpl(executor, spaceID);
    });
  } catch (e) {
    throw new Error(`Failed to create space ${spaceID}`);
  }
}

export async function handleRequest<M extends MutatorDefs>(
  req: Express.Request,
  res: Express.Response,
  next: Express.NextFunction,
  mutators: M
) {
  await handleRequestImpl(req, res, next, mutators);
}
