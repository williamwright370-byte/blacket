import { useModal } from "@stores/ModalStore/index";
import { Modal, Button } from "@components/index";
import { CancelModalProps } from "../billing.d";

export default function CancelModal({ onCancel }: CancelModalProps) {
    const { closeModal } = useModal();

    return (
        <>
            <Modal.ModalHeader>Cancel Subscription</Modal.ModalHeader>

            <Modal.ModalBody>
                Are you sure you want to cancel your subscription?
                <br />
                You will lose access to your benefits on the next billing cycle.
            </Modal.ModalBody>

            <Modal.ModalButtonContainer>
                <Button.GenericButton onClick={onCancel}>Cancel</Button.GenericButton>
                <Button.GenericButton onClick={closeModal}>No</Button.GenericButton>
            </Modal.ModalButtonContainer>
        </>
    );
}
