import { DropdownMenu } from "@/components/ui/dropdown-menu";
import {
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@radix-ui/react-dropdown-menu";
import { IoLogOutOutline } from "react-icons/io5";
import { HiMiniBars3CenterLeft } from "react-icons/hi2";

const DropDown = () => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="text-white/75 outline-none">
        <HiMiniBars3CenterLeft size={22} />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-44 bg-secondary-background py-2 px-3 text-sm rounded-md absolute -right-4 top-2">
        <div>
          <button className="flex items-center gap-2  text-custom-red">
            <IoLogOutOutline size={20} />
            <span>Logout</span>
          </button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default DropDown;
