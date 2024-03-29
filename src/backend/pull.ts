import { transact } from "./pg.js";
import {
  getChangedEntries,
  getCookie,
  getLastMutationIDsSince,
} from "./data.js";
import { z } from "zod";
import type { ClientID, PatchOperation } from "replicache";
import type Express from "express";

const pullRequestV0 = z.object({
  pullVersion: z.literal(0),
});

const pullRequestV1 = z.object({
  pullVersion: z.literal(1),
  profileID: z.string(),
  clientGroupID: z.string(),
  cookie: z.union([z.number(), z.null()]),
  schemaVersion: z.string(),
});

const pullRequest = z.union([pullRequestV0, pullRequestV1]);

// Causes the client to reload, getting a newer version of Replicache that can talk to this server.
export type PullResponseV0 = {
  error: "ClientStateNotFound";
};

export type PullResponseV1 = {
  cookie: number;
  lastMutationIDChanges: Record<ClientID, number>;
  patch: PatchOperation[];
};

export async function pull(
  spaceID: string,
  requestBody: Express.Request
): Promise<PullResponseV0 | PullResponseV1> {
  console.log(`Processing pull`, JSON.stringify(requestBody, null, ""));

  const pull = pullRequest.parse(requestBody);
  const { pullVersion } = pull;
  if (pullVersion === 0) {
    const resp: PullResponseV0 = {
      error: "ClientStateNotFound",
    };
    return resp;
  }

  const { cookie: requestCookie } = pull;

  console.log("spaceID", spaceID);

  const t0 = Date.now();
  const sinceCookie = requestCookie ?? 0;

  const [entries, lastMutationIDChanges, responseCookie] = await transact(
    async (executor) => {
      return Promise.all([
        getChangedEntries(executor, spaceID, sinceCookie),
        getLastMutationIDsSince(executor, pull.clientGroupID, sinceCookie),
        getCookie(executor, spaceID),
      ]);
    }
  );

  console.log("lastMutationIDChanges: ", lastMutationIDChanges);
  console.log("responseCookie: ", responseCookie);
  console.log("Read all objects in", Date.now() - t0);

  if (responseCookie === undefined) {
    throw new Error(`Unknown space ${spaceID}`);
  }

  const resp: PullResponseV1 = {
    lastMutationIDChanges,
    cookie: responseCookie,
    patch: [],
  };

  for (const [key, value, deleted] of entries) {
    if (deleted) {
      resp.patch.push({
        op: "del",
        key,
      });
    } else {
      resp.patch.push({
        op: "put",
        key,
        value,
      });
    }
  }

  console.log(`Returning`, JSON.stringify(resp, null, ""));
  return resp;
}
