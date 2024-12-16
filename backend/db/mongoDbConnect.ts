import mongoose from "mongoose";

const connectDb = async (url: string) => {
  try {
    await mongoose.connect(url);
    console.log("database connected succesfully");
  } catch (error) {
    throw error;
  }
};

export default connectDb;
