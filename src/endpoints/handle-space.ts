import { nanoid } from "nanoid";
import { createSpace, spaceExists } from "../backend";
import type Express from "express";

export async function handleCreateSpace(
  req: Express.Request,
  res: Express.Response,
  next: Express.NextFunction
): Promise<void> {
  let spaceID = nanoid(6);
  if (req.body.spaceID) {
    spaceID = req.body.spaceID;
  }
  if (spaceID.length > 10) {
    next(Error(`SpaceID must be 10 characters or less`));
  }
  try {
    await createSpace(spaceID);
    res.status(200).send({ spaceID });
  } catch (e: any) {
    next(Error(`Failed to create space ${spaceID}`, e));
  }
}

export async function handleSpaceExist(
  req: Express.Request,
  res: Express.Response,
  next: Express.NextFunction
): Promise<void> {
  try {
    const exists = await spaceExists(req.body.spaceID);
    res.status(200).send({ spaceExists: exists });
  } catch (e: any) {
    next(Error(`Failed to check space exists ${req.body.spaceID}`, e));
  }
}
