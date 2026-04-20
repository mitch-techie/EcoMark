import { Router, type IRouter } from "express";
import healthRouter from "./health";
import ecomarkRouter from "./ecomark/index";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/ecomark", ecomarkRouter);

export default router;
