import { createBrowserRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import MainLayout from "./layouts/MainLayout";

const router = createBrowserRouter([
    {
        path: "/",
        Component: MainLayout,
        errorElement: <div>404 Not Found</div>,
        children: [
            {
                index: true,
                Component: () => <div>Dashboard</div>,
            },
            {
                path: "credit-card",
                Component: () => <div>Credit Card</div>,
            }
        ]
    },
]);

export const App = () => {
    return <RouterProvider router={router} />;
};