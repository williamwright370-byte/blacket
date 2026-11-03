import { create } from "zustand";
import * as Tone from "tone";

import { localStorage } from "@functions/core/localStorage";

import { AudioStore, Sound, DefinedSound, AudioChannel } from "./audioStore.d";

export const useAudio = create<AudioStore>((set, get) => {
    const sounds: Sound[] = [];

    const channels = Object.fromEntries(
        Object.values(AudioChannel).map((channel) => [channel, new Tone.Volume(0).toDestination()])
    ) as Record<AudioChannel, Tone.Volume>;

    for (const channel of Object.values(AudioChannel)) {
        channels[channel].volume.value = localStorage.get(`sound:volume:${channel}`);
        channels[channel].mute = localStorage.get(`sound:muted:${channel}`);
    }

    return {
        sounds,

        getSound: async (id: string) => {
            const sound = get().sounds.find((s) => s.id === id);
            return sound?.player;
        },

        playSound: async (id: string) => {
            const sound = await get().getSound(id);
            if (!sound) return;

            await Tone.start();
            sound.start();
        },

        playSounds: async (ids: string[]) => {
            await Promise.all(ids.map((id) => get().playSound(id)));
        },

        stopSound: async (id: string) => {
            const sound = await get().getSound(id);
            if (!sound) return;

            sound.stop();
        },

        stopSounds: async (ids: string[]) => {
            await Promise.all(ids.map((id) => get().stopSound(id)));
        },

        stopAllSounds: async () => {
            await Promise.all(get().sounds.map((sound) => sound.player.stop()));
        },

        setChannelVolume: (channel: AudioChannel, volume: number) => {
            channels[channel].volume.value = volume;
            localStorage.set(`sound:volume:${channel}`, volume);
        },

        setChannelMuted: (channel: AudioChannel, muted: boolean) => {
            channels[channel].mute = muted;
            localStorage.set(`sound:muted:${channel}`, muted);
        },

        defineSounds: async (definedSounds: DefinedSound[]) => {
            const currentSounds = get().sounds;

            const newSounds = await Promise.all(
                definedSounds.map(async (definedSound) => {
                    if (currentSounds.find((s) => s.id === definedSound.id)) return null;

                    const channel = definedSound.options?.channel ?? AudioChannel.SOUND;

                    const player = new Tone.Player({
                        url: definedSound.url,
                        loop: definedSound.options?.loop ?? false,
                        volume: definedSound.options?.volume ?? 0
                    }).connect(channels[channel]);

                    if (definedSound.options?.preload) await player.load(definedSound.url);

                    return { id: definedSound.id, player, channel };
                })
            );

            set((s) => ({
                sounds: [
                    ...s.sounds,
                    ...newSounds.filter((s): s is Sound => s !== null)
                ]
            }));
        },

        setVolume: async (id: string, volume: number) => {
            const sound = get().sounds.find((s) => s.id === id);
            if (!sound) return;

            sound.player.volume.value = volume;
        }
    };
});
