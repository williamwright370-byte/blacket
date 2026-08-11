import { FormEvent, useCallback, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useUser } from "@stores/UserStore/index";
import styles from "./clans.module.scss";

interface ClanSummary {
    id: number;
    name: string;
    tag: string;
    color: string;
    memberCount: number;
    memberCapacity: number;
    level?: number;
    isFull?: boolean;
}

interface ClanMember {
    user: { id: string; username: string };
    roles: { name: string };
}

interface MyClan extends ClanSummary {
    description: string;
    lifetimeDonations: number;
    members: { data: ClanMember[] };
}

interface JoinRequest {
    id: number;
    clan: ClanSummary;
}

interface IncomingRequest {
    id: number;
    user: { id: string; username: string };
}

interface Donation {
    id: number;
    amount: number;
    createdAt: string;
    user: { id: string; username: string };
}

interface Contribution {
    position: number;
    lifetimeContribution: number;
    user: { id: string; username: string };
    role: { name: string };
}

const getErrorMessage = (error: unknown) => {
    const response = error as Fetch2Response | undefined;
    const message = response?.data?.message;
    return Array.isArray(message) ? message.join(", ") : message || "Something went wrong.";
};

export default function Clans() {
    const { user } = useUser();
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState("");
    const [myClan, setMyClan] = useState<MyClan | null>(null);
    const [clans, setClans] = useState<ClanSummary[]>([]);
    const [requests, setRequests] = useState<JoinRequest[]>([]);
    const [incomingRequests, setIncomingRequests] = useState<IncomingRequest[]>([]);
    const [canManageRequests, setCanManageRequests] = useState(false);
    const [donations, setDonations] = useState<Donation[]>([]);
    const [contributions, setContributions] = useState<Contribution[]>([]);
    const [viewedClan, setViewedClan] = useState<MyClan | null>(null);
    const [search, setSearch] = useState("");
    const [tagSearch, setTagSearch] = useState("");
    const [name, setName] = useState("");
    const [tag, setTag] = useState("");
    const [description, setDescription] = useState("");
    const [color, setColor] = useState("#ffffff");
    const [donationAmount, setDonationAmount] = useState("");

    const loadClanDetails = async (clanId: number) => {
        const [donationResponse, contributionResponse] = await Promise.all([
            window.fetch2.get(`/api/clans/${clanId}/donations`),
            window.fetch2.get(`/api/clans/${clanId}/contributions`)
        ]);
        setDonations(donationResponse.data.data);
        setContributions(contributionResponse.data.data);

        try {
            const requestResponse = await window.fetch2.get(`/api/clans/${clanId}/join-requests`);
            setIncomingRequests(requestResponse.data.data);
            setCanManageRequests(true);
        } catch (error) {
            if ((error as Fetch2Response).status === 403) {
                setIncomingRequests([]);
                setCanManageRequests(false);
            } else throw error;
        }
    };

    const loadPage = useCallback(async (nameQuery = "", tagQuery = "") => {
        setLoading(true);
        setMessage("");

        try {
            const response = await window.fetch2.get("/api/clans/me");
            setMyClan(response.data);
            setClans([]);
            setRequests([]);
            await loadClanDetails(response.data.id);
        } catch (error) {
            const response = error as Fetch2Response;
            if (response.status !== 404) {
                setMessage(getErrorMessage(error));
                setLoading(false);
                return;
            }

            setMyClan(null);
            try {
                const params = new URLSearchParams();
                if (nameQuery.trim()) params.set("name", nameQuery.trim());
                if (tagQuery.trim()) params.set("tag", tagQuery.trim());
                const queryString = params.size ? `?${params.toString()}` : "";
                const [clanResponse, requestResponse] = await Promise.all([
                    window.fetch2.get(`/api/clans${queryString}`),
                    window.fetch2.get("/api/clans/join-requests/me")
                ]);
                setClans(clanResponse.data.data);
                setRequests(requestResponse.data);
            } catch (discoveryError) {
                setMessage(getErrorMessage(discoveryError));
            }
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (user) loadPage();
    }, [loadPage, user]);

    if (!user) return <Navigate to="/login" />;

    const createClan = async (event: FormEvent) => {
        event.preventDefault();
        setBusy(true);
        setMessage("");

        try {
            const response = await window.fetch2.post("/api/clans", {
                name,
                tag,
                description,
                color
            });
            setMyClan(response.data);
            setName("");
            setTag("");
            setDescription("");
            await loadClanDetails(response.data.id);
        } catch (error) {
            setMessage(getErrorMessage(error));
        } finally {
            setBusy(false);
        }
    };

    const requestToJoin = async (clan: ClanSummary) => {
        setBusy(true);
        setMessage("");
        try {
            await window.fetch2.post(`/api/clans/${clan.id}/join-requests`, {});
            setMessage(`Join request sent to ${clan.name}.`);
            await loadPage(search, tagSearch);
        } catch (error) {
            setMessage(getErrorMessage(error));
        } finally {
            setBusy(false);
        }
    };

    const cancelRequest = async (request: JoinRequest) => {
        setBusy(true);
        setMessage("");
        try {
            await window.fetch2.delete(`/api/clans/join-requests/${request.id}`, {});
            setMessage(`Canceled request to ${request.clan.name}.`);
            await loadPage(search, tagSearch);
        } catch (error) {
            setMessage(getErrorMessage(error));
        } finally {
            setBusy(false);
        }
    };

    const submitSearch = (event: FormEvent) => {
        event.preventDefault();
        setViewedClan(null);
        loadPage(search, tagSearch);
    };

    const viewClan = async (clanId: number) => {
        setBusy(true);
        setMessage("");
        try {
            const response = await window.fetch2.get(`/api/clans/${clanId}`);
            setViewedClan(response.data);
        } catch (error) {
            setMessage(getErrorMessage(error));
        } finally {
            setBusy(false);
        }
    };

    const findByTag = async () => {
        if (!tagSearch.trim()) return;
        setBusy(true);
        setMessage("");
        try {
            const response = await window.fetch2.get(`/api/clans/tag/${encodeURIComponent(tagSearch.trim())}`);
            setViewedClan(response.data);
        } catch (error) {
            setViewedClan(null);
            setMessage(getErrorMessage(error));
        } finally {
            setBusy(false);
        }
    };

    const donate = async (event: FormEvent) => {
        event.preventDefault();
        if (!myClan) return;
        setBusy(true);
        setMessage("");
        try {
            await window.fetch2.post("/api/clans/me/donations", { amount: Number(donationAmount) });
            setDonationAmount("");
            setMessage("Donation sent.");
            await loadPage();
        } catch (error) {
            setMessage(getErrorMessage(error));
        } finally {
            setBusy(false);
        }
    };

    const resolveRequest = async (requestId: number, action: "accept" | "reject") => {
        if (!myClan) return;
        setBusy(true);
        setMessage("");
        try {
            await window.fetch2.post(`/api/clans/${myClan.id}/join-requests/${requestId}/${action}`, {});
            setMessage(`Join request ${action}ed.`);
            await loadPage();
        } catch (error) {
            setMessage(getErrorMessage(error));
        } finally {
            setBusy(false);
        }
    };

    return (
        <main className={styles.page}>
            <h1>Clans</h1>
            {message && <p className={styles.message} role="status">{message}</p>}

            {loading ? <p>Loading clans...</p> : myClan ? (
                <section className={styles.section}>
                    <div className={styles.clanTitle}>
                        <span className={styles.tag} style={{ borderColor: myClan.color }}>[{myClan.tag}]</span>
                        <h2>{myClan.name}</h2>
                    </div>
                    {myClan.description && <p>{myClan.description}</p>}
                    <p>Level {myClan.level} · {myClan.memberCount}/{myClan.memberCapacity} members · {myClan.lifetimeDonations.toLocaleString()} donated</p>

                    <form className={styles.form} onSubmit={donate}>
                        <input
                            type="number"
                            min="1"
                            max="1000000000"
                            step="1"
                            value={donationAmount}
                            onChange={(event) => setDonationAmount(event.target.value)}
                            placeholder="Token amount"
                            required
                        />
                        <button disabled={busy} type="submit">Donate tokens</button>
                        <button disabled={busy} type="button" onClick={() => loadPage()}>Refresh</button>
                    </form>

                    <h3>Members</h3>
                    <ul className={styles.members}>
                        {myClan.members.data.map((member) => (
                            <li key={member.user.id}>
                                <span>{member.user.username}</span>
                                <span>{member.roles.name}</span>
                            </li>
                        ))}
                    </ul>

                    <h3>Contributions</h3>
                    <ul className={styles.members}>
                        {contributions.map((entry) => (
                            <li key={entry.user.id}>
                                <span>#{entry.position} {entry.user.username} ({entry.role.name})</span>
                                <span>{entry.lifetimeContribution.toLocaleString()}</span>
                            </li>
                        ))}
                    </ul>

                    <h3>Recent donations</h3>
                    <ul className={styles.members}>
                        {donations.map((donation) => (
                            <li key={donation.id}>
                                <span>{donation.user.username}</span>
                                <span>{donation.amount.toLocaleString()}</span>
                            </li>
                        ))}
                        {donations.length === 0 && <li>No donations yet.</li>}
                    </ul>

                    {canManageRequests && (
                        <>
                            <h3>Join requests</h3>
                            {incomingRequests.map((request) => (
                                <div className={styles.row} key={request.id}>
                                    <span>{request.user.username}</span>
                                    <div className={styles.buttons}>
                                        <button disabled={busy} type="button" onClick={() => resolveRequest(request.id, "accept")}>Accept</button>
                                        <button disabled={busy} type="button" onClick={() => resolveRequest(request.id, "reject")}>Reject</button>
                                    </div>
                                </div>
                            ))}
                            {incomingRequests.length === 0 && <p>No pending join requests.</p>}
                        </>
                    )}
                </section>
            ) : (
                <>
                    <section className={styles.section}>
                        <h2>Create a clan</h2>
                        <form className={styles.form} onSubmit={createClan}>
                            <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Clan name" minLength={2} maxLength={32} required />
                            <input value={tag} onChange={(event) => setTag(event.target.value.toUpperCase())} placeholder="Tag" minLength={2} maxLength={4} pattern="[A-Za-z0-9]{2,4}" required />
                            <input value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Description (optional)" maxLength={500} />
                            <input type="color" value={color} onChange={(event) => setColor(event.target.value)} aria-label="Clan color" />
                            <button disabled={busy} type="submit">Create clan</button>
                        </form>
                    </section>

                    {requests.length > 0 && (
                        <section className={styles.section}>
                            <h2>Pending requests</h2>
                            {requests.map((request) => (
                                <div className={styles.row} key={request.id}>
                                    <span>[{request.clan.tag}] {request.clan.name}</span>
                                    <button disabled={busy} type="button" onClick={() => cancelRequest(request)}>Cancel</button>
                                </div>
                            ))}
                        </section>
                    )}

                    <section className={styles.section}>
                        <h2>Find a clan</h2>
                        <form className={styles.form} onSubmit={submitSearch}>
                            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Name" />
                            <input value={tagSearch} onChange={(event) => setTagSearch(event.target.value.toUpperCase())} placeholder="Exact tag" maxLength={4} />
                            <button disabled={busy} type="submit">Search</button>
                            <button disabled={busy || !tagSearch.trim()} type="button" onClick={findByTag}>Look up tag</button>
                        </form>

                        <div className={styles.results}>
                            {clans.map((clan) => (
                                <div className={styles.row} key={clan.id}>
                                    <div>
                                        <strong style={{ color: clan.color }}>[{clan.tag}]</strong> {clan.name}
                                        <small>Level {clan.level} · {clan.memberCount}/{clan.memberCapacity} members</small>
                                    </div>
                                    <div className={styles.buttons}>
                                        <button disabled={busy} type="button" onClick={() => viewClan(clan.id)}>View</button>
                                        <button disabled={busy || clan.isFull} type="button" onClick={() => requestToJoin(clan)}>
                                            {clan.isFull ? "Full" : "Request to join"}
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {clans.length === 0 && <p>No clans found.</p>}
                        </div>
                    </section>

                    {viewedClan && (
                        <section className={styles.section}>
                            <div className={styles.clanTitle}>
                                <span className={styles.tag} style={{ borderColor: viewedClan.color }}>[{viewedClan.tag}]</span>
                                <h2>{viewedClan.name}</h2>
                            </div>
                            <p>{viewedClan.description || "No description."}</p>
                            <p>Level {viewedClan.level} · {viewedClan.memberCount}/{viewedClan.memberCapacity} members</p>
                            <h3>Members</h3>
                            <ul className={styles.members}>
                                {viewedClan.members.data.map((member) => (
                                    <li key={member.user.id}>
                                        <span>{member.user.username}</span>
                                        <span>{member.roles.name}</span>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}
                </>
            )}
        </main>
    );
}
