import { createBrowserRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import MainLayout from "./layouts/MainLayout";

function PagePlaceholder({ title }: { title: string }) {
    return <div>{title}</div>;
}

const router = createBrowserRouter([
    {
        path: "/",
        Component: MainLayout,
        errorElement: <div>404 Not Found</div>,
        children: [
            {
                index: true,
                Component: () => <PagePlaceholder title="Dashboard" />,
            },
            {
                path: "savings-account",
                Component: () => <PagePlaceholder title="Savings Account" />,
            },
            {
                path: "credit-card",
                Component: () => <PagePlaceholder title="Credit Cards" />,
            },
            {
                path: "emis",
                Component: () => <PagePlaceholder title="EMIs" />,
            },
            {
                path: "mf-savings",
                Component: () => <PagePlaceholder title="MF & Savings" />,
            },
            {
                path: "budget-plan-ai",
                Component: () => <PagePlaceholder title="Budget Plan (AI)" />,
            },
        ]
    },
]);

export const App = () => {
    return <RouterProvider router={router} />;
};
