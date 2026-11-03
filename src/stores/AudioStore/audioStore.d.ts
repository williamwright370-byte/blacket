import { Player } from "tone";

export interface Sound {
    id: string;
    player: Player;
    channel: AudioChannel;
}

export interface SoundOptions {
    loop?: boolean;
    volume?: number;
    preload?: boolean;
    channel?: AudioChannel;
}

export interface DefinedSound {
    id: string;
    url: string;
    options?: SoundOptions;
}

export enum AudioChannel {
    SOUND = "SOUND",
    MUSIC = "MUSIC"
}

export interface AudioStore {
    sounds: Sound[];

    getSound: (id: string) => Promise<Tone.Player | undefined>;
    playSound: (id: string) => Promise<void>;
    playSounds: (ids: string[]) => Promise<void>;
    stopSound: (id: string) => Promise<void>;
    stopSounds: (ids: string[]) => Promise<void>;
    stopAllSounds: () => Promise<void>;

    setChannelVolume: (channel: AudioChannel, volume: number) => void;
    setChannelMuted: (channel: AudioChannel, muted: boolean) => void;

    defineSounds: (definedSounds: DefinedSound[]) => Promise<void>;

    setVolume: (id: string, volume: number) => Promise<void>;
}
