import User from "../../models/user";
import bycrpt from "bcryptjs";
import NotFoundError from "../../utils/errors/notFoundError";
import InternalServerError from "../../utils/errors/internalServerError";

class UserService {
  constructor() {}

  createUser = async (userData: any) => {
    const { phoneNumber, username, password } = userData;
    const saltRounds = 10;

    const hashedPassword = await bycrpt.hash(password, saltRounds);

    const user = new User({
      phoneNumber,
      username,
      password: hashedPassword,
    });

    let { accessToken, refreshToken } = user.generateAuthToken();

    if (!accessToken || !refreshToken) {
      throw new InternalServerError("Internal server Error.");
    }

    await user.save();

    return { user, accessToken, refreshToken };
  };

  login = async (userData: any) => {
    const user = await User.findByCred(userData.phoneNumber, userData.password);

    if (!user) {
      throw new NotFoundError("User not found.");
    }

    const { accessToken, refreshToken } = await user.generateAuthToken();

    if (!accessToken || !refreshToken) {
      throw new InternalServerError("Internal server Error.");
    }

    return { accessToken, refreshToken };
  };
  logout = () => {};
  changePassword = () => {};
  sendPasswordReset = () => {};
  resetPassword = () => {};
}

export default UserService;
