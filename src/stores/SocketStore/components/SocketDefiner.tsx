import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@stores/UserStore/index";
import { useSocket } from "@stores/SocketStore/index";
import { useToast } from "@stores/ToastStore/index";

import { SocketMessageType, SocketPaymentMethodEntity } from "@blacket/types";

export function SocketDefiner() {
    const { user, setUser } = useUser();
    const { socket, initializeSocket } = useSocket();
    const { createToast } = useToast();

    const navigate = useNavigate();

    useEffect(() => {
        initializeSocket();
    }, []);

    useEffect(() => {
        if (!socket) return;

        const onPurchase = (data: any) => {
            if (!user) return;

            const newUser = {
                ...user,

                blooks: [
                    ...user.blooks,
                    ...(data.blooks || [])
                ],
                items: [
                    ...user.items,
                    ...(data.items || [])
                ],
                fonts: [
                    ...user.fonts,
                    ...(data.fonts || [])
                ],
                titles: [
                    ...user.titles,
                    ...(data.titles || [])
                ],
                banners: [
                    ...user.banners,
                    ...(data.banners || [])
                ],

                permissions: data.permissions ?? user.permissions,

                crystals: user.crystals + (data.crystals ?? 0),
                diamonds: user.diamonds + (data.diamonds ?? 0),
                tokens: user.tokens + (data.tokens ?? 0),

                subscription: data.subscription ?? user.subscription
            };

            setUser(newUser);
        };

        const onPaymentMethod = (data: SocketPaymentMethodEntity) => {
            if (!user) return;

            let newPaymentMethods = [...user.paymentMethods];
            if (data.create) {
                newPaymentMethods.push(data.create);

                createToast({
                    header: "Payment Method Added",
                    body: `A new payment method "${data.create.value}" has been added. If this was not you, please contact support immediately.`,
                    icon: window.constructCDNUrl("/content/icons/information.png"),
                    onClick: () => navigate("/settings/billing")
                });
            }
            if (data.update) {
                newPaymentMethods = newPaymentMethods.map((pm) => pm.id === data.update!.id ? data.update! : {
                    ...pm,
                    primary: data.update!.primary ? false : pm.primary
                });

                createToast({
                    header: "Payment Method Updated",
                    body: `Payment method "${data.update.value}" has been updated. If this was not you, please contact support immediately.`,
                    icon: window.constructCDNUrl("/content/icons/information.png"),
                    onClick: () => navigate("/settings/billing")
                });
            }
            if (data.delete) {
                newPaymentMethods = newPaymentMethods.filter((pm) => pm.id !== data.delete);

                createToast({
                    header: "Payment Method Removed",
                    body: "A payment method has been removed from your account. If this was not you, please contact support immediately.",
                    icon: window.constructCDNUrl("/content/icons/information.png"),
                    onClick: () => navigate("/settings/billing")
                });
            }

            const newUser = {
                ...user,
                paymentMethods: newPaymentMethods
            };

            setUser(newUser);
        };

        socket.on(SocketMessageType.STRIPE_PURCHASE_SUCCEEDED, onPurchase);
        socket.on(SocketMessageType.STRIPE_PAYMENT_METHOD, onPaymentMethod);

        return () => {
            socket.off(SocketMessageType.STRIPE_PURCHASE_SUCCEEDED, onPurchase);
            socket.off(SocketMessageType.STRIPE_PAYMENT_METHOD, onPaymentMethod);
        };
    }, [socket, user]);

    return null;
}
