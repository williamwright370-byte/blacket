import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { useUser } from "@stores/UserStore/index";
import { Post } from "./components";
import styles from "./news.module.scss";

import { NewsNewsPostEntity } from "@blacket/types";
import Article from "./components/Article";
import { PageHeader } from "../../components";

export default function News() {
    const [news, setNews] = useState<NewsNewsPostEntity[] | null>(null);
    const [error, setError] = useState(false);
    const { id } = useParams();
    const { user } = useUser();
    const userId = user?.id;

    useEffect(() => {
        if (!userId) return;

        let active = true;
        setNews(null);
        setError(false);

        window.fetch2.get("/api/news")
            .then((res) => {
                if (active) setNews(res.data);
            })
            .catch(() => {
                if (active) setError(true);
            });

        return () => {
            active = false;
        };
    }, [userId]);

    useEffect(() => {
        if (id) {
            window.scrollTo(0, 0);
        }
    });

    if (!user) return <Navigate to="/login" />;

    if (error) return <p className={styles.newsStatus} role="alert">Couldn't load this post! Please refresh and try again.</p>;
    if (!news) return <p className={styles.newsStatus} role="status">Loading...</p>;

    if (id) {
        const post = news.find((post) => String(post.id) === id);

        if (!post) return <div className={styles.newsStatus}>
            <p>This post does not exist.</p>
            <Link to="/news">Back to news</Link>
        </div>;

        return <Article post={post} />;
    }

    return (
        <>
            <PageHeader>News</PageHeader>
            {news.length === 0 && <p className={styles.newsStatus}>No news posts yet.</p>}
            <div className={styles.posts}>
                {news.map((post) => (
                    <Post
                        key={post.id}
                        post={post}
                    />
                ))}
            </div>
        </>
    );
}
