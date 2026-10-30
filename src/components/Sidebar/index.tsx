import { useState, useRef, useEffect, useLayoutEffect, memo, useMemo, useCallback, MouseEvent as ReactMouseEvent } from "react";
import { useLocation, Link } from "react-router-dom";
import { useUser } from "@stores/UserStore/index";
import { useChat } from "@stores/ChatStore/index";
import { useLocalStorageState } from "@functions/core/hooks/useLocalStorageState";
import { Button } from "@components/index";
import { PageItem, BottomPageItem } from "./components/index";
import styles from "./sidebar.module.scss";

import { Page } from "./sidebar.d";
import { PermissionTypeEnum } from "@blacket/types";

const MIN_SIDEBAR_WIDTH = 72;
const MAX_SIDEBAR_WIDTH = 250;
const COLLAPSE_SIDEBAR_WIDTH = 110;
const DEFAULT_SIDEBAR_WIDTH = 220;
const MIN_TEXT_SCALE = 0.8;
const MAX_TEXT_SCALE = 1;

const clampSidebarWidth = (width: number) => Math.min(MAX_SIDEBAR_WIDTH, Math.max(MIN_SIDEBAR_WIDTH, width));

// keeps scale at 1 at the default width so the current look is unchanged until the user resizes
const getSidebarTextScale = (width: number) => {
    if (width <= COLLAPSE_SIDEBAR_WIDTH) return MIN_TEXT_SCALE;
    if (width <= DEFAULT_SIDEBAR_WIDTH) return MIN_TEXT_SCALE + (width - COLLAPSE_SIDEBAR_WIDTH) / (DEFAULT_SIDEBAR_WIDTH - COLLAPSE_SIDEBAR_WIDTH) * (1 - MIN_TEXT_SCALE);

    return 1 + (width - DEFAULT_SIDEBAR_WIDTH) / (MAX_SIDEBAR_WIDTH - DEFAULT_SIDEBAR_WIDTH) * (MAX_TEXT_SCALE - 1);
};

const PAGES: { left: Page[]; bottom: Page[] } = {
    left: [
        {
            icon: "fas fa-home",
            text: "Dashboard",
            link: "/dashboard"
        },
        {
            icon: "fas fa-trophy",
            text: "Leaderboard",
            link: "/leaderboard",
            textSizeOverride: 18
        },
        {
            icon: "fas fa-comments",
            text: "Chat",
            link: "/chat",
            isChat: true
        },
        {
            icon: "fas fa-scale-balanced",
            text: "Trading Plaza",
            link: "/trading-plaza",
            textSizeOverride: 18
        },
        {
            icon: "fas fa-swords",
            text: "Clans",
            link: "/clans"
        },
        {
            icon: "fas fa-store",
            text: "Market",
            link: "/market"
        },
        {
            icon: "fas fa-box-open",
            text: "Inventory",
            link: "/inventory"
        },
        {
            icon: "fas fa-building-columns",
            text: "Auction House",
            link: "/auction-house",
            textSizeOverride: 17
        },
        {
            icon: "fas fa-newspaper",
            text: "News",
            link: "/news"
        },
        {
            icon: "fas fa-cog",
            text: "Settings",
            link: "/settings"
        }
    ],
    bottom: [
        {
            icon: "fas fa-heart",
            text: "Credits",
            link: "/credits"
        },
        {
            icon: "fab fa-discord",
            text: "Discord",
            link: "/discord"
        },
        {
            icon: "fab fa-git-alt",
            text: "Codeberg",
            link: "/codeberg"
        },
        {
            icon: "fab fa-youtube",
            text: "YouTube",
            link: "/youtube"
        },
        {
            icon: "fab fa-x-twitter",
            text: "X",
            link: "/x"
        }
    ]
};

const STAFF_PAGES: Page[] = [
    {
        icon: "fas fa-wrench",
        text: "Staff Panel",
        link: "/staff"
    },
    {
        icon: "fas fa-user-gear",
        text: "User Manager",
        link: "/staff/users",
        permission: PermissionTypeEnum.MUTE_USERS,
        textSizeOverride: 18
    },
    {
        icon: "fas fa-flag",
        text: "Report Manager",
        link: "/staff/reports",
        permission: PermissionTypeEnum.MANAGE_REPORTS,
        textSizeOverride: 16
    }
];

