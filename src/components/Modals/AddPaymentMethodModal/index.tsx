import { useEffect, useState } from "react";
import { useStripe, useElements, PaymentElement } from "@stripe/react-stripe-js";
import { useModal } from "@stores/ModalStore/index";
import { useCreateSetupIntent } from "@controllers/stripe/setup-intent/useCreateSetupIntent/index";
import { useCreate } from "@controllers/stripe/payment-methods/useCreate/index";
import {
    Modal,
    ErrorContainer,
    Button,
    StripeElementsWrapper
} from "@components/index";

import { TheModalProps } from "./addPaymentMethodModal.d";
import { StripeCreateSetupIntentEntity } from "@blacket/types";

function TheModal({ setupIntent }: TheModalProps) {
    const stripe = useStripe();
    const elements = useElements();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const { closeModal } = useModal();
    const { createPaymentMethod } = useCreate();

    if (!stripe || !elements) return null;

    return (
        <>
            <Modal.ModalBody>
                <PaymentElement
                    options={{
                        layout: {
                            type: "auto"
                        },

                        terms: {
                            cashapp: "never",
                            applePay: "never",
                            googlePay: "never"
                        }
                    }}
                />
            </Modal.ModalBody >

            {error !== "" && <ErrorContainer>{error}</ErrorContainer>}

            <Modal.ModalButtonContainer loading={loading}>
                <Button.GenericButton
                    onClick={async () => {
                        if (!stripe || !elements) return;

                        setLoading(true);
                        setError("");

                        const { error: submitError } = await elements.submit();

                        if (submitError) {
                            setError(submitError.message ?? "Something went wrong.");
                            setLoading(false);
                            return;
                        }

                        const { error, setupIntent: si } = await stripe.confirmSetup({
                            elements,
                            redirect: "if_required"
                        });

                        if (error) {
                            setError(error.message ?? "Something went wrong.");
                            setLoading(false);
                            return;
                        }

                        const finalSetupIntentId =
                            si?.id ?? setupIntent.id;

                        await createPaymentMethod({
                            setupIntentId: finalSetupIntentId
                        })
                            .then(() => closeModal())
                            .catch((err: any) =>
                                err?.data?.message
                                    ? setError(err.data.message)
                                    : setError("Something went wrong.")
                            )
                            .finally(() => setLoading(false));
                    }}
                >
                    Add
                </Button.GenericButton>

                <Button.GenericButton onClick={closeModal}>Cancel</Button.GenericButton>
            </Modal.ModalButtonContainer>
        </>
    );
}

export default function AddPaymentMethodModal() {
    const { createSetupIntent } = useCreateSetupIntent();
    const { closeModal } = useModal();

    const [setupIntent, setSetupIntent] = useState<StripeCreateSetupIntentEntity | null>(null);
    const [error, setError] = useState<string>("");

    useEffect(() => {
        createSetupIntent()
            .then((res) => setSetupIntent(res))
            .catch((err) => setError(err?.data?.message ?? "Something went wrong."));
    }, []);

    if (!setupIntent || error) return (
        <>
            <Modal.ModalHeader>Add Payment Method</Modal.ModalHeader>

            {error ? <ErrorContainer style={{ marginTop: 20 }}>{error}</ErrorContainer> : <Modal.ModalBody>Loading payment options...</Modal.ModalBody>}

            <Modal.ModalButtonContainer>
                {!error && <Button.GenericButton>Add</Button.GenericButton>}
                <Button.GenericButton onClick={closeModal}>Cancel</Button.GenericButton>
            </Modal.ModalButtonContainer>
        </>
    );

    return (
        <StripeElementsWrapper clientSecret={setupIntent.clientSecret}>
            <Modal.ModalHeader>Add Payment Method</Modal.ModalHeader>

            <TheModal setupIntent={setupIntent} />
        </StripeElementsWrapper>
    );
}
