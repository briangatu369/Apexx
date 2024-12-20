import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/config/axiosConfig";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { TbLogin2 } from "react-icons/tb";
import { yupResolver } from "@hookform/resolvers/yup";
import { loginSchema } from "@/validations/authSchema";
import { useForm } from "react-hook-form";
import InputError from "@/components/InputError";

interface LoginI {
  phoneNumber: string;
  password: string;
}

const Login = ({
  isOpen,
  onClose,
  toggleModals,
}: {
  isOpen: boolean;
  onClose: () => void;
  toggleModals: () => void;
}) => {
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
      await api.post("/user-service/login", values);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <div></div>
      <DialogContent
        hideClose={false}
        className="sm:max-w-[400px] border-none bg-dark-brown"
      >
        <DialogHeader className="hidden">
          <DialogTitle></DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="py-2">
            <h1 className="text-center tracking-wide font-semibold text-xl">
              Login into Apexx.
            </h1>
          </div>
          <div className="grid gap-4 py-4">
            {/* phone number */}
            <div className="grid gap-1">
              <Label htmlFor="phoneNumber">Phone Number</Label>
              <Input
                {...register("phoneNumber")}
                id="phoneNumber"
                type="tel"
                placeholder="e.g 07xx-xxx-xxx"
                className="col-span-3"
              />
              <InputError errorMessage={errors.phoneNumber?.message} />
            </div>

            {/* password */}
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                {...register("password")}
                id="password"
                type="password"
                placeholder="••••••••"
                className="col-span-3"
              />
              <InputError errorMessage={errors.password?.message} />
            </div>
          </div>
          <DialogFooter>
            <div>
              <Button type="submit">
                <span>Login</span>
                <TbLogin2 />
              </Button>
              <div className="flex flex-col gap-3 mt-3">
                <Button
                  onClick={toggleModals}
                  type="button"
                  variant={"link"}
                  className=" w-fit p-0 h-fit"
                >
                  Create Account.
                </Button>
                <Button
                  type="button"
                  variant={"link"}
                  className=" w-fit p-0 h-fit"
                >
                  Forgot your Password?
                </Button>
              </div>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default Login;
