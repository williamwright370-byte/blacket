import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useLoading } from "@stores/LoadingStore/index";
import { useModal } from "@stores/ModalStore/index";
import { useUser } from "@stores/UserStore/index";
import { useCachedUser } from "@stores/CachedUserStore/index";
import { useLeaderboard as useLeaderboardStore } from "@stores/LeaderboardStore/index";
import { useLeaderboard as useLeaderboardController } from "@controllers/leaderboard/useLeaderboard/index";
import { MiniNavbar, Modal } from "@components/index";
import { BigPlacement, LittlePlacement } from "./components";
import styles from "./leaderboard.module.scss";

import { PlacementType } from "./leaderboard.d";

export default function Leaderboard() {
    const { setLoading } = useLoading();
    const { createModal } = useModal();
    const { user } = useUser();
    const { addCachedUser, getCachedUser } = useCachedUser();

    if (!user) return <Navigate to="/login" />;

    const { leaderboard, sortBy, setSortBy } = useLeaderboardStore();

    const { getLeaderboard } = useLeaderboardController();

    useEffect(() => {
        if (!user) {
            return;
        }

        const addUsers = async () => {
            if (!leaderboard) return;

            await Promise.all([
                ...leaderboard.diamonds.map(
                    async (u) => await addCachedUser(u)
                ),
                ...leaderboard.experience.map(
                    async (u) => await addCachedUser(u)
                )
            ]);
        };

        if (leaderboard) addUsers();
        else {
            setLoading("Loading leaderboard");
            getLeaderboard()
                .catch((err: Fetch2Response) =>
                    createModal(
                        <Modal.ErrorModal onClick={() => history.back()}>
                            {err.data.message}
                        </Modal.ErrorModal>
                    )
                )
                .finally(() => setLoading(false));
        }
    }, [leaderboard, user]);

    if (!user) {
        return <Navigate to="/login" />;
    }

    const standings =
        leaderboard?.[
            sortBy == PlacementType.DIAMONDS ? "diamonds" : "experience"
        ];

    if (leaderboard)
        return (
            <div className={styles.otherStandings}>
                <div className={styles.podiumSection}>
                    <MiniNavbar
                        items={[
                            {
                                text: "Diamonds",
                                icon: "fas fa-gem",
                                active: sortBy === PlacementType.DIAMONDS,
                                onClick: () =>
                                    setSortBy(PlacementType.DIAMONDS)
                            },
                            {
                                text: "Experience",
                                icon: "fas fa-star",
                                active: sortBy === PlacementType.EXPERIENCE,
                                onClick: () =>
                                    setSortBy(PlacementType.EXPERIENCE)
                            }
                        ]}
                    />

                    <div className={styles.podiumViewport}>
                        <div className={styles.podium} role="group">
                            {standings?.slice(0, 3).map((id, idx) => {
                                const user = getCachedUser(id);

                                return (
                                    user && (
                                        <BigPlacement
                                            key={id}
                                            type={sortBy}
                                            placement={(idx + 1) as 1 | 2 | 3}
                                            user={user}
                                        />
                                    )
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className={styles.otherTopThreeStandings}>
                    {standings?.slice(3).map((id, idx) => {
                        const user = getCachedUser(id);

                        return (
                            user && (
                                <LittlePlacement
                                    key={id}
                                    type={sortBy}
                                    placement={idx + 4}
                                    user={user}
                                />
                            )
                        );
                    })}
                </div>
            </div>
        );
}
