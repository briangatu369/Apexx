import React from "react";
import { twMerge } from "tailwind-merge";

interface ModalTriggerProps {
  icon: React.ReactNode;
  label: string;
  classname?: string;
}

const ModalTrigger = ({ classname, icon, label }: ModalTriggerProps) => {
  return (
    <div
      className={twMerge(
        "flex items-center gap-1 text-white/85 text-sm",
        classname
      )}
    >
      {icon}
      <p className="text-white/75">{label}</p>
    </div>
  );
};

export default ModalTrigger;
