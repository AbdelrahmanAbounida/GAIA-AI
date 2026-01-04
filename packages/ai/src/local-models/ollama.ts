import { z } from "zod";
import axios from "axios";
import { load } from "cheerio";

type Category = "embedding" | "cloud" | "vision" | "tools" | "thinking";
type SortOrder = "newest" | "popular";

interface SearchOptions {
  query: string;
  categories?: Category[];
  order?: SortOrder;
}

export interface OllamaModel {
  name: string;
  description: string;
  pulls: string;
  tags: string;
  updated: string;
  url: string;
  categories: string[];
}

export const OllamaModelSchema = z.object({
  name: z.string(),
  description: z.string(),
  pulls: z.string(),
  tags: z.string(),
  updated: z.string(),
  url: z.string(),
  categories: z.array(z.string()),
});

export async function searchOllamaModels({
  ...options
}: SearchOptions): Promise<OllamaModel[]> {
  const { query, categories = [], order = "newest" } = options;

  // const normalizedCategories = new Set(categories);
  // const hasEmbeddings = normalizedCategories.has("embedding");
  // if (!hasEmbeddings) {
  //   normalizedCategories.add("tools");
  // }
  const normalizedCategories = categories;
  const params = new URLSearchParams();

  [...normalizedCategories].forEach((category) => {
    params.append("c", category);
  });
  params.append("q", query);
  params.append("o", order);

  const url = `https://ollama.com/search?${params.toString()}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      accept: "*/*",
      "hx-current-url": "https://ollama.com/search",
      "hx-request": "true",
      "hx-target": "searchresults",
      referer: "https://ollama.com/search",
    },
  });

  if (!response.ok) {
    throw new Error(`Search failed: ${response.status} ${response.statusText}`);
  }

  const html = await response.text();

  return parseOllamaModels(html);
}

function parseOllamaModels(html: string): OllamaModel[] {
  const models: OllamaModel[] = [];

  // Match each <li x-test-model> block
  const modelRegex = /<li x-test-model[^>]*>[\s\S]*?<\/li>/g;
  const modelMatches = html.match(modelRegex);

  if (!modelMatches) return models;

  for (const modelHtml of modelMatches) {
    // Extract href
    const hrefMatch = modelHtml.match(/href="([^"]+)"/);
    const href = hrefMatch ? hrefMatch[1] : "";

    // Extract name
    const nameMatch = modelHtml.match(
      /x-test-search-response-title[^>]*>([^<]+)</
    );
    const name = nameMatch ? nameMatch[1].trim() : "";

    // Extract description
    const descMatch = modelHtml.match(/<p class="max-w-lg[^>]*>([^<]+)<\/p>/);
    const description = descMatch ? descMatch[1].trim() : "";

    // Extract pulls
    const pullsMatch = modelHtml.match(/x-test-pull-count[^>]*>([^<]+)</);
    const pulls = pullsMatch ? pullsMatch[1].trim() : "";

    // Extract tags count
    const tagsMatch = modelHtml.match(/x-test-tag-count[^>]*>([^<]+)</);
    const tags = tagsMatch ? tagsMatch[1].trim() : "";

    // Extract updated time
    const updatedMatch = modelHtml.match(/x-test-updated[^>]*>([^<]+)</);
    const updated = updatedMatch ? updatedMatch[1].trim() : "";

    // Extract categories
    const categoryMatches = modelHtml.matchAll(
      /text-(cyan|purple|green|orange|blue)-500">([^<]+)</g
    );
    const modelCategories = Array.from(categoryMatches, (m) => m[2]);

    if (name) {
      models.push({
        name,
        description,
        pulls,
        tags,
        updated,
        url: `https://ollama.com${href}`,
        categories: modelCategories,
      });
    }
  }

  return models;
}

/**
 * Pull an Ollama model
 */
// In-memory storage for pull progress tracking
const pullProgressMap = new Map<
  string,
  {
    status: "pulling" | "extracting" | "complete" | "error";
    progress: number;
    digest?: string;
    total?: number;
    completed?: number;
  }
>();

export async function pullOllamaModel(
  modelName: string,
  baseUrl: string
): Promise<void> {
  try {
    // Initialize progress tracking
    pullProgressMap.set(modelName, {
      status: "pulling",
      progress: 0,
    });

    // Start the pull operation (non-blocking)
    axios
      .post(
        `${baseUrl}/api/pull`,
        { name: modelName, stream: true },
        {
          responseType: "stream",
          timeout: 0, // No timeout for long pulls
        }
      )
      .then((response) => {
        let buffer = "";

        response.data.on("data", (chunk: Buffer) => {
          buffer += chunk.toString();
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.trim()) {
              try {
                const data = JSON.parse(line);

                // Update progress based on response
                if (data.status) {
                  const currentStatus = pullProgressMap.get(modelName);

                  let progress = 0;
                  let status: "pulling" | "extracting" | "complete" | "error" =
                    "pulling";

                  if (data.status.includes("pulling")) {
                    status = "pulling";
                    if (data.completed && data.total) {
                      progress = (data.completed / data.total) * 100;
                    }
                  } else if (
                    data.status.includes("extracting") ||
                    data.status.includes("verifying")
                  ) {
                    status = "extracting";
                    progress = 90; // Assume extraction is near complete
                  } else if (
                    data.status.includes("success") ||
                    data.status.includes("complete")
                  ) {
                    status = "complete";
                    progress = 100;
                  }

                  pullProgressMap.set(modelName, {
                    status,
                    progress,
                    digest: data.digest,
                    total: data.total,
                    completed: data.completed,
                  });
                }
              } catch (parseError) {
                console.error("Failed to parse pull progress:", parseError);
              }
            }
          }
        });

        response.data.on("end", () => {
          pullProgressMap.set(modelName, {
            status: "complete",
            progress: 100,
          });
        });

        response.data.on("error", (error: Error) => {
          console.error("Pull stream error:", error);
          pullProgressMap.set(modelName, {
            status: "error",
            progress: 0,
          });
        });
      })
      .catch((error) => {
        console.error("Pull request error:", error);
        pullProgressMap.set(modelName, {
          status: "error",
          progress: 0,
        });
        throw error;
      });
  } catch (error) {
    console.error("Error pulling Ollama model:", error);
    pullProgressMap.set(modelName, {
      status: "error",
      progress: 0,
    });
    throw new Error("Failed to pull Ollama model");
  }
}

