import { useEffect } from "react";
import { gainToDb } from "tone";
import { useAudio } from "@stores/AudioStore/index";
import { AudioChannel } from "@stores/AudioStore/audioStore.d";

export default function AudioDefiner() {
    const { defineSounds } = useAudio();

    useEffect(() => {
        defineSounds([

            { id: "pronounce", url: window.constructCDNUrl("/content/audio/sound/pronunciation.mp3"), options: { channel: AudioChannel.SOUND } },
            { id: "angelic-chords", url: window.constructCDNUrl("/content/audio/sound/angelic-chords.mp3"), options: { channel: AudioChannel.SOUND } },
            { id: "cha-ching", url: window.constructCDNUrl("/content/audio/sound/cha-ching.mp3"), options: { channel: AudioChannel.SOUND } },
            { id: "party-popper", url: window.constructCDNUrl("/content/audio/sound/party-popper.mp3"), options: { channel: AudioChannel.SOUND } },
            { id: "token-shower", url: window.constructCDNUrl("/content/audio/sound/token-shower.mp3"), options: { channel: AudioChannel.SOUND } },
            { id: "bass-drop", url: window.constructCDNUrl("/content/audio/sound/bass-drop.mp3"), options: { channel: AudioChannel.SOUND } },

            {
                id: "error", url: window.constructCDNUrl("/content/audio/sound/error.mp3"),
                options: { preload: true, channel: AudioChannel.SOUND }
            },
            {
                id: "notification", url: window.constructCDNUrl("/content/audio/sound/notification.mp3"),
                options: { preload: true, channel: AudioChannel.SOUND }
            },
            {
                id: "mention", url: window.constructCDNUrl("/content/audio/sound/mention.mp3"),
                options: { preload: true, channel: AudioChannel.SOUND }
            },
            {
                id: "modal-open", url: window.constructCDNUrl("/content/audio/sound/modal-open.mp3"),
                options: { preload: true, channel: AudioChannel.SOUND }
            },
            {
                id: "modal-close", url: window.constructCDNUrl("/content/audio/sound/modal-close.mp3"),
                options: { preload: true, channel: AudioChannel.SOUND }
            },
            {
                id: "tick", url: window.constructCDNUrl("/content/audio/sound/tick.mp3"),
                options: { preload: true, volume: gainToDb(0.1), channel: AudioChannel.SOUND }
            }

        ]);
    }, [defineSounds]);

    return null;
}
