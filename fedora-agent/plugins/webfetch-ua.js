// opencode-webfetch-ua
//
// Overrides the built-in `webfetch` tool so that its HTTP `User-Agent`
// header is configurable, while keeping the same tool name, parameters,
// and behavior. The agent keeps calling `webfetch` exactly as before;
// only the request `User-Agent` changes.
//
// Configuration precedence:
//   1. Plugin `options.userAgent` (from the `plugin` config entry)
//   2. OPENCODE_WEBFETCH_USER_AGENT environment variable
//   3. The built-in default Chrome User-Agent
//
// This is a V1-style OpenCode plugin. It exports the named
// `WebfetchUserAgentPlugin` function returning `{ tool: { webfetch } }`
// (see https://opencode.ai/docs/plugins/).

const DEFAULT_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36"

const MAX_RESPONSE_SIZE = 5 * 1024 * 1024
const DEFAULT_TIMEOUT_MS = 30 * 1000
const MAX_TIMEOUT_MS = 120 * 1000

const DESCRIPTION =
  "Fetch content from an HTTP or HTTPS URL and return it as text, markdown, or HTML. " +
  "Large responses (over 5MB) are rejected. Use this for reading web pages and online documentation."

const JSON_SCHEMA = {
  type: "object",
  properties: {
    url: { type: "string", description: "The URL to fetch content from" },
    format: {
      type: "string",
      enum: ["text", "markdown", "html"],
      description: "The format to return the content in. Defaults to markdown.",
    },
    timeout: { type: "number", description: "Optional timeout in seconds (max 120)" },
  },
  required: ["url"],
  additionalProperties: false,
}

function resolveUserAgent(options) {
  if (options && typeof options.userAgent === "string" && options.userAgent.length > 0) {
    return options.userAgent
  }
  const fromEnv = process.env.OPENCODE_WEBFETCH_USER_AGENT
  if (typeof fromEnv === "string" && fromEnv.length > 0) return fromEnv
  return DEFAULT_USER_AGENT
}

function acceptHeader(format) {
  switch (format) {
    case "markdown":
      return "text/markdown;q=1.0, text/x-markdown;q=0.9, text/plain;q=0.8, text/html;q=0.7, */*;q=0.1"
    case "text":
      return "text/plain;q=1.0, text/markdown;q=0.9, text/html;q=0.8, */*;q=0.1"
    case "html":
      return "text/html;q=1.0, application/xhtml+xml;q=0.9, text/plain;q=0.8, text/markdown;q=0.7, */*;q=0.1"
    default:
      return "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8"
  }
}

function headers(format, userAgent) {
  return {
    "User-Agent": userAgent,
    Accept: acceptHeader(format),
    "Accept-Language": "en-US,en;q=0.9",
  }
}

function isCloudflareChallenge(error) {
  if (!error || typeof error !== "object" || !("status" in error)) return false
  return error.status === 403 && error.headers && error.headers["cf-mitigated"] === "challenge"
}

async function doFetch(url, format, timeoutMs, userAgent) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: headers(format, userAgent),
    })
    if (!response.ok) {
      const err = new Error(`Request failed with status ${response.status}`)
      err.status = response.status
      err.headers = Object.fromEntries(response.headers.entries())
      throw err
    }
    return response
  } catch (error) {
    if (error.name === "AbortError") throw new Error("Request timed out")
    throw error
  } finally {
    clearTimeout(timer)
  }
}

async function fetchWithCloudflareRetry(url, format, timeoutMs, userAgent) {
  try {
    return await doFetch(url, format, timeoutMs, userAgent)
  } catch (error) {
    if (isCloudflareChallenge(error)) return doFetch(url, format, timeoutMs, "opencode")
    throw error
  }
}

function extractTextFromHTML(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, " ")
    .replace(/<object[\s\S]*?<\/object>/gi, " ")
    .replace(/<embed[\s\S]*?<\/embed>/gi, " ")
    .replace(/<head[\s\S]*?<\/head>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim()
}

