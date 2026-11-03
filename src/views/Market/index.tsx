import { useState, useEffect, useRef } from "react";
import { Navigate } from "react-router-dom";
import { Tooltip } from "react-tooltip";
import { gainToDb } from "tone";
import { useLoading } from "@stores/LoadingStore";
import { useUser } from "@stores/UserStore/index";
import { useResource } from "@stores/ResourceStore";
import { useModal } from "@stores/ModalStore/index";
import { useAudio } from "@stores/AudioStore/index";
import { useData } from "@stores/DataStore/index";
import { useInsanePull } from "@stores/InsanePullStore/index";
import { useSettings } from "@controllers/settings/useSettings";
import { useOpenPack } from "@controllers/market/useOpenPack";
import { useBoosters } from "@controllers/data/useBoosters";
import { useLocalStorageState } from "@functions/core/hooks/useLocalStorageState";
import { SidebarBody, PageHeader, Modal, Button, SearchBox, ParticleCanvas, Loader } from "@components/index";
import type { ParticleCanvasRef } from "@components/ParticleCanvas/particleCanvas.d";
import { OpenPackModal, Category, Pack, OpenPackContainer, OpenPackBlook, Item, BoosterContainer } from "./components";
import styles from "./market.module.scss";

import { DataBoostersEntity, MarketOpenPackDto, NotFound, Pack as PackType, RarityAnimationTypeEnum, UserBlook } from "@blacket/types";
import { BigButtonClickType, LittleButton, SearchOptions } from "./market.d";
import { AudioChannel } from "@stores/AudioStore/audioStore.d";

