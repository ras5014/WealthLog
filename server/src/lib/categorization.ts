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

export type TransactionCategory = (typeof TRANSACTION_CATEGORIES)[number];

export interface CategorizationTransaction {
  transactionDate?: string;
  details: string;
  amount?: number | string;
  type?: "Dr" | "Cr";
  bank?: string;
  referenceNumber?: string;
}

export interface CategorizationResult {
  category: TransactionCategory;
  description: string;
  confidence: number;
  source: "rule" | "ai" | "fallback";
}

interface CategoryRule {
  category: TransactionCategory;
  patterns: RegExp[];
  description?: string;
}

const RULE_CONFIDENCE = 0.95;
const FALLBACK_CONFIDENCE = 0.35;

const CATEGORY_RULES: CategoryRule[] = [
  {
    category: "Credit/Refund",
    patterns: [
      /\b(refund|reversal|cashback|reward|payment received|autopay received|credit received)\b/i,
    ],
  },
  {
    category: "Fees & Charges",
    patterns: [
      /\b(fee|charge|interest|gst|late payment|overlimit|annual|markup|forex|surcharge)\b/i,
    ],
  },
  {
    category: "EMI",
    patterns: [/\b(emi|equated monthly|loan repayment|instal+l?ment)\b/i],
  },
  {
    category: "Food & Dining",
    patterns: [
      /\b(swiggy|zomato|restaurant|cafe|coffee|barista|starbucks|domino'?s|pizza|mcdonald|burger|kfc|eatclub|eatsure|food)\b/i,
    ],
  },
  {
    category: "Groceries",
    patterns: [
      /\b(bigbasket|blinkit|zepto|dmart|d-mart|grofer|jiomart|super ?market|grocery|fresh|mart)\b/i,
    ],
  },
  {
    category: "Travel",
    patterns: [
      /\b(uber|ola|rapido|metro|irctc|railway|air( ?india)?|indigo|vistara|akasa|spicejet|makemytrip|goibibo|cleartrip|hotel|booking\.com|agoda|parking|toll)\b/i,
    ],
  },
  {
    category: "Fuel",
    patterns: [
      /\b(fuel|petrol|diesel|hpcl|iocl|indian oil|bharat petroleum|bpcl|shell|reliance petrol|cng)\b/i,
    ],
  },
  {
    category: "Shopping",
    patterns: [
      /\b(amazon|flipkart|myntra|ajio|nykaa|meesho|tatacliq|croma|reliance digital|lifestyle|shoppers stop|decathlon|zara|h&m)\b/i,
    ],
  },
  {
    category: "Bills & Utilities",
    patterns: [
      /\b(electricity|water bill|gas bill|broadband|wifi|internet|airtel|jio|vi |vodafone|bsnl|bescom|adani electricity|tatapower|recharge|utility)\b/i,
    ],
  },
  {
    category: "Entertainment",
    patterns: [
      /\b(netflix|prime video|hotstar|disney|spotify|youtube|bookmyshow|pvr|inox|cinema|gaming|steam|playstation)\b/i,
    ],
  },
  {
    category: "Health",
    patterns: [
      /\b(pharmacy|medical|apollo|pharmeasy|1mg|netmeds|hospital|clinic|doctor|diagnostic|lab|health)\b/i,
    ],
  },
  {
    category: "Education",
    patterns: [
      /\b(school|college|university|course|udemy|coursera|skillshare|tuition|exam|education)\b/i,
    ],
  },
  {
    category: "Rent & Housing",
    patterns: [/\b(rent|maintenance|society|housing|apartment)\b/i],
  },
  {
    category: "Insurance",
    patterns: [/\b(insurance|policy|premium|lic|hdfc ergo|acko|digit)\b/i],
  },
  {
    category: "Investments",
    patterns: [
      /\b(mutual fund|zerodha|groww|upstox|coin|smallcase|sip|investment|stocks|nps)\b/i,
    ],
  },
  {
    category: "Cash Withdrawal",
    patterns: [/\b(atm|cash withdrawal|cash wdl)\b/i],
  },
  {
    category: "Transfers",
    patterns: [/\b(upi|imps|neft|rtgs|transfer|paytm|phonepe|gpay|google pay)\b/i],
  },
];

const categorySet = new Set<string>(TRANSACTION_CATEGORIES);

const cleanDetails = (details: string) =>
  details.replaceAll(/\s+/g, " ").trim();

const toTitleCase = (value: string) =>
  value
    .toLowerCase()
    .replaceAll(/\b\w/g, (char) => char.toUpperCase())
    .trim();

const extractUpiMerchant = (details: string) => {
  const parts = details
    .split(/[-/]/)
    .map((part) => part.trim())
    .filter(Boolean);

  const likelyMerchant = parts.findLast(
    (part) =>
      !/^(upi|paytm|phonepe|gpay|google pay|collect|paid|to|from)$/i.test(
        part,
      ) && !/^\d+$/.test(part),
  );

  return likelyMerchant;
};

const buildDescription = (details: string) => {
  const cleaned = cleanDetails(details);
  const upiMerchant = /^upi\b/i.test(cleaned) ? extractUpiMerchant(cleaned) : undefined;
  const description = upiMerchant ?? cleaned;

  return toTitleCase(description).slice(0, 512);
};

const applyRules = (
  transaction: CategorizationTransaction,
): CategorizationResult | undefined => {
  const details = cleanDetails(transaction.details);

  if (transaction.type === "Cr") {
    return {
      category: "Credit/Refund",
      description: buildDescription(details),
      confidence: RULE_CONFIDENCE,
      source: "rule",
    };
  }

  const matchedRule = CATEGORY_RULES.find((rule) =>
    rule.patterns.some((pattern) => pattern.test(details)),
  );

  if (!matchedRule) {
    return undefined;
  }

  return {
    category: matchedRule.category,
    description: matchedRule.description ?? buildDescription(details),
    confidence: RULE_CONFIDENCE,
    source: "rule",
  };
};

const parseGroqMessageContent = (data: unknown) => {
  if (!data || typeof data !== "object" || !("choices" in data)) {
    return undefined;
  }

  const choices = data.choices;
  if (!Array.isArray(choices)) {
    return undefined;
  }

  for (const choice of choices) {
    if (!choice || typeof choice !== "object" || !("message" in choice)) {
      continue;
    }

    const message = choice.message;
    if (
      message &&
      typeof message === "object" &&
      "content" in message &&
      typeof message.content === "string"
    ) {
      return message.content;
    }
  }

  return undefined;
};

const isAiCategorizationResult = (
  value: unknown,
): value is Pick<CategorizationResult, "category" | "description" | "confidence"> => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const result = value as Record<string, unknown>;

  return (
    typeof result.category === "string" &&
    categorySet.has(result.category) &&
    typeof result.description === "string" &&
    typeof result.confidence === "number"
  );
};

