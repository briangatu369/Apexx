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
import { yupResolver } from "@hookform/resolvers/yup";
import { registerSchema } from "@/validations/authSchema";
import { useForm } from "react-hook-form";
import InputError from "@/components/InputError";
import { IoCreateOutline } from "react-icons/io5";
import { Loader2 } from "lucide-react";
import { twMerge } from "tailwind-merge";
import { handleTryCatchErrors } from "@/utils/handleErrors";
import useAuth from "@/stores/authStore";
import { toast } from "@/components/Toaster";

interface RegisterI {
  username: string;
  phoneNumber: string;
  password: string;
}

const Register = ({
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
    resolver: yupResolver(registerSchema),
  });

  const onSubmit = async (values: RegisterI) => {
    try {
      const response = await api.post("/user-service/register", values);

      toast.success("Account created successfully");
      authenticate(response.data.userData);
      onClose();
      reset();
    } catch (error: unknown) {
      handleTryCatchErrors(error, "Registration failed");
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
              Create Your Account.
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

            {/* username */}
            <div className="grid gap-1">
              <Label htmlFor="phoneNumber">Username</Label>
              <Input
                {...register("username")}
                disabled={isSubmitting}
                id="username"
                type="text"
                placeholder="e.g shadow070"
                className="col-span-3"
              />
              <InputError errorMessage={errors.username?.message} />
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
              {/* Register button*/}
              <Button
                type="submit"
                className={twMerge(
                  isSubmitting &&
                    "bg-slate-700 text-white/40 cursor-not-allowed"
                )}
              >
                <span>Register</span>
                {isSubmitting ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <IoCreateOutline />
                )}
              </Button>

              {/* To login page*/}
              <div className="flex flex-col gap-3 mt-3">
                <Button
                  disabled={isSubmitting}
                  onClick={toggleModals}
                  type="button"
                  variant={"link"}
                  className=" w-fit p-0 h-fit text-custom-yellow"
                >
                  Login instead.
                </Button>
              </div>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default Register;
