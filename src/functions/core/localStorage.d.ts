import { AudioChannel } from "@stores/AudioStore/audioStore.d";

export type LocalStorageDefaults = {
    "settings:modalAnimation": boolean;
}
    & Record<`sound:volume:${AudioChannel}`, number>
    & Record<`sound:muted:${AudioChannel}`, boolean>;
