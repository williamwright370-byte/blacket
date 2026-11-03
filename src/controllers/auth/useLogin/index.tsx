import { useUser } from "@stores/UserStore";
import { useFriend } from "@stores/FriendStore";
import { localStorage } from "@functions/core/localStorage";

import { LoginResponse } from "./useLogin.d";

interface LoginDto {
    username: string;
    password: string;
    otpCode?: string;
    captchaToken: string;
}

export function useLogin() {
    const { setUser } = useUser();
    const { setFriends, setFriendedBy, setBlocked } = useFriend();

    const login = (dto: LoginDto) => new Promise<LoginResponse>((resolve, reject) => window.fetch2.post("/api/auth/login", dto)
        .then((res: LoginResponse) => {
            localStorage.set("token", res.data.token);

            Promise.all([
                window.fetch2.get("/api/users/me"),
                window.fetch2.get("/api/friends")
            ]).then(([me, friends]: Fetch2Response[]) => {
                setFriends(friends.data.friends);
                setFriendedBy(friends.data.friendedBy);
                setBlocked(friends.data.blocked);

                setUser(me.data);

                resolve(me);
            })
                .catch(reject);
        })
        .catch(reject));

    return { login };
}
