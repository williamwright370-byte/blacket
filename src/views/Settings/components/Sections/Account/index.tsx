import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Tooltip } from "react-tooltip";
import { dbToGain, gainToDb } from "tone";
import { useUser } from "@stores/UserStore/index";
import { useData } from "@stores/DataStore/index";
import { useModal } from "@stores/ModalStore/index";
import { useLoading } from "@stores/LoadingStore/index";
import { useAudio } from "@stores/AudioStore/index";
import { AudioChannel } from "@stores/AudioStore/audioStore.d";
import { localStorage } from "@functions/core/localStorage";
import { useDiscordLink } from "@controllers/discord/useDiscordLink/index";
import { useSettings } from "@controllers/settings/useSettings/index";
import { Button, Modal, PaymentMethodText } from "@components/index";
import { SettingsContainer, Divider } from "..";
import { ChangeUsernameModal } from "./components/index";

import { SettingFriendRequestEnum } from "@blacket/types";

const CHANNEL_LABELS: Record<AudioChannel, string> = {
    [AudioChannel.SOUND]: "Sound Volume",
    [AudioChannel.MUSIC]: "Music Volume"
};

export default function Account() {
    const { user } = useUser();
    const { fontIdToName } = useData();
    const { createModal } = useModal();
    const { setLoading } = useLoading();
    const { setChannelVolume } = useAudio();

    const [volumes, setVolumes] = useState<Record<string, number>>(() => Object.fromEntries(
        Object.values(AudioChannel).map((channel) => [
            channel,
            Math.round(dbToGain(localStorage.get(`sound:volume:${channel}`)) * 100)
        ])
    ));

    const { changeSetting } = useSettings();
    const { getOAuthUrl } = useDiscordLink();

    const navigate = useNavigate();

    if (!user) return null;

    const friendRequestsButton = () => {
        setLoading("Changing settings");
        changeSetting({
            key: "friendRequests",
            value: user.settings.friendRequests === SettingFriendRequestEnum.ON ? SettingFriendRequestEnum.MUTUAL : user.settings.friendRequests === SettingFriendRequestEnum.MUTUAL ? SettingFriendRequestEnum.OFF : user.settings.friendRequests === SettingFriendRequestEnum.OFF ? SettingFriendRequestEnum.ON : SettingFriendRequestEnum.ON
        })
            .then(() => setLoading(false))
            .catch((res) => createModal(<Modal.ErrorModal>{res.data.message}</Modal.ErrorModal>))
            .finally(() => setLoading(false));
    };

    const onlyRareSoundsButton = () => {
        setLoading("Changing settings");
        changeSetting({
            key: "onlyRareSounds",
            value: !user.settings.onlyRareSounds
        })
            .then(() => setLoading(false))
            .catch((res) => createModal(<Modal.ErrorModal>{res.data.message}</Modal.ErrorModal>))
            .finally(() => setLoading(false));
    };

    const lowPerformanceModeButton = () => {
        setLoading("Changing settings");

        const newValue =
            user.settings.lowPerformanceMode === null ? false : user.settings.lowPerformanceMode === false ? true : null;

        changeSetting({
            key: "lowPerformanceMode",
            value: newValue
        })
            .then(() => setLoading(false))
            .catch((res) => createModal(<Modal.ErrorModal>{res.data.message}</Modal.ErrorModal>))
            .finally(() => setLoading(false));
    };

    const linkDiscordButton = () => {
        setLoading("Opening Discord");

        getOAuthUrl()
            .then((url) => {
                // TODO: make this a popup
                open(url, "_blank");
            })
            .catch((err: Fetch2Response) => {
                createModal(<Modal.ErrorModal>{err.data.message}</Modal.ErrorModal>);
            })
            .finally(() => setLoading(false));
    };

    return <>
        <SettingsContainer header={{ icon: "fas fa-user", text: "Account" }}>
            <div><b>ID:</b> {user.id}</div>
            <div><b>Username:</b> {user.username}</div>
            <div style={{ display: "inline-flex" }}>
                <b>Font: </b>
                <div style={{ fontFamily: fontIdToName(user.fontId), marginLeft: 7 }}>
                    {fontIdToName(user.fontId)}
                </div>
            </div>
            <div><b>Joined:</b> {`${new Date(user.createdAt).toLocaleDateString()} ${new Date(user.createdAt).toLocaleTimeString()}`}</div>
            {user.discord && <div><b>Discord:</b> {user.discord.username}</div>}

            <Divider margin={10} />

            <Button.ClearButton onClick={() => createModal(<ChangeUsernameModal />)}>Change Username</Button.ClearButton>
            <Button.ClearButton onClick={friendRequestsButton}>Friend Requests: {
                user.settings.friendRequests === SettingFriendRequestEnum.ON ? "On" : user.settings.friendRequests === SettingFriendRequestEnum.OFF ? "Off" : user.settings.friendRequests === SettingFriendRequestEnum.MUTUAL ? "Mutual" : "Unknown"
            }</Button.ClearButton>
            {!user.discord && <Button.ClearButton onClick={linkDiscordButton}>Link Discord</Button.ClearButton>}

            <Button.ClearButton onClick={() => createModal(<Modal.LogoutModal />)}>
                Logout
            </Button.ClearButton>
        </SettingsContainer>

        <SettingsContainer header={{ icon: "fas fa-wallet", text: "Billing" }}>
            <div>
                <b>Payment Method:</b> {user.paymentMethods.length > 0 ? <>
                    <PaymentMethodText paymentMethod={user.paymentMethods.find((method) => method.primary)} />
                </> : "None"}
            </div>
            <div style={{ marginTop: 5 }}>
                <Button.ClearButton onClick={() => navigate("/settings/billing")}>Manage Payment Methods</Button.ClearButton>
            </div>
        </SettingsContainer>

        <SettingsContainer header={{ icon: "fas fa-cog", text: "General" }}>
            <Tooltip id="onlyRareSounds" place="right">This will disable sounds for common blooks such as epic and below.</Tooltip>
            <Button.ClearButton data-tooltip-id="onlyRareSounds" onClick={onlyRareSoundsButton}>Only Rare Sounds: {user.settings.onlyRareSounds ? "On" : "Off"}</Button.ClearButton>

            <Tooltip id="lowPerformanceMode" place="right">This will reduce some animations and visual effects to improve performance on lower-end devices.</Tooltip>
            <Button.ClearButton data-tooltip-id="lowPerformanceMode" onClick={lowPerformanceModeButton}>Low Performance Mode: {
                user.settings.lowPerformanceMode === null ? "Auto" : user.settings.lowPerformanceMode === false ? "Off" : user.settings.lowPerformanceMode === true ? "On" : "Auto"
            }</Button.ClearButton>

            {/* TODO: better styles for this later */}
            {Object.values(AudioChannel).map((channel) => <div key={channel} style={{ marginTop: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <b>{CHANNEL_LABELS[channel]}</b>
                    <span>{volumes[channel]}%</span>
                </div>

                <input
                    type="range"
                    min={0}
                    max={100}
                    value={volumes[channel]}
                    onChange={(e) => {
                        const percent = Number(e.target.value);

                        setVolumes((prev) => ({ ...prev, [channel]: percent }));
                        // -100 dB instead of -Infinity so the value survives JSON storage
                        setChannelVolume(channel, Math.max(gainToDb(percent / 100), -100));
                    }}
                    style={{ width: "100%" }}
                />
            </div>)}

        </SettingsContainer>
    </>;
}