export default function Market() {
    const { user } = useUser();
    if (!user) return <Navigate to="/login" />;

    const { setLoading } = useLoading();
    const { createModal } = useModal();
    const { resourceIdToPath } = useResource();
    const { playSound, stopSounds, defineSounds, setVolume } = useAudio();
    const { packs, rarities, blooks, itemShop } = useData();
    const { isPlaying } = useInsanePull();

    const { changeSetting } = useSettings();
    const { openPack } = useOpenPack();
    const { getBoosters } = useBoosters();

    const [currentPack, setCurrentPack] = useState<PackType | null>(null);
    const [openingPack, setOpeningPack] = useState<boolean>(false);
    const [autoOpen, setAutoOpen] = useState<boolean>(false);
    const [autoOpenLoading, setAutoOpenLoading] = useState<boolean>(false);
    const [unlockedBlook, setUnlockedBlook] = useState<UserBlook | null>(null);
    const [bigButtonEvent, setBigButtonEvent] = useState<BigButtonClickType>(BigButtonClickType.CLOSE);
    const [search, setSearch] = useLocalStorageState<SearchOptions>("market:search", { query: "", onlyPurchasable: false });
    const [boosters, setBoosters] = useState<DataBoostersEntity | null>(null);

    const particleCanvasRef = useRef<ParticleCanvasRef>(null);
    const spotlightDimmerRef = useRef<HTMLDivElement>(null);
    const isPlayingRef = useRef(isPlaying);

    const playRaritySound = async (r: RarityAnimationTypeEnum) => {
        if (!user.settings) return;

        let sound = "";

        switch (r) {
            case RarityAnimationTypeEnum.COMMON:
                sound = "common"; break;
            case RarityAnimationTypeEnum.RARE:
                sound = "rare"; break;
            case RarityAnimationTypeEnum.EPIC:
                sound = "epic"; break;
            case RarityAnimationTypeEnum.LEGENDARY:
                sound = "legendary"; break;
            default:
                return;
        }

        if (user.settings.onlyRareSounds && sound !== "legendary") return;

        playSound(sound);
    };

    const stopRaritySound = () => {
        stopSounds(["common", "rare", "epic", "legendary"]);
    };

    const setAmbienceSound = async (pack: PackType) => {
        setVolume(`pack-ambience-${pack.id}`, gainToDb(0.1));

        for (const p of packs.filter((p) => p.id !== pack.id && p.ambienceId)) {
            setVolume(`pack-ambience-${p.id}`, -Infinity);
        }
    };

    const muteAmbience = async () => {
        setVolume(`pack-ambience-${currentPack?.id}`, -Infinity);
    };

    const toggleInstantOpen = () => {
        setLoading("Changing settings");
        changeSetting({ key: "openPacksInstantly", value: !user.settings.openPacksInstantly })
            .then(() => setLoading(false))
            .catch(() => createModal(<Modal.ErrorModal>Failed to change settings.</Modal.ErrorModal>))
            .finally(() => setLoading(false));
    };

    const toggleAutoOpen = () => {
        setAutoOpen(!autoOpen);
    };

    const isNew = (blookId: number) => user.blooks?.find((b) => b.blookId === blookId) ? false : true;

    const purchasePack = (dto: MarketOpenPackDto) => new Promise<void>((resolve, reject) => {
        const pack = packs.find((pack: PackType) => pack.id === dto.packId);
        if (!pack) {
            createModal(<Modal.ErrorModal>{NotFound.UNKNOWN_PACK}</Modal.ErrorModal>);

            return reject(new Error(NotFound.UNKNOWN_PACK));
        }

        if (user.settings.openPacksInstantly && user.tokens < pack.price) {
            return reject(createModal(<Modal.ErrorModal>You do not have enough tokens to purchase this pack.</Modal.ErrorModal>));
        }

        if (user.settings.openPacksInstantly && !autoOpen) setLoading(`Opening ${pack.name} pack`);
        else if (autoOpen) {
            setAutoOpenLoading(true);
        }

        openPack(dto)
            .then(async (res) => {
                setAutoOpenLoading(false);
                setUnlockedBlook(null);
                setOpeningPack(false);

                setTimeout(() => {
                    setCurrentPack(pack);
                    setAmbienceSound(pack);

                    setBigButtonEvent(BigButtonClickType.OPEN);

                    resolve(setUnlockedBlook(res.data));
                }, 1);
            })
            .catch((err) => {
                if (user.settings.openPacksInstantly) createModal(<Modal.ErrorModal>{err?.data?.message || "Something went wrong."}</Modal.ErrorModal>);
                reject(err);
            })
            .finally(() => {
                if (user.settings.openPacksInstantly) setLoading(false);
            });
    });

    const handleBigClick = async () => {
        if (!unlockedBlook) return;

        const blook = blooks.find((blook) => blook.id === unlockedBlook.blookId)!;
        const rarity = rarities.find((rarity) => rarity.id === blook.rarityId)!;

        switch (bigButtonEvent) {
            case BigButtonClickType.OPEN:
                setOpeningPack(true);
                setBigButtonEvent(BigButtonClickType.OPENING);

                await new Promise((r) => {
                    let waitTime = 700;

                    if (blook.video) waitTime += blook.video.length;

                    setTimeout(() => {
                        playRaritySound(rarity.animationType as RarityAnimationTypeEnum);
                    }, 500);

                    let particleDelay = 0;
                    if (rarity.animationType === RarityAnimationTypeEnum.CHROMA) particleDelay = 5000;
                    if (rarity.animationType === RarityAnimationTypeEnum.MYTHICAL) particleDelay = 8800;

                    particleCanvasRef.current?.stop();
                    setTimeout(() => {
                        if (!blook.video) particleCanvasRef.current?.start();
                    }, particleDelay);

                    if (rarity.animationType === RarityAnimationTypeEnum.LEGENDARY) waitTime += 1300;
                    if (rarity.animationType === RarityAnimationTypeEnum.CHROMA) waitTime += 8000;
                    if (rarity.animationType === RarityAnimationTypeEnum.MYTHICAL) waitTime += 20000;
                    if (unlockedBlook.shiny) waitTime += 1000;

                    if (
                        rarity.animationType === RarityAnimationTypeEnum.MYTHICAL
                        || rarity.animationType === RarityAnimationTypeEnum.IRIDESCENT
                    ) {
                        const spotlightDimmer = spotlightDimmerRef.current;

                        if (spotlightDimmer) {
                            const showSpotlight = () => {
                                playSound("angelic-chords");

                                spotlightDimmer.style.opacity = String(1);

                                setTimeout(() => {
                                    spotlightDimmer.style.opacity = String(0);
                                }, 10000);
                            };

                            const checkSpotlight = () => {
                                if (!isPlayingRef.current) setTimeout(showSpotlight, 3000);
                                else setTimeout(checkSpotlight, 100);
                            };


                            setTimeout(() => {
                                if (!isPlayingRef.current) setTimeout(showSpotlight, 2000);
                                else checkSpotlight();
                            }, 9000);
                        }
                    }

                    setTimeout(() => {
                        r(true);
                    }, waitTime);
                });

                setBigButtonEvent(BigButtonClickType.CLOSE);
                break;

            case BigButtonClickType.CLOSE:
                setAutoOpen(false);

                stopRaritySound();
                muteAmbience();

                particleCanvasRef.current?.stop();

                setCurrentPack(null);
                setUnlockedBlook(null);
                setOpeningPack(false);

                break;

            case BigButtonClickType.OPENING:
                setAutoOpen(false);
                break;

            default:
                break;
        }
    };

    useEffect(() => {
        if (autoOpen && unlockedBlook && bigButtonEvent === BigButtonClickType.OPEN) handleBigClick();
    }, [autoOpen, unlockedBlook, bigButtonEvent]);

    useEffect(() => {
        if (autoOpen && currentPack && bigButtonEvent === BigButtonClickType.CLOSE) purchasePack({ packId: currentPack.id }).catch(() => { });
    }, [autoOpen, bigButtonEvent, currentPack]);

    useEffect(() => {
        isPlayingRef.current = isPlaying;
        console.log("isPlaying changed:", isPlaying);
    }, [isPlaying]);

    useEffect(() => {
        getBoosters()
            .then((res) => setBoosters(res.data));

        defineSounds([
            { id: "common", url: window.constructCDNUrl("/content/audio/sound/pack/common.mp3"), options: { channel: AudioChannel.SOUND } },
            { id: "rare", url: window.constructCDNUrl("/content/audio/sound/pack/rare.mp3"), options: { channel: AudioChannel.SOUND } },
            { id: "epic", url: window.constructCDNUrl("/content/audio/sound/pack/epic.mp3"), options: { channel: AudioChannel.SOUND } },
            { id: "legendary", url: window.constructCDNUrl("/content/audio/sound/pack/legendary.mp3"), options: { channel: AudioChannel.SOUND } },
            { id: "shiny", url: window.constructCDNUrl("/content/audio/sound/pack/shiny.mp3"), options: { channel: AudioChannel.SOUND } }
        ]);

        for (const pack of packs) {
            if (!pack.ambienceId) continue;

            defineSounds([{
                id: `pack-ambience-${pack.id}`,
                url: resourceIdToPath(pack.ambienceId!),
                options: {
                    loop: true,
                    volume: gainToDb(0.1),
                    preload: true,
                    channel: AudioChannel.MUSIC
                }
            }]);
        }

        return () => {
            stopSounds(["common", "rare", "epic", "legendary"]);
            stopSounds(packs.map((pack) => `pack-ambience-${pack.id}`));

            particleCanvasRef.current?.stop();
        };
    }, []);

    const LITTLE_BUTTONS: LittleButton[] = [
        {
            children: <>Instant Open: {user.settings.openPacksInstantly ? "On" : "Off"}</>,
            onClick: toggleInstantOpen
        },
        {
            children: <>Convert Diamonds</>,
            onClick: () => { }
        }
    ];

    const unlockedRarity = rarities.find((rarity) => rarity.id === blooks.find((blook) => blook.id === unlockedBlook?.blookId)?.rarityId);

    return (
        <>
            <SidebarBody pushOnMobile={true}>
                <PageHeader>Market</PageHeader>

                <div className={styles.buttonHolderMobile}>
                    {LITTLE_BUTTONS.map((button, index) => <Button.LittleButton key={index} onClick={button.onClick}>{button.children}</Button.LittleButton>)}
                </div>

                <div className={styles.leftSide}>
                    <BoosterContainer boosters={boosters} />

                    <SearchBox
                        placeholder="Search for a pack or item..."
                        containerProps={{
                            style: { margin: "20px 5% 10px" }
                        }}
                        buttons={[
                            { icon: !search.onlyPurchasable ? "fas fa-eye" : "fas fa-eye-slash", tooltip: "Only Purchasable", onClick: () => setSearch({ ...search, onlyPurchasable: !search.onlyPurchasable }) },
                            {
                                icon: "fas fa-times", tooltip: "Reset Search", onClick: () => {
                                    setSearch({ ...search, query: "" });
                                }
                            }
                        ]}
                        value={search.query}
                        onChange={(e) => {
                            setSearch({
                                ...search,
                                query: e.target.value
                            });
                        }}
                    />

                    <Category header={"Packs"}>
                        <div className={styles.packsWrapper}>
                            {packs
                                .filter((pack) => pack.enabled)
                                .map((pack) =>
                                    <Pack key={pack.id} pack={pack} ambienceEnabled={!currentPack} onClick={() => {
                                        if (!user.settings.openPacksInstantly) createModal(<OpenPackModal
                                            pack={pack}
                                            userTokens={user.tokens}
                                            onYesButton={() => purchasePack({ packId: pack.id })}
                                        />);
                                        else purchasePack({ packId: pack.id });
                                    }}
                                        style={{
                                            display: pack.name.toLowerCase().includes(search.query.toLowerCase())
                                                && (!search.onlyPurchasable || user.tokens >= pack.price)
                                                ? "block"
                                                : "none"
                                        }}
                                    />)}

                            {!packs.some((pack) =>
                                pack.name.toLowerCase().includes(search.query.toLowerCase())
                                && (!search.onlyPurchasable || user.tokens >= pack.price)
                            ) && "No packs found."}
                        </div>
                    </Category>

                    {/*
                        pro-tip for future:

                        const weeklyItems = itemShop.filter(item => item.weekly);
                        const nonWeeklyItems = itemShop.filter(item => !item.weekly);
                    */}

                    <Category header="Weekly Shop">
                        <div className={styles.itemShopContainer}>
                            {/* todo: item shop (Bleh :P <[tboyj]) */}
                            {(() => {
                                const nonWeeklyItems = itemShop.filter((entry) => !entry.weekly);

                                return nonWeeklyItems.length > 0 ? nonWeeklyItems.map((entry) => <Item itemShop={entry} key={entry.id}></Item>) : "No items found."; // no items found works
                            })()}
                        </div>
                    </Category>
                    {/* TODO: Test values by adding data to the ItemShop table. */}
                    <Category header="Item Shop">
                        <div className={styles.itemShopContainer}>
                            {/* TODO: item shop */}
                            {(() => {
                                const weeklyItems = itemShop.filter((entry) => entry.weekly);

                                return weeklyItems.length > 0 ? weeklyItems.map((entry) => <Item itemShop={entry} key={entry.id}></Item>) : "No items found."; // no items found works
                            })()}
                        </div>
                    </Category>
                </div>
            </SidebarBody>

            <div className={styles.rightSide}>
                <div className={styles.marketContainer}>
                    <img className={styles.rightSideStore} src={window.constructCDNUrl("/content/shopkeeper.png")} alt="Shopkeeper" />

                    <div className={styles.buttonHolder}>
                        {LITTLE_BUTTONS.map((button, index) => <Button.LittleButton key={index} onClick={button.onClick}>{button.children}</Button.LittleButton>)}
                    </div>
                </div>
            </div>

            {currentPack && <>
                <style>{"body{overflow:hidden}"}</style>

                <div
                    className={styles.openModal}
                    style={isPlaying ? { display: "none" } : {}}
                >
                    <div
                        ref={spotlightDimmerRef}
                        className={styles.spotlightDimmer}
                    />

                    <div className={styles.openModalBackground}>
                        <img src={resourceIdToPath(currentPack.backgroundId)} />
                    </div>

                    <ParticleCanvas
                        ref={particleCanvasRef}
                        color={unlockedRarity?.color ?? "#ffffff"}
                        animationType={unlockedRarity?.animationType as RarityAnimationTypeEnum}
                        images={Array.from({ length: 8 }, (_, i) => window.constructCDNUrl(`/content/particles/${i + 1}.png`))}
                        className={styles.canvas}
                    />

                    {unlockedBlook && <>
                        <OpenPackContainer
                            opening={openingPack}
                            image={resourceIdToPath(currentPack.imageId)}
                            video={
                                blooks.find((blook) => blook.id === unlockedBlook.blookId)!.video
                                    ? resourceIdToPath(blooks.find((blook) => blook.id === unlockedBlook.blookId)!.video?.resourceId)
                                    : undefined
                            }
                            animationType={rarities.find((rarity) => rarity.id === blooks.find((blook) => blook.id === unlockedBlook.blookId)!.rarityId)!.animationType}
                        />
                    </>}

                    {unlockedBlook && <OpenPackBlook userBlook={unlockedBlook} animate={
                        bigButtonEvent === BigButtonClickType.OPENING || bigButtonEvent === BigButtonClickType.CLOSE
                    } isNew={isNew(unlockedBlook.blookId)} />}

                    <div style={{ cursor: bigButtonEvent === BigButtonClickType.NONE ? "unset" : "" }} className={styles.openBigButton} onClick={handleBigClick} />

                    {autoOpenLoading && <Loader className={styles.autoOpenLoader} noModal />}

                    <Tooltip id="autoOpen" place="top">Auto Open</Tooltip>
                    <div
                        className={styles.autoOpenIcon}
                        data-active={autoOpen}
                        onClick={toggleAutoOpen}
                        data-tooltip-id="autoOpen"
                    >
                        <i className="fas fa-sync-alt" />
                    </div>
                </div>
            </>}
        </>
    );
}
