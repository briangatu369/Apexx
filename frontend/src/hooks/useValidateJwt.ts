import { useEffect } from "react";
import { AxiosError } from "axios";
import { api } from "@/config/axiosConfig";
import useAuthStore from "@/stores/authStore";
import { useShallow } from "zustand/shallow";
import { toast } from "@/components/Toaster";

const useValidateJwt = () => {
  const { authenticate, deauthenticate } = useAuthStore(
    useShallow((state) => ({
      authenticate: state.authenticate,
      deauthenticate: state.deauthenticate,
    }))
  );

  const validateJwt = async () => {
    try {
      const response = await api.post("/user-service/verifyjwt");
      const userData = response.data.userData;
      authenticate(userData);
    } catch (error) {
      deauthenticate();

      if (error instanceof AxiosError) {
        if (error.response?.data.error === "Token expired") {
          toast.error("Your Session has Expired");
        }
      }
    }
  };

  useEffect(() => {
    validateJwt();
  }, []);
};

export default useValidateJwt;
