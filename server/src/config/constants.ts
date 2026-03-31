export const PREFIXES_TO_EXCLUDE = [
  "Principal Amount Amortization", // EMI principal component - exclude from transactions list
  "Interest Amount Amortization", // EMI interest component - exclude from transactions list
  "BBPS Payment received", // Bill payment - Not required to be tracked
];
