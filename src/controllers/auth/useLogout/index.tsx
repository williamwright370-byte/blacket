import { useUser } from "@stores/UserStore";
import { useSocket } from "@stores/SocketStore";
import { useFriend } from "@stores/FriendStore";
import { localStorage } from "@functions/core/localStorage";

export function useLogout() {
    const { setUser } = useUser();
    const { disconnectSocket } = useSocket();
    const { setFriends, setFriendedBy, setBlocked } = useFriend();

    const logout = () => new Promise<Fetch2Response>((resolve, reject) => window.fetch2.delete("/api/auth/logout", {})
        .then((res: Fetch2Response) => {
            localStorage.remove("token");

            disconnectSocket();

            setFriends([]);
            setFriendedBy([]);
            setBlocked([]);

            setUser(null);

            resolve(res);
        })
        .catch(reject));

    return { logout };
}
