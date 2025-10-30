import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useResource } from "@stores/ResourceStore/index";
import { useSocket } from "@stores/SocketStore/index";
import { useUser } from "@stores/UserStore/index";
import { useSound } from "@stores/SoundStore/index";
import { useInsanePull } from "@stores/InsanePullStore/index";
import styles from "../insanePullStore.module.scss";

import { SocketMarketInsanePullEntity, SocketMessageType } from "@blacket/types";

export default function InsanePullUI() {
    const { resourceIdToPath } = useResource();
    const { socket, connected } = useSocket();
    const { user } = useUser();
    const { stopAllSounds, playSound } = useSound();
    const { video, setVideo } = useInsanePull();

    if (!user) return null;

    const flashRef = useRef<HTMLDivElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const navigate = useNavigate();

    const fullscreen = () => {
        switch (document.documentElement.requestFullscreen) {
            case undefined:
                if ((document.documentElement as any).webkitRequestFullscreen) (document.documentElement as any).webkitRequestFullscreen();
                if ((document.documentElement as any).msRequestFullscreen) (document.documentElement as any).msRequestFullscreen();

                break;
            default:
                document.documentElement.requestFullscreen();
        }
    };

    const onInsanePull = (data: SocketMarketInsanePullEntity) => {
        if (user.id === data.userId) return;

        setVideo(null);
        setTimeout(() => {
            setVideo(resourceIdToPath(data.videoId));
        }, 1);
    };

    useEffect(() => {
        if (!video) return;

        const flash = flashRef.current;
        const vid = videoRef.current;
        if (!flash || !vid) return;

        // weird workaround for autoplay issues - xotic
        vid.pause();

        stopAllSounds();
        playSound("bass-drop");
        navigate("/chat");

        setTimeout(() => {
            flash.style.backgroundColor = "black";
        }, 250);

        const handleCanPlayThrough = () => {
            setTimeout(() => {
                fullscreen();

                vid.style.opacity = String(1);
                vid.play();
            }, 4000);

            vid.removeEventListener("canplaythrough", handleCanPlayThrough);
        };

        vid.addEventListener("canplaythrough", handleCanPlayThrough);
    }, [video]);

    useEffect(() => {
        if (!connected || !socket) return;

        socket.on(SocketMessageType.MARKET_INSANE_PULL, onInsanePull);

        return () => {
            socket.off(SocketMessageType.MARKET_INSANE_PULL, onInsanePull);
        };
    }, [connected, socket]);

    if (video) return (<>
        <style>{"body{overflow:hidden}"}</style>

        <div className={styles.flash} onContextMenu={(e) => e.preventDefault()} ref={flashRef} />

        <video
            ref={videoRef}
            src={video}
            className={styles.video}
            autoPlay={true}
            muted={false}
            playsInline
            onEnded={() => {
                videoRef.current!.onpause = null;

                flashRef.current!.style.opacity = "0";
                videoRef.current!.style.opacity = "0";

                setTimeout(() => {
                    document.exitFullscreen();

                    setVideo(null);
                }, 5000);
            }}
            onContextMenu={(e) => e.preventDefault()}
        />
    </>);
    else return null;
}
