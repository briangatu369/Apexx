import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/config/axiosConfig";
import { registerSchema } from "@/validations/authSchema";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm } from "react-hook-form";

interface RegisterI {
  username: string;
  phoneNumber: string;
  password: string;
}

const Register = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      username: "",
      phoneNumber: "",
      password: "",
    },
    resolver: yupResolver(registerSchema),
  });

  const onSubmit = async (values: RegisterI) => {
    try {
      await api.post("/user-service/register", values);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div>
          <label htmlFor="username">Username</label>
          <Input {...register("username")} id="username" className="max-w-32" />
          <p className="text-red-500">{errors?.username?.message}</p>
        </div>
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
        <Button>register</Button>
      </form>
    </div>
  );
};

export default Register;
