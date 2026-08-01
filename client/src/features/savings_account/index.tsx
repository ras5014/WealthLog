import BudgetTracker from "./components/BudgetTracker";

export default function index() {
  return (
    <>
      <div className="grid gap-4 md:grid-cols-1 xl:grid-cols-3">
        <BudgetTracker />
      </div>

      <div className="mt-6"></div>

      <div className="mt-6"></div>
    </>
  );
}
