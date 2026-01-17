import { v4 as uuidv4 } from "uuid";
import * as XLSX from "xlsx";
import * as mammoth from "mammoth";
import { FileType } from "@gaia/db";

export interface ProcessedFile {
  id: string;
  name: string;
  content: string;
  size: number;
  type: FileType;
}

export class FileParser {
  /**
   * Determines file type from file extension and MIME type
   */
  static getFileType(file: File): FileType {
    const extension = file.name.split(".").pop()?.toLowerCase() || "";
    const mimeType = file.type.toLowerCase();

    // PDF
    if (extension === "pdf" || mimeType === "application/pdf") {
      return "pdf";
    }

    // CSV
    if (extension === "csv" || mimeType === "text/csv") {
      return "csv";
    }

    // Excel
    if (
      ["xlsx", "xls"].includes(extension) ||
      mimeType.includes("spreadsheet") ||
      mimeType.includes("excel")
    ) {
      return "csv";
    }

    // Word Documents
    if (
      ["doc", "docx"].includes(extension) ||
      mimeType.includes("document") ||
      mimeType.includes("word")
    ) {
      return "docx";
    }

    // JSON
    if (extension === "json" || mimeType === "application/json") {
      return "json";
    }

    // Plain Text
    if (extension === "txt" || mimeType === "text/plain") {
      return "txt";
    }

    return "other";
  }

  /**
   * Process a single file and extract its content
   */
  static async processFile(file: File): Promise<ProcessedFile> {
    const fileType = this.getFileType(file);

    if (fileType === "other") {
      throw new Error(`Unsupported file type: ${file.type}`);
    }

    let content: string;

    try {
      switch (fileType) {
        case "pdf":
          content = await this.extractPDF(file);
          break;
        case "csv":
          content = await this.extractCSV(file);
          break;
        case "xls":
          content = await this.extractExcel(file);
          break;
        case "docx":
          content = await this.extractDocs(file);
          break;
        case "json":
          content = await this.extractJSON(file);
          break;
        case "txt":
        default:
          content = await this.extractText(file);
          break;
      }

      return {
        id: uuidv4(),
        name: file.name,
        content,
        size: file.size,
        type: fileType,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      throw new Error(`Failed to process ${file.name}: ${errorMessage}`);
    }
  }

  /**
   * Process multiple files in parallel
   */
  static async processFiles(files: File[]): Promise<ProcessedFile[]> {
    const promises = files.map((file) =>
      this.processFile(file).catch((error) => {
        console.error(`Error processing ${file.name}:`, error);
        return null;
      })
    );

    const results = await Promise.all(promises);
    return results.filter((file): file is ProcessedFile => file !== null);
  }

  /**
   * Extract text content from plain text file
   */
  private static async extractText(file: File): Promise<string> {
    return await file.text();
  }

  /**
   * Extract and format JSON content
   */
  private static async extractJSON(file: File): Promise<string> {
    const text = await file.text();
    try {
      const json = JSON.parse(text);
      return JSON.stringify(json, null, 2);
    } catch (error) {
      throw new Error("Invalid JSON format");
    }
  }

  /**
   * Extract CSV content with proper formatting
   */
  private static async extractCSV(file: File): Promise<string> {
    const text = await file.text();
    const lines = text.trim().split("\n");

    if (lines.length === 0) {
      return "";
    }

    const headers = lines[0].split(",").map((h) => h.trim());

    // Return as formatted CSV text
    const formatted = lines.map((line, idx) => {
      if (idx === 0) {
        return `Headers: ${headers.join(", ")}`;
      }

      const values = line.split(",").map((v) => v.trim());
      const rowData = headers
        .map((header, i) => `${header}: ${values[i] || ""}`)
        .join(", ");

      return `Row ${idx}: ${rowData}`;
    });

    return formatted.join("\n");
  }

  /**
   * Extract text from PDF using pdfjs-dist
   */
  private static async extractPDF(file: File): Promise<string> {
    try {
      const pdfjs = await import("pdfjs-dist");
      // const  pdfjs  = await import("pdfjs-dist/types/src/pdf")

      // Set up worker
      pdfjs.GlobalWorkerOptions.workerSrc =
        window.location.origin + "/pdf.worker.min.mjs";

      const arrayBuffer = await file.arrayBuffer();
      const pdfDocument = await pdfjs.getDocument({ data: arrayBuffer })
        .promise;

      let extractedText = "";

      // Extract text from all pages
      for (let pageNum = 1; pageNum <= pdfDocument.numPages; pageNum++) {
        const page = await pdfDocument.getPage(pageNum);
        const textContent = await page.getTextContent();

        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(" ");

        extractedText += `--- Page ${pageNum} ---\n${pageText}\n\n`;
      }

      return (
        extractedText.trim() || `[No text content extracted from ${file.name}]`
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      throw new Error(`PDF extraction failed: ${errorMessage}`);
    }
  }

  /**
   * Extract text from Excel files (xlsx, xls)
   */
  private static async extractExcel(file: File): Promise<string> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: "array" });

      let extractedText = "";

      workbook.SheetNames.forEach((sheetName) => {
        const sheet = workbook.Sheets[sheetName];
        const csvData = XLSX.utils.sheet_to_csv(sheet);

        extractedText += `=== Sheet: ${sheetName} ===\n`;
        extractedText += csvData + "\n\n";
      });

      return extractedText.trim();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      throw new Error(`Excel extraction failed: ${errorMessage}`);
    }
  }

  /**
   * Extract text from Word documents (doc, docx)
   */
  private static async extractDocs(file: File): Promise<string> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });

      if (result.messages.length > 0) {
        console.warn("Warnings during document extraction:", result.messages);
      }

      return result.value || `[No text content extracted from ${file.name}]`;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      throw new Error(`Document extraction failed: ${errorMessage}`);
    }
  }
}

// React-specific helper for handling file uploads
export const handleFileUpload = async (
  files: FileList | File[],
  onSuccess: (files: ProcessedFile[]) => void,
  onError: (error: string) => void
): Promise<void> => {
  try {
    const fileArray = Array.from(files);
    const processedFiles = await FileParser.processFiles(fileArray);

    if (processedFiles.length === 0) {
      onError("No files could be processed successfully");
      return;
    }

    onSuccess(processedFiles);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    onError(`Error uploading files: ${errorMessage}`);
  }
};
