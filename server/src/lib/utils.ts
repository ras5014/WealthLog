export const calculateBillingCycleDates = (statementStartDate: string) => {
  // Update billingCycleStartDate and billingCycleEndDate in DB
  // billingCycleEndDate = one day before the same date next month
  const startParts = statementStartDate.split("-"); // DD-MM-YYYY
  const billingStart = new Date(
    Number(startParts[2]),
    Number(startParts[1]) - 1,
    Number(startParts[0]),
  );
  const billingEnd = new Date(
    billingStart.getFullYear(),
    billingStart.getMonth() + 1,
    billingStart.getDate(),
  );
  const billingEndDateStr = billingEnd.toISOString().split("T")[0]; // YYYY-MM-DD
  return billingEndDateStr;
};
