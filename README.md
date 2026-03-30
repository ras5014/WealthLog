# WealthLog 
## Credit Card
### Synchronize
---
- Upload all credit card current billing cycle statements
    1. ICICI CORAL
    2. ICICI AMZNPAY
    3. Flipkart Axis (To be added later)
    4. IDFC First Bank (Some Investigation Needed, To be added later)
    5. IndusInd (To be added later)
    6. HDFC Pixel Play (To be added later)
    7. HDFC Normal (To be added later)
- Process them and store the transaction data and other important information and store them in DB
    1. Statement Period
    2. Transaction Details

#### User Story
---
###### ICICI CORAL
---
- User uploads the statements for ICICI CORAL
- Parser parses the statement and extracts the transaction table data.
- To the transaction table data add one field related to statement period.
- If I upload second time after some days in the same statement period cycle then data duplication shouldn't happen Example already existing transactions shouldn't get duplicated or added again. Only new transactions should be added
- Some default categorization of spends can be done with AI
- If transaction details starts with "Principal Amount Amortization" or "Interest Amount Amortization" then this is related to EMI payments. (Which I will calculate differently) So exclude it from the transactions
#### To Check & Verify
- Check Total Amount due & BBPS Payment received [Exclude this field from transactions], If they are same, then credit card bill for the previous cycle is paid fully, If not then for now I don't know how the statement behaves in the coming cycle.
---

