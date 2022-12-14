import type { MutatorDefs } from "replicache";
import type Express from "express";
import express from "express";
import { handleRequest } from "./endpoints/handle-request.js";
import { handlePoke } from "./endpoints/handle-poke.js";
export interface ReplicacheServerOptions {
  mutators: MutatorDefs;
  port: number;
  host: string;
}

export class ReplicacheExpressServer {
  mutators?: MutatorDefs;
  port: number;
  host: string;
  options: ReplicacheServerOptions;

  private _app?: Express.Application;
  constructor(options: ReplicacheServerOptions) {
    const { mutators = {} as MutatorDefs, port, host } = options;
    this.options = options;
    this.mutators = mutators;
    this.port = port;
    this.host = host;
  }

  get app() {
    if (!this._app) {
      this._app = ReplicacheExpressServer.app(this.options);
    }
    return this._app;
  }

  static app(options: ReplicacheServerOptions): Express.Application {
    const { mutators = {} as MutatorDefs } = options;
    const app = express();

    const errorHandler = (
      err: Error,
      _req: Express.Request,
      res: Express.Response,
      next: Express.NextFunction
    ) => {
      res.status(500).send(err.message);
      next(err);
    };

    app.use(
      express.urlencoded({ extended: true }),
      express.json(),
      errorHandler
    );

    app.post(
      "/api/replicache/:op",
      async (
        req: Express.Request,
        res: Express.Response,
        next: Express.NextFunction
      ) => {
        await handleRequest(req, res, next, mutators);
      }
    );
    app.get(
      "/api/replicache/poke",
      async (
        req: Express.Request,
        res: Express.Response
      ) => {
        await handlePoke(req, res);
      }
    );

    return app;
  }

  start(
    callback: () => void
  ): ReplicacheExpressServer {
    this.app.listen(this.options.port, this.options.host, callback);
    return this;
  }

  static start(
    options: ReplicacheServerOptions,
    callback: () => void
  ): ReplicacheExpressServer {
    const app = new ReplicacheExpressServer(options);
    return app.start(callback);
  }
}