const categorizeWithGroq = async (
  transaction: CategorizationTransaction,
): Promise<CategorizationResult | undefined> => {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    return undefined;
  }

  const response = await fetch(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL ?? "openai/gpt-oss-20b",
        messages: [
          {
            role: "system",
            content:
              "Categorize Indian credit card transactions. Return only the provided JSON schema. Pick exactly one category from the allowed list. Keep description short and merchant-focused.",
          },
          {
            role: "user",
            content: JSON.stringify({
              transaction: {
                ...transaction,
                details: cleanDetails(transaction.details),
              },
              allowedCategories: TRANSACTION_CATEGORIES,
            }),
          },
        ],
        temperature: 0,
        max_completion_tokens: 160,
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "transaction_categorization",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              properties: {
                category: {
                  type: "string",
                  enum: TRANSACTION_CATEGORIES,
                },
                description: {
                  type: "string",
                  maxLength: 512,
                },
                confidence: {
                  type: "number",
                  minimum: 0,
                  maximum: 1,
                },
              },
              required: ["category", "description", "confidence"],
            },
          },
        },
      }),
    },
  );

  if (!response.ok) {
    return undefined;
  }

  const data: unknown = await response.json();
  const text = parseGroqMessageContent(data);
  if (!text) {
    return undefined;
  }

  const parsed: unknown = JSON.parse(text);
  if (!isAiCategorizationResult(parsed)) {
    return undefined;
  }

  return {
    category: parsed.category,
    description: parsed.description.trim().slice(0, 512),
    confidence: Math.min(Math.max(parsed.confidence, 0), 1),
    source: "ai",
  };
};

export const categorizeTransaction = async (
  transaction: CategorizationTransaction,
): Promise<CategorizationResult> => {
  const ruleResult = applyRules(transaction);
  if (ruleResult) {
    return ruleResult;
  }

  const aiResult = await categorizeWithGroq(transaction).catch(() => undefined);
  if (aiResult) {
    return aiResult;
  }

  return {
    category: "Other",
    description: buildDescription(transaction.details),
    confidence: FALLBACK_CONFIDENCE,
    source: "fallback",
  };
};

export const categorizeTransactions = async <
  TTransaction extends CategorizationTransaction,
>(
  transactions: TTransaction[],
): Promise<(TTransaction & CategorizationResult)[]> => {
  const categorized = await Promise.all(
    transactions.map(async (transaction) => ({
      ...transaction,
      ...(await categorizeTransaction(transaction)),
    })),
  );

  return categorized;
};
