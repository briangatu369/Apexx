import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/config/axiosConfig";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { TbLogin2 } from "react-icons/tb";
import { yupResolver } from "@hookform/resolvers/yup";
import { loginSchema } from "@/validations/authSchema";
import { useForm } from "react-hook-form";
import InputError from "@/components/InputError";
import { Loader2 } from "lucide-react";
import { twMerge } from "tailwind-merge";
import { handleTryCatchErrors } from "@/utils/handleErrors";
import useAuth from "@/stores/authStore";
import { toast } from "@/components/Toaster";

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
  const authenticate = useAuth((state) => state.authenticate);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
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

      toast.success("LoggedIn successfully");
      authenticate(response.data.userData);
      onClose();
      reset();
    } catch (error) {
      handleTryCatchErrors(error, "Login failed");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        onInteractOutside={(e) => {
          e.preventDefault();
        }}
        hideClose={false}
        className="sm:px-9 sm:max-w-80"
      >
        <DialogHeader className="hidden">
          <DialogTitle></DialogTitle>
          <DialogDescription></DialogDescription>
        </DialogHeader>

        {/* form */}
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
                disabled={isSubmitting}
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
                disabled={isSubmitting}
                id="password"
                type="password"
                placeholder="••••••••"
                className="col-span-3"
              />
              <InputError errorMessage={errors.password?.message} />
            </div>
          </div>

          {/* footer */}
          <DialogFooter>
            <div>
              {/* Login Button */}
              <Button
                type="submit"
                className={twMerge(
                  isSubmitting &&
                    "bg-slate-700 text-white/40 cursor-not-allowed"
                )}
              >
                <span>Login</span>
                {isSubmitting ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <TbLogin2 />
                )}
              </Button>
              <div className="flex flex-col gap-3 mt-3">
                {/* To register page */}
                <Button
                  disabled={isSubmitting}
                  onClick={toggleModals}
                  type="button"
                  variant={"link"}
                  className=" w-fit p-0 h-fit text-custom-yellow"
                >
                  Create Account.
                </Button>

                {/* to forgotPassword page */}
                <Button
                  disabled={isSubmitting}
                  type="button"
                  variant={"link"}
                  className=" w-fit p-0 h-fit text-custom-yellow"
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
