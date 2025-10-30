import { RefObject } from "react";
import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

import { ContextMenuStore, ContextMenu } from "./contextMenu.d";

const MOBILE_BREAKPOINT = 768;
const CONTEXT_MENU_PADDING = 10;
const CLOSE_ANIMATION_DELAY = 150;
const MOUSE_MOVE_THROTTLE = 16; // ~60fps
const DEBOUNCE_DELAY = 100;

export const useContextMenu = create<ContextMenuStore>()(
    subscribeWithSelector((set, get) => {
        const contextMenuRef = { current: null } as RefObject<HTMLDivElement>;

        const setContextMenu = (contextMenu: ContextMenu) => set({ contextMenu });

        const openContextMenu = (items: ContextMenu["items"]) => {
            if (!items || items.length === 0) return;

            const isMobile = typeof window !== "undefined" && window.innerWidth <= MOBILE_BREAKPOINT;

            if (isMobile) {
                set({
                    visible: true,
                    contextMenu: { items }
                });
                return;
            }

            const cursor = get().cursorPosition;
            setContextMenu({ items, x: cursor.x, y: cursor.y });
            set({ visible: true });

            requestAnimationFrame(() => {
                const menuElement = contextMenuRef.current;
                if (!menuElement) return;

                const rect = menuElement.getBoundingClientRect();
                const x = Math.min(cursor.x, window.innerWidth - rect.width - CONTEXT_MENU_PADDING);
                const y = Math.min(cursor.y, window.innerHeight - rect.height - CONTEXT_MENU_PADDING);

                const currentMenu = get().contextMenu;
                if (currentMenu && (currentMenu.x !== x || currentMenu.y !== y)) {
                    setContextMenu({ items, x, y });
                }
            });
        };

        const closeContextMenu = () => {
            set({ visible: false });
            setTimeout(() => {
                if (!get().visible) {
                    set({ contextMenu: null });
                }
            }, CLOSE_ANIMATION_DELAY);
        };

        const setVisible = (visible: boolean) => set({ visible });

        const updateCursorPosition = (x: number, y: number) => {
            set({ cursorPosition: { x, y } });
        };

        return {
            contextMenu: null,
            setContextMenu,
            openContextMenu,
            closeContextMenu,
            visible: false,
            setVisible,
            contextMenuRef,
            cursorPosition: { x: 0, y: 0 },
            updateCursorPosition
        };
    })
);

// Event listener management - should be initialized by a component
class ContextMenuEventManager {
    private static instance: ContextMenuEventManager | null = null;
    private cleanupFunctions: Array<() => void> = [];
    private lastMouseDownTime = 0;
    private throttleTimeout: number | null = null;

    private constructor() {
        this.setupEventListeners();
    }

    static initialize(): () => void {
        if (!ContextMenuEventManager.instance) {
            ContextMenuEventManager.instance = new ContextMenuEventManager();
        }
        return () => ContextMenuEventManager.cleanup();
    }

    static cleanup(): void {
        if (ContextMenuEventManager.instance) {
            ContextMenuEventManager.instance.destroy();
            ContextMenuEventManager.instance = null;
        }
    }

    private setupEventListeners(): void {
        if (typeof window === "undefined") return;

        const handleMouseMove = (e: MouseEvent) => {
            if (this.throttleTimeout) return;

            this.throttleTimeout = window.setTimeout(() => {
                this.throttleTimeout = null;
            }, MOUSE_MOVE_THROTTLE);

            const state = useContextMenu.getState();
            const timeSinceMouseDown = Date.now() - this.lastMouseDownTime;

            if (state.visible || timeSinceMouseDown < 1000) {
                state.updateCursorPosition(e.clientX, e.clientY);
            }
        };

        const handleMouseDown = (e: MouseEvent) => {
            this.lastMouseDownTime = Date.now();
            const state = useContextMenu.getState();

            if (state.visible && state.contextMenuRef?.current) {
                const menuElement = state.contextMenuRef.current;
                if (!menuElement.contains(e.target as Node)) {
                    state.closeContextMenu();
                }
            }
        };

        let debounceTimeout: NodeJS.Timeout | null = null;
        const handleScrollOrResize = () => {
            if (debounceTimeout) clearTimeout(debounceTimeout);

            debounceTimeout = setTimeout(() => {
                const state = useContextMenu.getState();
                if (state.visible) {
                    state.closeContextMenu();
                }
            }, DEBOUNCE_DELAY);
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                const state = useContextMenu.getState();
                if (state.visible) {
                    state.closeContextMenu();
                }
            }
        };

        window.addEventListener("mousemove", handleMouseMove, { passive: true });
        window.addEventListener("mousedown", handleMouseDown, { passive: true });
        window.addEventListener("scroll", handleScrollOrResize, { passive: true });
        window.addEventListener("resize", handleScrollOrResize, { passive: true });
        window.addEventListener("keydown", handleKeyDown);

        this.cleanupFunctions.push(
            () => window.removeEventListener("mousemove", handleMouseMove),
            () => window.removeEventListener("mousedown", handleMouseDown),
            () => window.removeEventListener("scroll", handleScrollOrResize),
            () => window.removeEventListener("resize", handleScrollOrResize),
            () => window.removeEventListener("keydown", handleKeyDown),
            () => {
                if (debounceTimeout) clearTimeout(debounceTimeout);
                if (this.throttleTimeout) clearTimeout(this.throttleTimeout);
            }
        );
    }

    private destroy(): void {
        this.cleanupFunctions.forEach(cleanup => cleanup());
        this.cleanupFunctions = [];
    }
}

// Export initialization function for use in a component (e.g., App.tsx)
export const initializeContextMenuEvents = ContextMenuEventManager.initialize;
