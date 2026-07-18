import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { PDFParse } from "pdf-parse";
import { chromium, type Download, type Page } from "playwright";
import { env } from "../../config/env.ts";
import { extractTransactionsFromPDF } from "./creditCard.service.ts";
import type { ParsedStatementResult } from "./creditCard.types.ts";

const ICICI_LOGIN_URL = "https://retailnetbanking.icici.bank.in/login-page";
const ICICI_BANK_BY_DOWNLOAD_INDEX = ["ICICI_CORAL", "ICICI_AMZNPAY"] as const;

type DownloadedStatement = {
  card: "coral" | "amazon-pay";
  bank: (typeof ICICI_BANK_BY_DOWNLOAD_INDEX)[number];
  filePath: string;
};

type ProcessedStatement = {
  card: DownloadedStatement["card"];
  result: ParsedStatementResult;
};

type AutoSyncIciciOptions = {
  autoLogin?: boolean;
};

let isRunning = false;

const inferCardFromFilename = (
  filename: string,
): DownloadedStatement["card"] => {
  const lowerFilename = filename.toLowerCase();

  return lowerFilename.includes("amazon") || lowerFilename.includes("3005")
    ? "amazon-pay"
    : "coral";
};

const saveManualStatementDownload = async (
  download: Download,
  runDownloadDir: string,
  index: number,
): Promise<DownloadedStatement> => {
  const suggestedFilename = download.suggestedFilename();
  const safeFilename =
    suggestedFilename.replaceAll(/[^a-z0-9._-]+/gi, "-") ||
    `icici-statement-${index}.pdf`;
  const filePath = path.join(runDownloadDir, `${index}-${safeFilename}`);

  await download.saveAs(filePath);

  const bank = ICICI_BANK_BY_DOWNLOAD_INDEX[index - 1];
  if (!bank) {
    throw new Error(`No ICICI bank mapping found for download ${index}.`);
  }

  return {
    card: inferCardFromFilename(suggestedFilename),
    bank,
    filePath,
  };
};

const triggerAndCaptureDownload = async (
  page: Page,
  runDownloadDir: string,
  index: number,
): Promise<DownloadedStatement> => {
  // Set up download listener BEFORE clicking
  const downloadPromise = page.waitForEvent("download");

  // Click download button to trigger download
  await page.getByRole("button", { name: "download" }).click();

  // Wait for download to complete
  const download = await downloadPromise;
  console.log(`Download ${index} received: ${download.suggestedFilename()}`);

  return saveManualStatementDownload(download, runDownloadDir, index);
};

const autoDownloadStatements = async (
  page: Page,
  runDownloadDir: string,
): Promise<DownloadedStatement[]> => {
  const downloadedStatements: DownloadedStatement[] = [];

  try {
    // First download - Coral card
    console.log("Triggering download for Coral card...");
    downloadedStatements.push(
      await triggerAndCaptureDownload(page, runDownloadDir, 1),
    );
    console.log("Coral card statement downloaded successfully");

    // Small delay to ensure page is ready for card switch
    await page.waitForTimeout(1000);

    // Click Amazon Pay card to switch
    console.log("Switching to Amazon Pay card...");
    await page.getByTitle("Amazon Pay ICICI Bank VISA-").click();
    await page.waitForTimeout(1000); // Wait for page to load the new card

    // Second download - Amazon Pay card
    console.log("Triggering download for Amazon Pay card...");
    downloadedStatements.push(
      await triggerAndCaptureDownload(page, runDownloadDir, 2),
    );
    console.log("Amazon Pay card statement downloaded successfully");
  } catch (error) {
    console.error("Error during auto download:", error);
    throw new Error(
      `Failed to download ICICI statements: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }

  return downloadedStatements;
};

const autoLoginIcici = async (page: Page) => {
  if (!env.ICICI_USER_ID || !env.ICICI_PASSWORD) {
    throw new Error(
      "ICICI auto login is enabled, but ICICI_USER_ID or ICICI_PASSWORD is missing.",
    );
  }

  const userIdInput = page.getByLabel("User ID", { exact: true });
  await userIdInput.fill(env.ICICI_USER_ID);

  const passwordInput = page.getByLabel("Password", { exact: true });
  await passwordInput.fill(env.ICICI_PASSWORD);

  await page
    .getByRole("button", { name: /^Login$/ })
    .last()
    .click();
  await page.waitForLoadState("domcontentloaded").catch(() => undefined);
};

const processDownloadedStatement = async (
  statement: DownloadedStatement,
): Promise<ProcessedStatement> => {
  const fileBuffer = await readFile(statement.filePath);
  const parser = new PDFParse({ data: fileBuffer });

  try {
    const pdfData = await parser.getText();
    let result: ParsedStatementResult;

    try {
      result = await extractTransactionsFromPDF(pdfData.text);
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === "BANK_SELECTION_REQUIRED"
      ) {
        result = await extractTransactionsFromPDF(pdfData.text, statement.bank);
      } else {
        // Provide more context when PDF parsing fails
        console.error(
          `PDF parsing failed for ${statement.card} card (${statement.bank}):`,
          error,
        );
        throw error;
      }
    }

    return {
      card: statement.card,
      result,
    };
  } finally {
    await parser.destroy();
  }
};

export const autoSyncIciciStatements = async (
  options: AutoSyncIciciOptions = {},
) => {
  if (isRunning) {
    throw new Error("ICICI auto sync is already running.");
  }

  isRunning = true;
  const runDownloadDir = await mkdtemp(
    path.join(tmpdir(), "wealthlog-icici-statements-"),
  );
  const browser = await chromium.launch({
    headless: false,
    args: ["--start-maximized"],
  });

  try {
    const context = await browser.newContext({
      acceptDownloads: true,
      viewport: null,
    });
    const page = await context.newPage();

    await page.goto(ICICI_LOGIN_URL, { waitUntil: "domcontentloaded" });
    if (options.autoLogin) {
      await autoLoginIcici(page);
    }

    // Auto download of statements
    await page
      .locator("#scroll-container a")
      .filter({ hasText: "Cards" })
      .click();
    await page
      .locator("#subContainer4 a")
      .filter({ hasText: "Credit Cards" })
      .click();

    const downloadedStatements = await autoDownloadStatements(
      page,
      runDownloadDir,
    );

    const processedStatements: ProcessedStatement[] = [];
    for (const statement of downloadedStatements) {
      processedStatements.push(await processDownloadedStatement(statement));
    }

    return {
      statements: processedStatements,
    };
  } finally {
    await browser.close().catch(() => undefined);
    await rm(runDownloadDir, { recursive: true, force: true }).catch(
      () => undefined,
    );
    isRunning = false;
  }
};
