import { Router, Request, Response } from "express";
import { sampler, metricSnapshot } from "../middlewares/requestSampler.js";

export const healthRouter = Router();

healthRouter.get("/live", sampler, (_req: Request, res: Response) => {
  res.json({ status: "ok", ts: new Date().toISOString() });
});

healthRouter.get("/ready", (_req: Request, res: Response) => {
  res.json({ status: "ready", ts: new Date().toISOString() });
});

healthRouter.get("/metrics", (_req: Request, res: Response) => {
  res.json(metricSnapshot());
});
