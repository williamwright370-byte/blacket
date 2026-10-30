import { HTMLAttributes } from "react";
import { PermissionTypeEnum } from "@blacket/types";

export interface Page {
    icon: string;
    text: string;
    link: string;
    permission?: PermissionTypeEnum;
    textSizeOverride?: number;
    isChat?: boolean;
}

export interface PageItemProps extends HTMLAttributes<HTMLAnchorElement> {
    page: Page;
    location: string;
    mentions: number;
    collapsed?: boolean;
    onClick?: () => void;
}

export interface BottomPageItemProps {
    page: Page;
    onClick?: () => void;
}
