import NotAuthenticated from "./NotAuthenticated";
import { memo } from "react";
import useAuthStore from "@/stores/authStore";
import Authenticated from "./authenticated/Index";

const NavBar = memo(() => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return (
    <nav className="flex justify-between items-center py-4 px-4 md:px-10 border-white/10 border-b-[1px]">
      <div className="text-xl font-bold">Logo</div>
      {isAuthenticated ? <Authenticated /> : <NotAuthenticated />}
    </nav>
  );
});

export default NavBar;
