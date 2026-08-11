import Clans from "./index";

export default {
    path: "/clans",
    component: <Clans />,
    title: `Clans | ${import.meta.env.VITE_INFORMATION_NAME}`,
    description: "Manage and view clans in the game.",
    sidebar: true,
    topRight: []
} as BlacketRoute;
