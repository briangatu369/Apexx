import { Router } from "express";
import UserController from "../controllers/user";

const userController = new UserController();

const router = Router();

router.post("/register", userController.createUser);

router.post("/login", userController.login);

router.get("/logout", userController.logout);

export default router;
