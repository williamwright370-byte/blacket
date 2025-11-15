import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    AutoSizer,
    Collection,
    List,
    type Collection as CollectionType,
    type List as ListType,
    type CollectionCellSizeAndPositionGetter,
    type ListRowRenderer
} from "react-virtualized";

import { useData } from "@stores/DataStore/index";
import { useResource } from "@stores/ResourceStore/index";
import { useUser } from "@stores/UserStore/index";
import { InventoryBlook /* , InventoryItem */ } from "./components";
import { DEFAULT_OPTIONS, PACK_HEADER_H } from "./constants";
import { flowLayout, sizeOf } from "./utils";
import styles from "./itemContainer.module.scss";

import {
    ItemContainerProps,
    SelectedTypeEnum,
    FlatCell
} from "./itemContainer.d";
import { Blook } from "@blacket/types";

export default function ItemContainer({ user, options, onClick, ...props }: ItemContainerProps) {
    const { packs, blooks } = useData();
    const { resourceIdToPath } = useResource();
    const { getBlookAmount } = useUser();

    const mergedOptions = { ...DEFAULT_OPTIONS, ...options };

    const isBlookVisible = useCallback((blook: Blook) => {
        const amountNormal = getBlookAmount(blook.id, false, user);
        const amountShiny = getBlookAmount(blook.id, true, user);
        const locked = amountNormal <= 0;

        if (mergedOptions.rarities && !mergedOptions.rarities.includes(blook.rarityId)) return false;
        if (mergedOptions.searchQuery && !blook.name.toLowerCase().includes(mergedOptions.searchQuery.toLowerCase())) return false;

        if (!locked || (locked && mergedOptions.showLocked)) return true;
        if (amountShiny > 0 && mergedOptions.showShiny) return true;

        return false;
    },
        [
            getBlookAmount,
            mergedOptions.rarities, mergedOptions.searchQuery, mergedOptions.showLocked, mergedOptions.showShiny,
            user
        ]
    );

    const visiblePacks = useMemo(() => {
        if (!mergedOptions.showBlooks || !mergedOptions.showPacks) return [];

        return packs.filter((pack) => blooks.some((b) => b.packId === pack.id && isBlookVisible(b)));
    }, [
        mergedOptions.showBlooks, mergedOptions.showPacks,
        packs, blooks,
        isBlookVisible
    ]);

    const buildCellsForBlook = useCallback((blook: Blook): FlatCell[] => {
        if (!isBlookVisible(blook)) return [];

        const normalAmt = getBlookAmount(blook.id, false, user);
        const shinyAmt = getBlookAmount(blook.id, true, user);
        const locked = normalAmt <= 0;
        const { w, h } = sizeOf(blook);

        const cells: FlatCell[] = [];

        if (!(locked && !mergedOptions.showLocked)) {
            cells.push({
                key: `${blook.id}-n`,
                blook,
                shiny: false,
                amount: normalAmt,
                locked,
                userBlook: user.blooks.find((ub) => ub.blookId === blook.id && !ub.shiny) || null,
                w,
                h
            });
        }

        if (shinyAmt > 0 && mergedOptions.showShiny) {
            cells.push({
                key: `${blook.id}-s`,
                blook,
                shiny: true,
                amount: shinyAmt,
                locked: false,
                userBlook: user.blooks.find((ub) => ub.blookId === blook.id && ub.shiny) || null,
                w,
                h
            });
        }

        return cells;
    },
        [getBlookAmount, isBlookVisible, mergedOptions.showLocked, mergedOptions.showShiny, user]
    );

    // FLAT MODE
    const flatCells = useMemo<FlatCell[]>(() => {
        if (!mergedOptions.showBlooks || mergedOptions.showPacks) return [];

        const arr: FlatCell[] = [];
        for (const blook of blooks) arr.push(...buildCellsForBlook(blook));

        arr.sort((a, b) =>
            a.blook.priority - b.blook.priority ||
            (a.shiny ? 1 : 0) - (b.shiny ? 1 : 0)
        );

        return arr;
    }, [blooks, buildCellsForBlook, mergedOptions.showBlooks, mergedOptions.showPacks]);

    // PACK MODE
    const packCellsMap = useMemo(() => {
        const map = new Map<number, FlatCell[]>();

        for (const pack of visiblePacks) {
            const cells: FlatCell[] = [];

            for (const blook of blooks) {
                if (blook.packId !== pack.id) continue;

                cells.push(...buildCellsForBlook(blook));
            }

            cells.sort((a, b) =>
                a.blook.priority - b.blook.priority ||
                (a.shiny ? 1 : 0) - (b.shiny ? 1 : 0)
            );

            map.set(pack.id, cells);
        }

        return map;
    }, [visiblePacks, blooks, buildCellsForBlook]);

    const handleClick = useCallback((cell: FlatCell) => {
        if (!onClick || cell.amount <= 0) return;

        onClick({ type: SelectedTypeEnum.BLOOK, item: cell.userBlook });
    }, [onClick]);

    const renderTile = useCallback((cell: FlatCell) => <InventoryBlook
        key={cell.key}
        blook={cell.blook}
        shiny={cell.shiny}
        big={cell.blook.isBig}
        locked={cell.locked}
        amount={cell.amount}
        onClick={() => handleClick(cell)}
    />, [handleClick]);

    // DO NOT REMOVE THIS
    const flatRef = useRef<CollectionType | null>(null);
    const listRef = useRef<ListType | null>(null);
    const [flatWidth, setFlatWidth] = useState(0);
    const [listWidth, setListWidth] = useState(0);

    // recompute flat collection when width/data changes
    useEffect(() => {
        flatRef.current?.recomputeCellSizesAndPositions();
    }, [flatWidth, flatCells]);

    // recompute list heights when width/data changes
    useEffect(() => {
        listRef.current?.recomputeRowHeights();
        (listRef.current as any)?.forceUpdateGrid?.();
    }, [listWidth, visiblePacks, packCellsMap]);

    useEffect(() => {
        listRef.current?.scrollToRow(0);
    }, [
        mergedOptions.searchQuery,
        mergedOptions.rarities,
        mergedOptions.showLocked,
        mergedOptions.showShiny
    ]);

    // flat grid
    const renderFlatCollection = () => <AutoSizer>
        {({ width, height }) => {
            if (width !== flatWidth) setFlatWidth(width);

            const { pos, totalH } = flowLayout(flatCells, width);
            // collection wants absolute positions, do not add margins/gaps in the wrapper
            const cellSizeAndPositionGetter: CollectionCellSizeAndPositionGetter = ({ index }) => {
                const p = pos[index];
                return { width: p.w, height: p.h, x: p.x, y: p.y };
            };

            const viewportH = height;

            return (
                <Collection
                    ref={flatRef}
                    width={width}
                    height={viewportH}
                    cellCount={pos.length}
                    cellSizeAndPositionGetter={cellSizeAndPositionGetter}
                    cellRenderer={({ index, key, style }) => {
                        const p = pos[index];

                        return (
                            <div key={key} style={style}>
                                {renderTile(p)}
                            </div>
                        );
                    }}
                    style={{ outline: "none", overflowX: "hidden" }}
                    verticalOverscanSize={300}
                />
            );
        }}
    </AutoSizer>;

    // pack rows
    const makeRowRenderer = (width: number): ListRowRenderer =>
        ({ index, key, style }) => {
            const pack = visiblePacks[index];
            const cells = packCellsMap.get(pack.id) || [];
            const { pos, totalH } = flowLayout(cells, width);

            return (
                <div key={key} style={style} className={styles.setContainer}>
                    <div className={styles.setTopContainer}>
                        <div
                            className={styles.setTopTile}
                            style={{
                                backgroundImage: `url(${pack.iconId
                                    ? resourceIdToPath(pack.iconId)
                                    : (window as any).constructCDNUrl("/content/packs/icons/DefaultTiled.png")
                                    })`
                            }}
                        />
                        <div className={styles.setTopText}>
                            {pack.name} Pack
                            <div className={styles.setGradient} />
                        </div>
                    </div>

                    <div className={styles.setDivider} />

                    <div className={styles.setContent} style={{ height: totalH }}>
                        <Collection
                            width={width}
                            height={totalH}
                            cellCount={pos.length}
                            cellSizeAndPositionGetter={({ index }) => {
                                const p = pos[index];

                                return { width: p.w, height: p.h, x: p.x, y: p.y };
                            }}
                            cellRenderer={({ index, key: ckey, style: cstyle }) => {
                                const p = pos[index];

                                return (
                                    <div key={ckey} style={cstyle}>
                                        {renderTile(p)}
                                    </div>
                                );
                            }}
                            style={{ outline: "none", overflowX: "hidden" }}
                        />
                    </div>
                </div>
            );
        };

    const renderPacksList = () => <AutoSizer>
        {({ width, height }) => {
            if (width !== listWidth) setListWidth(width);

            const rowHeights = visiblePacks.map((p) => {
                const cells = packCellsMap.get(p.id) || [];

                const { totalH } = flowLayout(cells, width);

                return PACK_HEADER_H + totalH;
            });

            return (
                <List
                    ref={listRef}
                    width={width}
                    height={height}
                    rowCount={visiblePacks.length}
                    rowHeight={({ index }) => rowHeights[index] || PACK_HEADER_H}
                    rowRenderer={makeRowRenderer(width)}
                    style={{ outline: "none", overflowX: "hidden" }}
                    overscanRowCount={2}
                />
            );
        }}
    </AutoSizer>;

    return (
        <div className={`${props.className ?? ""} ${styles.itemsContainer}`} style={props.style}>
            {mergedOptions.showBlooks ? (
                mergedOptions.showPacks ? renderPacksList() : renderFlatCollection()
            ) : null}
        </div>
    );
}
