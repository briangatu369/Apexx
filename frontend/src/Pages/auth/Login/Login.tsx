import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/config/axiosConfig";
import { loginSchema } from "@/validations/authSchema";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm } from "react-hook-form";

interface LoginI {
  phoneNumber: string;
  password: string;
}

const Login = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      phoneNumber: "",
      password: "",
    },
    resolver: yupResolver(loginSchema),
  });

  const onSubmit = async (values: LoginI) => {
    try {
      const response = await api.post("/user-service/login", values);
      console.log(response);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div>
          <label htmlFor="phone-number">Phone Number</label>
          <Input
            {...register("phoneNumber")}
            id="phone-number"
            className="max-w-32"
          />
          <p className="text-red-500">{errors?.phoneNumber?.message}</p>
        </div>
        <div>
          <label htmlFor="password">Password</label>
          <Input {...register("password")} id="password" className="max-w-32" />
          <p className="text-red-500">{errors?.password?.message}</p>
        </div>
        <Button>Login</Button>
      </form>
    </div>
  );
};

export default Login;
