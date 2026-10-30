import { CSSProperties, memo, useCallback } from "react";
import { Link } from "react-router-dom";
import styles from "../sidebar.module.scss";

import { PageItemProps } from "../sidebar.d";

export default memo(function PageItem({ page, location, mentions, collapsed, onClick, ...props }: PageItemProps) {
    const handleClick = useCallback(() => {
        onClick?.();
    }, [onClick]);

    return (
        <Link
            data-active={location === page.link.slice(1)}
            className={styles.page}
            to={page.link}
            onClick={handleClick}
            title={collapsed ? page.text : undefined}
            {...props}
        >
            <i className={`${styles.pageIcon} ${page.icon}`} />
            <div
                className={styles.pageText}
                style={{ "--page-text-base-size": `${page.textSizeOverride || 20}px` } as CSSProperties}
            >
                {page.text}
            </div>

            {page.isChat && mentions > 0 && (
                <div className={styles.notificationIndicator} data-collapsed={collapsed}>
                    <div>{mentions}</div>
                </div>
            )}
        </Link>
    );
});
