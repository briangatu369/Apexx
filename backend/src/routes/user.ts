import { Router } from "express";
import UserController from "../controllers/user";
import validateJwt from "../middlewares/validateJwt";

const userController = new UserController();

const router = Router();

router.post("/register", userController.createUser);
router.post("/login", userController.login);
router.post("/verifyjwt", validateJwt, userController.verifyUserAuthentication);
router.get("/logout", userController.logout);

export { router as UserRouter };
