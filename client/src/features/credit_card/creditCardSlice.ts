import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

export interface CreditCardState {
  bank: string;
  billingCycleEndDate?: string;
}

const initialState: CreditCardState = {
  bank: "",
  billingCycleEndDate: "",
};

export const creditCardSlice = createSlice({
  name: "creditCard",
  initialState,
  reducers: {
    setBank: (state, action: PayloadAction<string>) => {
      state.bank = action.payload;
    },
    setBillingCycleEndDate: (state, action: PayloadAction<string>) => {
      state.billingCycleEndDate = action.payload;
    },
  },
});

// Action creators are generated for each case reducer function
export const { setBank, setBillingCycleEndDate } = creditCardSlice.actions;

export default creditCardSlice.reducer;
