import { Dialog, DialogContent, DialogTrigger } from "./ui/dialog";

interface ModalProps {
  modalTrigger: React.ReactNode;
  content: React.ReactNode;
}

const Modal = ({ modalTrigger, content }: ModalProps) => {
  return (
    <Dialog>
      <DialogTrigger>{modalTrigger}</DialogTrigger>
      <DialogContent>{content}</DialogContent>
    </Dialog>
  );
};

export default Modal;
