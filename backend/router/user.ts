import { Router } from "express";
import UserController from "../controllers/user";

const userController = new UserController();

const router = Router();

router.get("/register", userController.createUser);

router.get("/login", userController.login);

export default router;