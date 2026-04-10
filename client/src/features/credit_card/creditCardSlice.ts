import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

export interface CreditCardState {
  bank: string;
}

const initialState: CreditCardState = {
  bank: "",
};

export const creditCardSlice = createSlice({
  name: "creditCard",
  initialState,
  reducers: {
    setBank: (state, action: PayloadAction<string>) => {
      state.bank = action.payload;
    },
  },
});

// Action creators are generated for each case reducer function
export const { setBank } = creditCardSlice.actions;

export default creditCardSlice.reducer;
