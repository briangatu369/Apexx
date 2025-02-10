import { ToastContainer, toast as reactToastify } from "react-toastify";

const Toaster = () => {
  return <ToastContainer position="top-center" hideProgressBar theme="dark" />;
};

const toast = reactToastify;

export { Toaster, toast };
