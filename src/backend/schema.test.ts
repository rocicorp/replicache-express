import { expect } from "chai";
import { test } from "mocha";
import { createSpace } from "./data.js";
import { transactWithExecutor, withExecutorAndPool } from "./pg.js";
import { getDBConfig } from "./pgconfig/pgconfig.js";
import { createSchemaVersion1, createSchemaVersion2 } from "./schema.js";

test("v2Migration", async () => {
  const dbConfig = getDBConfig();
  const pool = dbConfig.initPool();

  // the pool will emit an error on behalf of any idle clients
  // it contains if a backend error or network partition happens
  pool.on("error", (err) => {
    console.error("Unexpected error on idle client", err);
    process.exit(-1);
  });
  pool.on("connect", async (client) => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    client.query(
      "SET SESSION CHARACTERISTICS AS TRANSACTION ISOLATION LEVEL SERIALIZABLE"
    );
  });

  await withExecutorAndPool(async (executor) => {
    await transactWithExecutor(executor, async (executor) => {
      await createSchemaVersion1(executor);

      await createSpace(executor, "s1");
      await executor(
        `insert into replicache_client (id, lastmutationid, lastmodified) values ('c1', 7, now())`
      );

      await createSchemaVersion2(executor);
      const result = await executor("select * from replicache_client");
      expect(result.rowCount).eq(1);
      expect(result.rows[0].id).eq("c1");
      expect(result.rows[0].lastmutationid).eq(7);
      expect(result.rows[0].lastmodified).not.eq(undefined);
      expect(result.rows[0].clientgroupid).eq("c1");
      expect(result.rows[0].version).eq(0);
    });
  }, pool);
});
