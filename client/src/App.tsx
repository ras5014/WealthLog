import { createBrowserRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import MainLayout from "./layouts/MainLayout";
import CreditCardPage from "./features/credit_card";
import EmisPage from "./features/emis";
import { Toaster } from 'react-hot-toast'

function PagePlaceholder({ title }: { title: string }) {
    return <div>{title}</div>;
}

import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
const queryClient = new QueryClient()

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
                Component: CreditCardPage,
            },
            {
                path: "emis",
                Component: EmisPage,
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
    return (
        <>
            <Toaster />
            <QueryClientProvider client={queryClient}>
                <RouterProvider router={router} />
                <ReactQueryDevtools initialIsOpen={false} />
            </QueryClientProvider>
        </>

    );
};
