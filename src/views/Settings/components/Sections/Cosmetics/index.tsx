import { useState } from "react";
import { Tooltip } from "react-tooltip";
import { useUser } from "@stores/UserStore/index";
import { useLoading } from "@stores/LoadingStore/index";
import { useModal } from "@stores/ModalStore/index";
import { useSettings } from "@controllers/settings/useSettings/index";
import { useLocalStorageState } from "@functions/core/hooks/useLocalStorageState";
import { localStorageDefaults } from "@functions/core/localStorage";
import { Button, Modal } from "@components/index";
import { SettingsContainer } from "..";

export default function Cosmetics() {
    const { user } = useUser();
    if (!user) return null;

    const { setLoading } = useLoading();
    const { createModal } = useModal();
    const { changeSetting } = useSettings();

    const [modalAnimation, setModalAnimation] = useLocalStorageState("settings:modalAnimation", localStorageDefaults["settings:modalAnimation"]);

    return (
        <SettingsContainer header={{ icon: "fas fa-palette", text: "Cosmetics" }}>
            <Tooltip id="modalAnimation" place="right">This will disable the zoom in out animation on popups.</Tooltip>
            <Button.ClearButton data-tooltip-id="modalAnimation" onClick={() => setModalAnimation(!modalAnimation)}>Modal Animation: {modalAnimation ? "On" : "Off"}</Button.ClearButton>

            <Button.ClearButton onClick={() => {
                if (document.getElementById("theme")) return;
                const style = document.createElement("style");
                style.id = "theme";
                style.innerHTML = `:root {
                        --background-opacity: 0.0175;
                        --background-color: #000000;
                        --primary-color: #0b0b0b;
                        --secondary-color: #1b1b1b;
                        --accent-color: #ffffff;
                    }`;
                document.body.appendChild(style);
            }}>
                amoled theme (experimental)
            </Button.ClearButton>
            <Button.ClearButton onClick={() => {
                const style = document.getElementById("theme");
                if (style) style.remove();
            }}>
                revert to default theme
            </Button.ClearButton>


        </SettingsContainer>
    );
}
