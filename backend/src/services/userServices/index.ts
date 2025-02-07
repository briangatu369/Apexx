import User, { UserInterface } from "../../models/user";
import bcrypt from "bcrypt";
import AuthError from "../../utils/errors/authError";

interface LoginI {
  phoneNumber: string;
  password: string;
}

interface RegisterI {
  phoneNumber: string;
  username: string;
  password: string;
}

class UserService {
  constructor() {}

  createUser = async (userData: RegisterI) => {
    const { phoneNumber, username, password } = userData;
    const saltRounds = 10;

    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const userExist = await User.findOne({ phoneNumber, username });

    if (userExist) {
      throw new AuthError({ description: "User already exist", httpCode: 404 });
    }

    const user = new User({
      phoneNumber,
      username,
      password: hashedPassword,
    });

    let { accessToken, refreshToken } = user.generateAuthToken();

    if (!accessToken || !refreshToken) {
      throw new AuthError({
        description: "An error occured. Please try again",
        internalDetails: "Failed to generate auth tokens",
        httpCode: 500,
      });
    }

    await user.save();

    return { user, accessToken, refreshToken };
  };

  login = async (userData: LoginI) => {
    const user = await User.findByCred(userData.phoneNumber, userData.password);

    if (!user) {
      throw new AuthError({ description: "User not found", httpCode: 404 });
    }

    const { accessToken, refreshToken } = await user.generateAuthToken();

    if (!accessToken || !refreshToken) {
      throw new AuthError({
        description: "An error occured. Please try again",
        internalDetails: "Failed to generate auth tokens",
        httpCode: 500,
      });
    }

    return { accessToken, refreshToken, user };
  };

  verifyAuthentication = async (
    userInfo: Express.Request["user"]
  ): Promise<UserInterface> => {
    const user = await User.findOne({
      phoneNumber: userInfo?.phoneNumber,
    });

    if (!user) {
      throw new AuthError({
        description: "Failed to authenticate",
        httpCode: 404,
      });
    }

    if (user?.accountStatus !== "active") {
      throw new AuthError({
        description: `The account is ${user?.accountStatus}.Please contact support`,
      });
    }

    return user;
  };

  logout = () => {};
  changePassword = () => {};
  sendPasswordReset = () => {};
  resetPassword = () => {};
}

export default UserService;
