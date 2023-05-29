import type { PGConfig } from "./pgconfig/pgconfig.js";
import type { Executor } from "./pg.js";

export async function createDatabase(executor: Executor, dbConfig: PGConfig) {
  console.log("creating database");
  const schemaVersion = await dbConfig.getSchemaVersion(executor);
  const migrations = [createSchemaVersion1, createSchemaVersion2];
  if (schemaVersion < 0 || schemaVersion > migrations.length) {
    throw new Error("Unexpected schema version: " + schemaVersion);
  }

  for (let i = schemaVersion; i < migrations.length; i++) {
    console.log("Running migration for schemaVersion", i);
    await migrations[i](executor);
  }
}

export async function createSchemaVersion1(executor: Executor) {
  await executor(
    "create table replicache_meta (key text primary key, value json)"
  );
  await executor(
    "insert into replicache_meta (key, value) values ('schemaVersion', '1')"
  );

  await executor(`create table replicache_space (
        id text primary key not null,
        version integer not null,
        lastmodified timestamp(6) not null
        )`);

  await executor(`create table replicache_client (
          id text primary key not null,
          lastmutationid integer not null,
          lastmodified timestamp(6) not null
          )`);

  await executor(`create table replicache_entry (
        spaceid text not null,
        key text not null,
        value text not null,
        deleted boolean not null,
        version integer not null,
        lastmodified timestamp(6) not null
        )`);

  await executor(`create unique index on replicache_entry (spaceid, key)`);
  await executor(`create index on replicache_entry (spaceid)`);
  await executor(`create index on replicache_entry (deleted)`);
  await executor(`create index on replicache_entry (version)`);
}

export async function createSchemaVersion2(executor: Executor) {
  // Add the clientgroupid column. Existing clients will use their id as the clientgroupid.
  await executor(`alter table replicache_client add column clientgroupid text`);
  await executor(`update replicache_client set clientgroupid=id`);
  await executor(
    `alter table replicache_client alter column clientgroupid set not null`
  );

  // Add the version column. Existing clients will use zero as their version.
  await executor(`alter table replicache_client add column version integer`);
  await executor(`update replicache_client set version=0`);
  await executor(
    `alter table replicache_client alter column version set not null`
  );

  // Add an index to find clients by clientgroupid and version quickly.
  await executor("create index on replicache_client (clientgroupid,version)");

  // Update schema version.
  await executor(
    "update replicache_meta set value = '2' where key = 'schemaVersion'"
  );
}