function htmlToMarkdown(html) {
  let out = html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<head[\s\S]*?<\/head>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")

  out = out
    .replace(/<hr[^>]*>/gi, "\n\n---\n\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|section|article|header|footer|li|tr|blockquote|h[1-6])>/gi, "\n\n")
    .replace(/<li[^>]*>/gi, "\n- ")
    .replace(/<\/(ul|ol)>/gi, "\n")
    .replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, "\n\n# $1\n\n")
    .replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, "\n\n## $1\n\n")
    .replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, "\n\n### $1\n\n")
    .replace(/<h4[^>]*>([\s\S]*?)<\/h4>/gi, "\n\n#### $1\n\n")
    .replace(/<h5[^>]*>([\s\S]*?)<\/h5>/gi, "\n\n##### $1\n\n")
    .replace(/<h6[^>]*>([\s\S]*?)<\/h6>/gi, "\n\n###### $1\n\n")
    .replace(/<pre[^>]*>([\s\S]*?)<\/pre>/gi, "\n\n```\n$1\n```\n\n")
    .replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, "`$1`")
    .replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, (_m, inner) => "\n" + inner.replace(/^/gm, "> ") + "\n\n")
    .replace(/<a\s+[^>]*href=["']([^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi, "[$2]($1)")
    .replace(/<(strong|b)>([\s\S]*?)<\/\1>/gi, "**$2**")
    .replace(/<(em|i)>([\s\S]*?)<\/\1>/gi, "*$2*")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
  return out.replace(/\n{3,}/g, "\n\n").replace(/[ \t]+\n/g, "\n").trim()
}

function renderContent(content, contentType, format) {
  const isHtml = contentType.includes("text/html")
  if (format === "html") return content
  if (format === "text") return isHtml ? extractTextFromHTML(content) : content
  return isHtml ? htmlToMarkdown(content) : content
}

async function executeWebfetch(input, userAgent) {
  const url = input.url
  const format = input.format || "markdown"
  const timeoutMs = Math.min((input.timeout ?? DEFAULT_TIMEOUT_MS / 1000) * 1000, MAX_TIMEOUT_MS)

  if (typeof url !== "string" || !/^https?:\/\//i.test(url)) {
    throw new Error("URL must start with http:// or https://")
  }

  const response = await fetchWithCloudflareRetry(url, format, timeoutMs, userAgent)
  const contentLength = response.headers.get("content-length")
  if (contentLength && parseInt(contentLength, 10) > MAX_RESPONSE_SIZE) {
    throw new Error("Response too large (exceeds 5MB limit)")
  }

  const arrayBuffer = await response.arrayBuffer()
  if (arrayBuffer.byteLength > MAX_RESPONSE_SIZE) {
    throw new Error("Response too large (exceeds 5MB limit)")
  }

  const contentType = response.headers.get("content-type") || ""
  const mime = contentType.split(";")[0]?.trim().toLowerCase() || ""
  const title = `${url} (${contentType})`

  if (mime.startsWith("image/")) {
    const base64 = Buffer.from(new Uint8Array(arrayBuffer)).toString("base64")
    return {
      title,
      output: "Image fetched successfully",
      metadata: {},
      attachments: [{ type: "file", mime, url: `data:${mime};base64,${base64}` }],
    }
  }

  const text = new TextDecoder().decode(arrayBuffer)
  const rendered = renderContent(text, contentType, format)
  return { title, output: rendered, metadata: {} }
}

// ---------------------------------------------------------------------------
// V1 entry point (named export)
// See https://opencode.ai/docs/plugins/
//
// `@opencode-ai/plugin` is imported dynamically so the file works even when
// the package is only installed in the OpenCode config directory.
// ---------------------------------------------------------------------------

export const WebfetchUserAgentPlugin = async (_input, options) => {
  const userAgent = resolveUserAgent(options)
  let tool, schema
  try {
    const plugin = await import("@opencode-ai/plugin")
    tool = plugin.tool
    schema = plugin.tool.schema
  } catch {
    throw new Error(
      "webfetch-user-agent: @opencode-ai/plugin is required for the V1 plugin entry. " +
        "Install it in your OpenCode config directory (bun add @opencode-ai/plugin).",
    )
  }

  return {
    tool: {
      webfetch: tool({
        description: DESCRIPTION,
        args: {
          url: schema.string().describe("The URL to fetch content from"),
          format: schema
            .enum(["text", "markdown", "html"])
            .optional()
            .describe("Output format (defaults to markdown)"),
          timeout: schema.number().optional().describe("Optional timeout in seconds (max 120)"),
        },
        async execute(input) {
          return executeWebfetch(input, userAgent)
        },
      }),
    },
  }
}
