export const PREFIXES_TO_EXCLUDE = [
  "Principal Amount Amortization", // EMI principal component - exclude from transactions list
  "Interest Amount Amortization", // EMI interest component - exclude from transactions list
  "BBPS Payment received", // Bill payment - Not required to be tracked
  "Merch. EMI conversion", // EMI conversion fee - exclude from transactions list
];

export const CARD_DETAILS = [
  {
    cardNumber: "403562******5001",
    bank: "ICICI_CORAL",
  },
  {
    cardNumber: "431581******3005",
    bank: "ICICI_AMZNPAY",
  },
];
