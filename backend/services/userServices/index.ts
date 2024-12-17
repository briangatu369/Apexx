import User from "../../models/user";
import bycrpt from "bcryptjs";

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
      throw new Error("Failed to create user");
    }

    await user.save();

    return { user, accessToken, refreshToken };
  };

  login = async (userData: any) => {
    const user = await User.findByCred(userData.phoneNumber, userData.password);

    if (!user) {
      throw new Error("User not found");
    }

    console.log(user);
    const { accessToken, refreshToken } = await user.generateAuthToken();

    if (!accessToken || !refreshToken) {
      throw new Error("Failed to login");
    }

    return { accessToken, refreshToken };
  };
  logout = () => {};
  changePassword = () => {};
  sendPasswordReset = () => {};
  resetPassword = () => {};
}

export default UserService;
