import Modal from "@/components/Modal";
import Transactions from "@/pages/transactions/Index";
import useAuthStore from "@/stores/authStore";
import ModalTrigger from "./ModalTrigger";
import QuickQuestions from "@/pages/quickQuestions/Index";
import Profile from "@/pages/profile/Index";
import { Button } from "@/components/ui/button";
import SmallScreenDrawer from "./SmallScreenDrawer";
import DropDown from "./DropDown/Index";
import { LuHandCoins, LuShieldQuestion, LuUserRound } from "react-icons/lu";
import { IconType } from "react-icons/lib";

export interface NavBarItem {
  icon: IconType;
  label: string;
  modalContent: React.ReactNode;
}

const Authenticated = () => {
  const userData = useAuthStore((state) => state.userData);

  const navBarItems: NavBarItem[] = [
    {
      icon: LuHandCoins,
      label: "Cashier",
      modalContent: <Transactions />,
    },
    {
      icon: LuShieldQuestion,
      label: "FQA",
      modalContent: <QuickQuestions />,
    },
    {
      icon: LuUserRound,
      label: "Profile",
      modalContent: <Profile />,
    },
  ];

  return (
    <div className="flex items-center gap-4">
      {/* hidden in small screen */}
      <div className="hidden md:flex items-end gap-4">
        {navBarItems.map((item) => {
          const { icon: Icon } = item;
          return (
            <Modal
              key={item.label}
              modalTrigger={
                <ModalTrigger icon={<Icon size={19} />} label={item.label} />
              }
              content={item.modalContent}
            />
          );
        })}
      </div>

      {/* hidden in large screens */}
      <div className="flex md:hidden">
        <Modal
          modalTrigger={
            <Button className="h-fit px-3 py-[6px] text-sm rounded-xl">
              Deposit
            </Button>
          }
          content={<Transactions />}
        />
      </div>

      {/* always shown */}
      <div className="flex items-center">
        <h4 className="text-custom-green text-sm font-bold">
          <span className="text-[15px]">
            {userData?.accountBalance.toFixed(2)}
          </span>
          <span className="text-white/50 font-normal text-xs ml-[2px]">
            KES
          </span>
        </h4>
      </div>

      {/* dynamic */}
      <div>
        <div className="hidden md:flex">
          <DropDown />
        </div>
        <div className="md:hidden">
          <SmallScreenDrawer drawerItems={navBarItems} />
        </div>
      </div>
    </div>
  );
};

export default Authenticated;
