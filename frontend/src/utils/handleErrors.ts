import axios from "axios";
import { toast } from "sonner";

export const handleTryCatchErrors = (error: unknown, fallbackError: string) => {
  if (axios.isAxiosError(error)) {
    let message = error?.response?.data?.error ?? fallbackError;

    if (!error.response) {
      message = "Failed to contact the server";
    }

    toast.error(message);
  } else {
    toast.error("An unexpected error occurred");
  }
};