export default memo(function Sidebar() {
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);

    const [sidebarWidth, setSidebarWidth] = useLocalStorageState<number>("sidebar:width", DEFAULT_SIDEBAR_WIDTH);
    const [collapsed, setCollapsed] = useState<boolean>(sidebarWidth <= COLLAPSE_SIDEBAR_WIDTH);
    const [resizing, setResizing] = useState<boolean>(false);

    const resizeStartRef = useRef<{ x: number; width: number } | null>(null);

    const location = useLocation().pathname.split("/")[1];

    const { user } = useUser();
    const { mentions } = useChat();

    const applyCssSidebarWidth = useCallback((width: number) => {
        document.documentElement.style.setProperty("--sidebar-width", `${width}px`);
        document.documentElement.style.setProperty("--sidebar-text-scale", `${getSidebarTextScale(width)}`);
    }, []);

    useLayoutEffect(() => {
        applyCssSidebarWidth(sidebarWidth);
        setCollapsed(sidebarWidth <= COLLAPSE_SIDEBAR_WIDTH);
    }, [sidebarWidth, applyCssSidebarWidth]);

    const handleResizeStart = useCallback((e: ReactMouseEvent) => {
        e.preventDefault();

        resizeStartRef.current = { x: e.clientX, width: sidebarWidth };
        setResizing(true);
    }, [sidebarWidth]);

    useEffect(() => {
        if (!resizing) return;

        const previousUserSelect = document.body.style.userSelect;
        const previousCursor = document.body.style.cursor;

        document.body.style.userSelect = "none";
        document.body.style.cursor = "ew-resize";

        const handleMouseMove = (e: MouseEvent) => {
            const start = resizeStartRef.current;
            if (!start) return;

            const width = clampSidebarWidth(start.width + (e.clientX - start.x));

            applyCssSidebarWidth(width);
            setCollapsed(width <= COLLAPSE_SIDEBAR_WIDTH);
        };

        const handleMouseUp = (e: MouseEvent) => {
            const start = resizeStartRef.current;

            if (start) setSidebarWidth(clampSidebarWidth(start.width + (e.clientX - start.x)));

            resizeStartRef.current = null;
            setResizing(false);
        };

        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);

        return () => {
            document.body.style.userSelect = previousUserSelect;
            document.body.style.cursor = previousCursor;

            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
        };
    }, [resizing, applyCssSidebarWidth, setSidebarWidth]);

    const handleMobileSidebarOpen = useCallback(() => {
        setMobileSidebarOpen(true);
    }, []);

    const handleMobileSidebarClose = useCallback(() => {
        setMobileSidebarOpen(false);
    }, []);

    const hasStaffPermission = useMemo(() =>
        user?.hasPermission(PermissionTypeEnum.VIEW_AUDIT) || false,
        [user]
    );

    const pageScrollerHeight = useMemo(() =>
        hasStaffPermission ? "60%" : undefined,
        [hasStaffPermission]
    );

    if (!user) return null;

    return (
        <>
            <div className={styles.sidebar} data-collapsed={collapsed}>
                {/* <Link className={styles.header} to="/dashboard">
                    {import.meta.env.VITE_INFORMATION_NAME}
                </Link> */}

                <div className={styles.pageScroller} style={{ height: pageScrollerHeight }}>
                    {PAGES.left.map((page, index) => (
                        <PageItem
                            key={index}
                            page={page}
                            location={location}
                            mentions={page.isChat ? mentions : 0}
                            collapsed={collapsed}
                        />
                    ))}
                </div>

                {hasStaffPermission && (
                    <div className={styles.pageScrollerStaff}>
                        {STAFF_PAGES.map((page, index) => (
                            <PageItem
                                key={index}
                                page={page}
                                location={location}
                                mentions={0}
                                collapsed={collapsed}
                            />
                        ))}
                    </div>
                )}

                <div className={styles.bottom}>
                    {!collapsed && (
                        <div className={styles.bottomItems}>
                            {PAGES.bottom.map((page, index) => (
                                <BottomPageItem
                                    key={index}
                                    page={page}
                                />
                            ))}
                        </div>
                    )}

                    <Button.GenericButton
                        to="/store"
                        icon="fas fa-cart-shopping"
                        className={styles.visitStoreButton}
                        backgroundColor="#2b22c2"
                    >
                        {!collapsed && "Store"}
                    </Button.GenericButton>
                </div>

                <div
                    className={styles.resizeHandle}
                    data-resizing={resizing}
                    onMouseDown={handleResizeStart}
                />
            </div>

            <i
                className={`${styles.mobileHamburgerIcon} fas fa-bars`}
                onClick={handleMobileSidebarOpen}
            />

            {mobileSidebarOpen && (
                <div
                    className={styles.mobileSidebarModal}
                    onClick={handleMobileSidebarClose}
                />
            )}

            <div className={styles.mobileSidebar} data-open={mobileSidebarOpen}>
                <i
                    className={`${styles.mobileCloseIcon} fas fa-times`}
                    onClick={handleMobileSidebarClose}
                />

                {PAGES.left.map((page, index) => (
                    <PageItem
                        key={index}
                        page={page}
                        location={location}
                        mentions={page.isChat ? mentions : 0}
                        onClick={handleMobileSidebarClose}
                    />
                ))}

                {hasStaffPermission && STAFF_PAGES.map((page, index) => (
                    <PageItem
                        key={index}
                        page={page}
                        location={location}
                        mentions={0}
                        onClick={handleMobileSidebarClose}
                    />
                ))}

                <div className={styles.bottom}>
                    <div className={styles.bottomItems}>
                        {PAGES.bottom.map((page, index) => (
                            <BottomPageItem
                                key={index}
                                page={page}
                                onClick={handleMobileSidebarClose}
                            />
                        ))}
                    </div>

                    <Button.GenericButton
                        to="/store"
                        icon="fas fa-cart-shopping"
                        className={styles.visitStoreButton}
                        backgroundColor="#2b22c2"
                        onClick={handleMobileSidebarClose}
                    >
                        Store
                    </Button.GenericButton>
                </div>
            </div>
        </>
    );
});
