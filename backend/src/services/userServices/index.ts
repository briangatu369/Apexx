import User from "../../models/user";
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
      throw new AuthError({ description: "User already exist" });
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
      });
    }

    await user.save();

    return { user, accessToken, refreshToken };
  };

  login = async (userData: LoginI) => {
    const user = await User.findByCred(userData.phoneNumber, userData.password);

    if (!user) {
      throw new AuthError({ description: "User not found" });
    }

    const { accessToken, refreshToken } = await user.generateAuthToken();

    if (!accessToken || !refreshToken) {
      throw new AuthError({
        description: "An error occured. Please try again",
        internalDetails: "Failed to generate auth tokens",
      });
    }

    return { accessToken, refreshToken, user };
  };

  logout = () => {};
  changePassword = () => {};
  sendPasswordReset = () => {};
  resetPassword = () => {};
}

export default UserService;
