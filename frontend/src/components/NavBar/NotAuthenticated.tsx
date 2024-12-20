import { useCallback, useState } from "react";
import { Button } from "../ui/button";
import Login from "@/Pages/auth/Login/Login";
import Register from "@/Pages/auth/Register/Register";

const NotAuthenticated = () => {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);

  const toggleModals = useCallback(() => {
    setIsLoginOpen((prev) => !prev);
    setIsRegisterOpen((prev) => !prev);
  }, []);

  return (
    <div className="flex gap-4">
      {/* modal buttons */}
      <Button
        variant="ghost"
        className="hover:bg-transparent tracking-wide hover:text-white"
        onClick={() => setIsLoginOpen(true)}
      >
        Login
      </Button>
      <Button className="" size="sm" onClick={() => setIsRegisterOpen(true)}>
        Register
      </Button>

      {/* auth modals */}
      <Login
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        toggleModals={toggleModals}
      />
      <Register
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        toggleModals={toggleModals}
      />
    </div>
  );
};

export default NotAuthenticated;
