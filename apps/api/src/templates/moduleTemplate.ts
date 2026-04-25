import { Router, Request, Response, NextFunction } from "express";

// ── Schema ────────────────────────────────────────────────────────────────────
export interface DomainEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

// ── Repository ────────────────────────────────────────────────────────────────
export interface Repository<T extends DomainEntity> {
  findById(id: string): Promise<T | null>;
  findAll(): Promise<T[]>;
  save(entity: Omit<T, "id" | "createdAt" | "updatedAt">): Promise<T>;
  delete(id: string): Promise<void>;
}

// ── Service ───────────────────────────────────────────────────────────────────
export abstract class BaseService<T extends DomainEntity> {
  constructor(protected readonly repo: Repository<T>) {}

  async getById(id: string): Promise<T> {
    const entity = await this.repo.findById(id);
    if (!entity) throw Object.assign(new Error("Not found"), { status: 404 });
    return entity;
  }

  async list(): Promise<T[]> {
    return this.repo.findAll();
  }
}

// ── Controller ────────────────────────────────────────────────────────────────
export abstract class BaseController<T extends DomainEntity> {
  constructor(protected readonly service: BaseService<T>) {}

  getOne = async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json(await this.service.getById(req.params.id));
    } catch (err) {
      next(err);
    }
  };

  getAll = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      res.json(await this.service.list());
    } catch (err) {
      next(err);
    }
  };
}

// ── Router factory ────────────────────────────────────────────────────────────
export function createModuleRouter<T extends DomainEntity>(
  controller: BaseController<T>
): Router {
  const router = Router();
  router.get("/", controller.getAll);
  router.get("/:id", controller.getOne);
  return router;
}
