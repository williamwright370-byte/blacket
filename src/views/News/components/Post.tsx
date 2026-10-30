import { Link } from "react-router-dom";
import { Markdown, Username } from "@components/index";
import styles from "../news.module.scss";

import { PostProps } from "../news.d";

export default function Post({ post, ...props }: PostProps) {
    const image = typeof post.image === "string"
        ? post.image
        : post.image && `${import.meta.env.VITE_CDN_URL}/users/${post.image.userId}/${post.image.uploadId}/${post.image.filename}`;

    return (
        <div className={styles.postContainer} {...props}>
            <div className={styles.postTopContainer}>
                <img
                    className={styles.postImage}
                    draggable={false}
                    src={image || window.errorImage}
                    alt=""
                />
                <div className={styles.postDate}>
                    <i className="fas fa-calendar-alt" />
                    {new Date(post.createdAt).toLocaleDateString()}
                </div>
                <div className={styles.postAuthor}>
                    <Username user={post.author} />
                    <i className="fas fa-user" />
                </div>
            </div>

            <Link to={`/news/${post.id}`} className={styles.postTitle}>
                {post.title}
            </Link>
            <div className={styles.postDivider} />

            <div className={styles.postBottomContainer}>
                <div className={styles.postContent}>
                    <Markdown>
                        {post.content}
                    </Markdown>
                </div>

                <div className={styles.postScoringContainer}>
                    <div className={styles.postScoreUpvote}>
                        <i className="fas fa-arrow-up" />
                        {post.votes.upvotes.toLocaleString()}
                    </div>

                    <div className={styles.postScoreDownvote}>
                        <i className="fas fa-arrow-down" />
                        {post.votes.downvotes.toLocaleString()}
                    </div>
                </div>

                <div className={styles.postReadMoreText}>
                    Read more...
                </div>
            </div>
        </div>
    );
}
