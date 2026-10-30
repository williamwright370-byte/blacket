import { NewsNewsPostEntity } from "@blacket/types";
import styles from "../news.module.scss";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { Markdown, Username } from "@components/index";

export default function Article({ post }: { post: NewsNewsPostEntity }) {
    const createdAt = new Date(post.createdAt);
    // const img = typeof post.image === "string" ? post.image : post.image && `${import.meta.env.VITE_CDN_URL}/users/${post.image.userId}/${post.image.uploadId}/${post.image.filename}`;


    return <article className={styles.articlePage}>
        <Helmet>
            <title>{`${post.title} | ${import.meta.env.VITE_INFORMATION_NAME}`}</title>
        </Helmet>

        <Link to="/news" className={styles.articleBack}>
            <i className="fas fa-arrow-left"/>
            Back to news
        </Link>

        <div className={styles.articleLayout}>
            <header className={styles.articleHeader}>
                <div className={styles.articleMeta}>
                    <Username user={post.author} />
                    <time dateTime={createdAt.toISOString()}>
                        {createdAt.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                    </time>
                </div>
                <h1>{post.title}</h1>
            </header>

            {/* uncomment + add buttons when upvote/downvote is implemented */}
            {/* <aside className={styles.articleSidebar}>
                <div className={styles.articleCover}>
                    {img && <img src={img} alt="" draggable={false} />}
                    <div className={styles.articleVotes}>
                        <span className={styles.postScoreUpvote} aria-label={`${post.votes.upvotes} upvotes`}>
                            <i className="fas fa-arrow-up" aria-hidden="true" />
                            {post.votes.upvotes.toLocaleString()}
                        </span>
                        <span className={styles.postScoreDownvote} aria-label={`${post.votes.downvotes} downvotes`}>
                            <i className="fas fa-arrow-down" aria-hidden="true" />
                            {post.votes.downvotes.toLocaleString()}
                        </span>
                    </div>
                </div>
            </aside> */}

            <div className={styles.articleContent}>
                <Markdown>{post.content}</Markdown>
                <footer className={styles.articleFooter}>
                    <Link to="/news" className={styles.articleBack}>
                        <i className="fas fa-arrow-left"/>
                        Back to news
                    </Link>
                </footer>
            </div>
            </div>
    </article>;
}
