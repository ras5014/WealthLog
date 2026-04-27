import { z } from "zod";

export const ACCEPTED_TYPES = [".pdf"];
export const ACCEPTED_MIME = ["application/pdf"];

export const statementSchema = z.object({
  iciciStatement: z
    .instanceof(FileList)
    .refine((fl) => fl.length > 0, "ICICI statement is required")
    .refine(
      (fl) => ACCEPTED_MIME.includes(fl[0]?.type),
      `Accepted formats: ${ACCEPTED_TYPES.join(", ")}`,
    ),
});

export type StatementFormValues = z.infer<typeof statementSchema>;
