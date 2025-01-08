import NotAuthenticated from "./NotAuthenticated";

const NavBar = () => {
  return (
    <nav className="flex justify-between items-center p-4">
      <div className="text-xl font-bold">Logo</div>
      <NotAuthenticated />
    </nav>
  );
};

export default NavBar;
