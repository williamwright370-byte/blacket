import { Link } from "react-router-dom";
import { Blook, Textfit, Username } from "@components/index";
import { useUser } from "@stores/UserStore/index";
import cardinalToOrdinal from "@functions/core/cardinalToOrdinal";
import styles from "../leaderboard.module.scss";

import { type BigPlacementProps, PlacementType } from "../leaderboard.d";

export default function BigPlacement({ type, placement, user }: BigPlacementProps) {
    const { getUserAvatarPath } = useUser();
    const rank = `${placement}${cardinalToOrdinal(placement)}`;
    const score = (user[type] ?? 0).toLocaleString();
    const icon = type === PlacementType.DIAMONDS ? "diamond" : "experience";

    return (
        <Link
            to={`/dashboard?name=${encodeURIComponent(user.username)}`}
            className={styles.podiumPlacement}
            data-placement={placement}
            draggable={false}
        >
            <div className={styles.podiumTop}>
                <Blook
                    className={styles.podiumAvatar}
                    src={getUserAvatarPath(user)}
                    draggable={false}
                    custom={!!user.customAvatar}
                    shiny={user.avatar?.shiny}
                />
                <span className={styles.podiumTrophy}>
                    <i className="fas fa-trophy" />
                </span>
            </div>

            <div className={styles.podiumDetails}>
                <Textfit
                    className={styles.podiumUsername}
                    min={1}
                    max={1000}
                    mode="single"
                >
                    <Username user={user} />
                </Textfit>
                <div className={styles.podiumRank}>{rank}</div>
                <Textfit
                    className={styles.podiumScore}
                    min={1}
                    max={1000}
                    mode="single"
                >
                    <span className={styles.podiumScoreContent}>
                        <img
                            src={window.constructCDNUrl(`/content/${icon}.png`)}
                            draggable={false}
                        />
                        {score}
                    </span>
                </Textfit>
            </div>
        </Link>
    );
}
