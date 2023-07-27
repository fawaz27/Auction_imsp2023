import { Plus } from "lucide-react";
import { Card, CardHeader, CardTitle } from "../../ui/card";
import { Modal, ModalBody, ModalTriger } from "../../ui/modal";
import { useState } from "react";
import CreateAuction from "../../form/createauction";
import ActiveAuctions from "./activeAuctions";

export default function MyAuctions() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  return (
    <>
      <Card>
        <CardHeader className="flex justify-between item-center gap-4">
          <CardTitle> Les enchères </CardTitle>
          <Modal open={isModalOpen} onOpenChange={setIsModalOpen}>
            <ModalTriger label="Créer un enchère" icon={<Plus size={24} />} />
            <ModalBody title="" isOpen={isModalOpen}>
              <CreateAuction />
            </ModalBody>
          </Modal>
        </CardHeader>
      </Card>
      <ActiveAuctions />
    </>
  );
}
