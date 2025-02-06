import mongoose from "mongoose";

const connectDb = async (url: string) => {
  try {
    await mongoose.connect(url, { maxPoolSize: 10 });
    console.log("database connected succesfully");
  } catch (err) {
    console.error("Database connection failed:", err);
    throw err;
  }
};

export default connectDb;
