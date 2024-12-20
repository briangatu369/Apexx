import * as Yup from "yup";

export const kenyaPhoneNumberRegex = /^(07|01)\d{8}$/;

export const registerSchema = Yup.object({
  username: Yup.string()
    .min(4, "Username must be at least 4 characters.")
    .max(10, "Username must be at most 10 characters.")
    .required("Username is required"),

  phoneNumber: Yup.string()
    .matches(kenyaPhoneNumberRegex, "Invalid phone number.")
    .required("Phone number is required."),

  password: Yup.string()
    .min(4, "Password must be at least 4 characters.")
    .required("Password is required."),
});

export const loginSchema = Yup.object({
  phoneNumber: Yup.string()
    .matches(kenyaPhoneNumberRegex, "Invalid phone number.")
    .required("Phone number is required."),

  password: Yup.string().required("Password is required."),
});
