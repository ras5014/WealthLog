import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { PDFParse } from "pdf-parse";
import { chromium, type Download, type Page } from "playwright";
import { env } from "../../config/env.ts";
import { extractEmisFromPDF } from "./emi.service.ts";

const ICICI_LOGIN_URL = "https://retailnetbanking.icici.bank.in/login-page";
const MANUAL_DOWNLOAD_TIMEOUT_MS = 15 * 60 * 1000;

type DownloadedEmiStatement = {
  filePath: string;
  filename: string;
};

type ProcessedEmiStatement = {
  merchant: string;
  totalAmount: number;
  emiCount: number;
  updated: boolean;
};

type AutoSyncEmiOptions = {
  autoLogin?: boolean;
  bank: string;
  expectedDownloads?: number;
};

let isRunning = false;

const saveManualEmiDownload = async (
  download: Download,
  runDownloadDir: string,
  index: number,
): Promise<DownloadedEmiStatement> => {
  const suggestedFilename = download.suggestedFilename();
  const safeFilename =
    suggestedFilename.replaceAll(/[^a-z0-9._-]+/gi, "-") ||
    `icici-emi-statement-${index}.pdf`;
  const filePath = path.join(runDownloadDir, `${index}-${safeFilename}`);

  await download.saveAs(filePath);

  return {
    filePath,
    filename: suggestedFilename,
  };
};

const waitForEmiDownloads = async (
  page: Page,
  runDownloadDir: string,
  expectedDownloads: number,
): Promise<DownloadedEmiStatement[]> => {
  const downloadedStatements: DownloadedEmiStatement[] = [];
  const startedAt = Date.now();

  while (downloadedStatements.length < expectedDownloads) {
    const remainingMs = MANUAL_DOWNLOAD_TIMEOUT_MS - (Date.now() - startedAt);

    if (remainingMs <= 0) {
      throw new Error(
        `Timed out waiting for ${expectedDownloads} EMI statement downloads. Captured ${downloadedStatements.length}.`,
      );
    }

    const download = await page.waitForEvent("download", {
      timeout: remainingMs,
    });

    downloadedStatements.push(
      await saveManualEmiDownload(
        download,
        runDownloadDir,
        downloadedStatements.length + 1,
      ),
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

const processDownloadedEmiStatement = async (
  statement: DownloadedEmiStatement,
  bank: string,
): Promise<ProcessedEmiStatement> => {
  const fileBuffer = await readFile(statement.filePath);
  const parser = new PDFParse({ data: fileBuffer });

  try {
    const pdfData = await parser.getText();
    const result = await extractEmisFromPDF(pdfData.text, bank);

    return {
      merchant: result.merchant,
      totalAmount: result.totalAmount,
      emiCount: result.emiCount,
      updated: result.updated,
    };
  } finally {
    await parser.destroy();
  }
};

export const autoSyncEmiStatements = async (options: AutoSyncEmiOptions) => {
  if (isRunning) {
    throw new Error("EMI auto sync is already running.");
  }

  const expectedDownloads = options.expectedDownloads ?? 1;

  isRunning = true;
  const runDownloadDir = await mkdtemp(
    path.join(tmpdir(), "wealthlog-emi-statements-"),
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

    const downloadedStatements = await waitForEmiDownloads(
      page,
      runDownloadDir,
      expectedDownloads,
    );

    const processedStatements: ProcessedEmiStatement[] = [];
    for (const statement of downloadedStatements) {
      processedStatements.push(
        await processDownloadedEmiStatement(statement, options.bank),
      );
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
