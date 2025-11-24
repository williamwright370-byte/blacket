import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";

import { StripeElementsWrapperProps } from "./stripeElementsWrapper.d";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

export default function StripeElementsWrapper({ clientSecret, children }: StripeElementsWrapperProps) {
    const colorText = getComputedStyle(document.documentElement).getPropertyValue("--accent-color");
    const colorBackground = getComputedStyle(document.documentElement).getPropertyValue("--background-color");
    const borderRadius = getComputedStyle(document.documentElement).getPropertyValue("--border-radius");

    return <Elements stripe={stripePromise} options={{
        clientSecret,
        appearance: {
            variables: {
                fontFamily: "Nunito, sans-serif",
                colorText,
                colorBackground,
                colorPrimary: colorText,
                borderRadius: borderRadius,
                spacingUnit: String(3) + "px"
            },
            disableAnimations: true,
            labels: "above"
        }
    }}>{children}</Elements>;
}
