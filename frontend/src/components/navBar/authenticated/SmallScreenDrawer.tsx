import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import ModalTrigger from "./ModalTrigger";
import Modal from "@/components/Modal";
import { IoLogOutOutline } from "react-icons/io5";
import { NavBarItem } from "./Index";
import { Menu } from "lucide-react";

interface SmallScreenDrawerProps {
  drawerItems: NavBarItem[];
}

const SmallScreenDrawer = ({ drawerItems }: SmallScreenDrawerProps) => {
  return (
    <Drawer>
      <DrawerTrigger asChild>
        <div className="text-white/80 h-fit p-0">
          <Menu size={22} />
        </div>
      </DrawerTrigger>
      <DrawerContent className="bg-secondary-background border-none ">
        <DrawerHeader className="p-0">
          <DrawerTitle></DrawerTitle>
          <DrawerDescription className="text-white/50">Apexx</DrawerDescription>
        </DrawerHeader>

        <div className="flex flex-col gap-4 px-5 py-2 pb-8">
          {drawerItems.map((item) => {
            const { icon: Icon } = item;
            return (
              <Modal
                key={item.label}
                modalTrigger={
                  <ModalTrigger
                    icon={<Icon size={24} />}
                    label={item.label}
                    classname="text-[16px] gap-2"
                  />
                }
                content={item.modalContent}
              />
            );
          })}

          <button className="flex items-center gap-2  text-custom-red">
            <IoLogOutOutline size={24} />
            <span>Logout</span>
          </button>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default SmallScreenDrawer;
