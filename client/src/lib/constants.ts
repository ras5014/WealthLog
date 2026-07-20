export const BANK_OPTIONS = [
  "ALL BANKS",
  "ICICI CORAL",
  "ICICI AMZNPAY",
] as const;

export const EMI_BANK_OPTIONS = [
  "ICICI_CORAL",
  "ICICI_AMZNPAY",
  "IDFC Bank",
] as const;

export const CREDIT_CARD_TRANSACTIONS_PER_PAGE = 10;

export const TRANSACTION_CATEGORIES = [
  "Food & Dining",
  "Groceries",
  "Travel",
  "Fuel",
  "Shopping",
  "Bills & Utilities",
  "Entertainment",
  "Health",
  "Education",
  "Rent & Housing",
  "Insurance",
  "Investments",
  "Fees & Charges",
  "EMI",
  "Credit/Refund",
  "Cash Withdrawal",
  "Transfers",
  "Other",
] as const;

export const BUDGET_GROUPS = [
  {
    name: "Essentials",
    categories: [
      "Groceries",
      "Fuel",
      "Bills & Utilities",
      "Health",
      "Education",
      "Rent & Housing",
      "Insurance",
      "EMI",
      "Fees & Charges",
    ],
  },
  {
    name: "Entertainment",
    categories: [
      "Food & Dining",
      "Travel",
      "Shopping",
      "Entertainment",
      "Cash Withdrawal",
      "Other",
    ],
  },
] as const;

export type BudgetGroupName = (typeof BUDGET_GROUPS)[number]["name"];

export const CATEGORY_TO_BUDGET_GROUP = BUDGET_GROUPS.reduce(
  (groups, group) => {
    for (const category of group.categories) {
      groups[category] = group.name;
    }

    return groups;
  },
  {} as Record<string, BudgetGroupName>
);
