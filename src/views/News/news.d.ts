import { NewsNewsPostEntity } from "@blacket/types";
import { HTMLAttributes } from "react";

export interface PostProps extends HTMLAttributes<HTMLDivElement> {
    post: NewsNewsPostEntity;
}
