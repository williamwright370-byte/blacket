import { Navigate } from "react-router-dom";
import { TypeAnimation } from "react-type-animation";
import { useUser } from "@stores/UserStore/index";
import styles from "./home.module.scss";
import { Button } from "@components/index";

export default function Home() {
    const { user } = useUser();
    if (user) return <Navigate to="/dashboard" replace />;

    return (
        <>
            <div className={styles.heroSection}>
                <div className={styles.heroContainer}>
                    <div className={styles.heroLeft}>
                        <div className={styles.heroTitle}>
                            {import.meta.env.VITE_INFORMATION_NAME.toUpperCase()}
                        </div>

                        <div className={styles.heroText}>
                            The #1 community driven{" "}
                            <TypeAnimation
                                sequence={[
                                    "trading",
                                    2000,
                                    "collecting",
                                    2000,
                                    "multiplayer",
                                    2000,
                                    "RNG",
                                    2000
                                ]}
                                wrapper="span"
                                speed={50}
                                repeat={Infinity}
                            />

                            <br />

                            web-game for everyone!
                        </div>

                        <div className={styles.heroButtons}>
                            <Button.ClearButton
                                to="/register"
                                className={styles.heroButton}
                            >Register</Button.ClearButton>
                        </div>
                    </div>

                    <div className={styles.heroRight}>
                        <div className={styles.zoeyPlatform}>
                            <div className={styles.zoeyImage}>
                                <img src="https://f005.backblazeb2.com/file/blacket-v2-cdn/uploads/9841625/9lhfyo18l/1772698132044-image.png" />
                            </div>


                            <div className={styles.platform}>
                                <div className={styles.platformTop} />
                                <div className={styles.platformBottom} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
