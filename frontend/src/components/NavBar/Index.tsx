import { useCallback, useState } from "react";
import NotAuthenticated from "./NotAuthenticated";

const NavBar = () => {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);

  const toggleModals = useCallback(() => {
    setIsLoginOpen((prev) => !prev);
    setIsRegisterOpen((prev) => !prev);
  }, []);

  return (
    <nav className="flex justify-between items-center p-4">
      <div className="text-xl font-bold">Logo</div>
      <NotAuthenticated />
    </nav>
  );
};

export default NavBar;
