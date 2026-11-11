// jev — TypeSafe Jev decision model as a tool
//
// Jev is a System One classifier (no text generation). It evaluates a `state`
// against typed questions and returns values/probabilities. The Code Mode
// runtime has no environment, so the key must be read here in the server
// process and never passed through the conversation.
//
// Exposed as `jev_decide` natively and as `tools.jev.decide(...)` inside
// Code Mode. Default model is the free variant; set JEV_MODEL in the server
// environment to override (for example `jev-1.13`).

const ENDPOINT = "https://opencode.ai/inference/systemone/v1/systemone"
const DEFAULT_MODEL = process.env.JEV_MODEL || "jev-1.13-free"

// The cluster sets OPENCODE_API_KEY explicitly. Interactive installs usually
// store the Console key as a provider credential instead, so fall back to the
// active connection for either OpenCode integration.
async function resolveKey(ctx) {
  if (process.env.OPENCODE_API_KEY) return process.env.OPENCODE_API_KEY
  for (const integrationID of ["opencode", "opencode-go"]) {
    try {
      const connection = await ctx.integration.connection.active(integrationID)
      if (!connection) continue
      const value = await ctx.integration.connection.resolve(connection)
      if (value && value.type === "key" && value.key) return value.key
    } catch {
      // try the next integration
    }
  }
  return undefined
}

export default {
  id: "jev",
  async setup(ctx) {
    await ctx.tool.transform((editor) => {
      editor.namespace({
        name: "jev",
        description: "TypeSafe Jev decision model for typed classification",
      })
      editor.add({
        name: "decide",
        description:
          "Ask the Jev decision model typed questions about a piece of evidence. " +
          "Returns probability-bearing answers: `noul` (yes/no), `choice`, or `score`.",
        input: {
          type: "object",
          properties: {
            state: {
              type: "string",
              description: "The evidence to evaluate",
            },
            questions: {
              type: "object",
              description:
                "Map of question name to { type: 'noul'|'choice'|'score', instructions, criteria }",
              additionalProperties: { type: "object" },
            },
            model: {
              type: "string",
              description: "Optional Jev model ID; defaults to the free variant",
            },
          },
          required: ["state", "questions"],
          additionalProperties: false,
        },
        options: { namespace: "jev", codemode: true },
        execute: async (input, context) => {
          const key = await resolveKey(ctx)
          if (!key) {
            throw new Error(
              "No OpenCode API key: set OPENCODE_API_KEY or connect the OpenCode provider",
            )
          }

          const response = await fetch(ENDPOINT, {
            method: "POST",
            signal: context.signal,
            headers: {
              authorization: `Bearer ${key}`,
              "content-type": "application/json",
            },
            body: JSON.stringify({
              model: input.model || DEFAULT_MODEL,
              state: input.state,
              questions: input.questions,
            }),
          })

          const text = await response.text()
          if (!response.ok) {
            throw new Error(`Jev request failed: ${response.status} ${text.slice(0, 300)}`)
          }
          return { content: text }
        },
      })
    })
  },
}
