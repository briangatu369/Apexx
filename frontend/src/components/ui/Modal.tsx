import { ReactNode } from "react";
import { Dialog, DialogContent, DialogTrigger } from "./dialog";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

const Modal = ({ isOpen, onClose, title, children }: ModalProps) => (
  <Dialog open={isOpen} onOpenChange={onClose}>
    <DialogContent>
      <DialogTrigger asChild></DialogTrigger>
      <div>{children}</div>
    </DialogContent>
  </Dialog>
);

export default Modal;