export interface ModelVariant {
  name: string;
  size: string | null;
  context: string | null;
  input: string;
  tag: string;
}
export interface ModelDetails {
  name: string;
  summary: string;
  downloads: string;
  lastUpdated: string;
  tags: string[];
  sizes: string[];
  variants: ModelVariant[];
  readme: string;
  command: string;
  url: string;
}

/**
 * GET Model Details
 **/

export async function getModelDetails({
  model,
  verbose,
}: {
  model: string;
  verbose?: boolean;
}): Promise<{
  model: ModelDetails;
}> {
  if (!model) throw new Error("Model name is required");

  function parseModelDetails(html: string, url: string): ModelDetails {
    const $ = load(html);

    const name = $("[x-test-model-name]").text().trim() || "";
    const command = $('input[name="command"]').attr("value") || "";
    const summary = $("#summary-content").text().trim() || "";
    const downloads = $("[x-test-pull-count]").text().trim() || "";
    const lastUpdated = $("[x-test-updated]").text().trim() || "";

    const tags: string[] = [];
    $(".inline-flex.items-center.rounded-md").each((_, el) => {
      const text = $(el).text().trim();
      if (text && !/^\d+[bmk]$/i.test(text)) tags.push(text);
    });

    const sizes: string[] = [];
    $("[x-test-size]").each((_, el) => {
      const size = $(el).text().trim();
      if (size) sizes.push(size);
    });

    const variants: ModelVariant[] = [];
    $(".sm\\:grid.sm\\:grid-cols-12").each((_, row) => {
      const $row = $(row);
      const link = $row.find("a").first();
      const variantName = link.text().trim();
      const variantTag = link.attr("href")?.split("/").pop();

      if (!variantName || !variantTag) return;

      const cols = $row.find(".col-span-2");
      const size = $(cols[0]).text().trim() || null;
      const context = $(cols[1]).text().trim() || null;
      const input = $(cols[2]).text().trim() || "";

      variants.push({
        name: variantName,
        size: size === "-" ? null : size,
        context: context === "-" ? null : context,
        input,
        tag: variantTag,
      });
    });

    const readme =
      $("#editor").val()?.toString() || $("#editor").text().trim() || "";

    return {
      name,
      summary,
      downloads,
      lastUpdated,
      tags,
      sizes,
      variants,
      readme,
      command,
      url,
    };
  }

  const url = `https://ollama.com/library/${model}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      accept: "*/*",
      referer: "https://ollama.com/library",
      "hx-request": "true",
      "hx-current-url": "https://ollama.com/library",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch model page: ${response.status} ${response.statusText}`
    );
  }

  const html = await response.text();

  return {
    model: parseModelDetails(html, url),
  };
}

/**
 * Get the progress of a model pull operation
 */
export async function getPullProgress(
  modelName: string,
  baseUrl: string
): Promise<{
  status: "pulling" | "extracting" | "complete" | "error";
  progress: number;
  digest?: string;
  total?: number;
  completed?: number;
}> {
  const progress = pullProgressMap.get(modelName);

  if (!progress) {
    // If no progress found, check if model is already installed
    try {
      const installed = await listInstalledModels(baseUrl);
      const isInstalled = installed.some((m) => m.name === modelName);

      if (isInstalled) {
        return {
          status: "complete",
          progress: 100,
        };
      }

      return {
        status: "error",
        progress: 0,
      };
    } catch (error) {
      return {
        status: "error",
        progress: 0,
      };
    }
  }

  return progress;
}

/**
 * List installed Ollama models
 */
export async function listInstalledModels(baseUrl: string): Promise<
  Array<{
    name: string;
    size: number;
    digest: string;
    modified_at: string;
    details?: any;
  }>
> {
  try {
    const response = await axios.get(`${baseUrl}/api/tags`);
    return response.data.models || [];
  } catch (error) {
    console.error("Error listing Ollama models:", error);
    throw new Error("Failed to list installed Ollama models");
  }
}

/**
 * Delete an installed Ollama model
 */
export async function deleteOllamaModel(
  modelName: string,
  baseUrl: string
): Promise<void> {
  try {
    const res = await axios.delete(`${baseUrl}/api/delete`, {
      data: { name: modelName },
    });
    pullProgressMap.delete(modelName);
  } catch (error) {
    console.error("Error deleting Ollama model:", error);
    throw new Error("Failed to delete Ollama model");
  }
}

/**
 * Check if Ollama is running and accessible
 */
export async function checkOllamaConnection(
  baseUrl: string,
  apiKey?: string
): Promise<boolean> {
  try {
    const response = await axios.get(`${baseUrl}/api/tags`, {
      timeout: 5000,
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });
    return response.status === 200;
  } catch (error) {
    console.error("Ollama connection check failed:", error);
    return false;
  }
}
