import { nanoid } from "nanoid";
import { createSpace, spaceExists } from "../backend";
import type Express from "express";

export async function handleCreateSpace(
  req: Express.Request,
  res: Express.Response
): Promise<void> {
  let spaceID = nanoid(6);
  if (req.body.spaceID) {
    spaceID = req.body.spaceID;
  }
  if (spaceID.length > 10) {
    throw new Error(`SpaceID must be 10 characters or less`);
  }
  try {
    await createSpace(spaceID);
  } catch (e: any) {
    throw Error(`Failed to create space ${spaceID}`, e);
  }
  res.status(200).send({ spaceID });
}

export async function handleSpaceExist(
  req: Express.Request,
  res: Express.Response
): Promise<void> {
  try {
    const exists = await spaceExists(req.body.spaceID);
    res.status(200).send({ spaceExists: exists });
  } catch (e: any) {
    throw Error(`Failed to check space exists ${req.body.spaceID}`, e);
  }
}
