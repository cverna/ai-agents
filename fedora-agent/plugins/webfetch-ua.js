// opencode-webfetch-ua
//
// Overrides the built-in `webfetch` tool so it can reach sites protected by
// Anubis (e.g. Fedora's docs and services), while staying as close as possible
// to the built-in tool otherwise.
//
// The built-in tool does not export its HTML renderer, and effect's HTTP
// client captures `globalThis.fetch` before plugins are loaded, so the
// User-Agent cannot be changed without supplying our own `execute`. To keep
// the output identical, the two rendering functions below (`U3` for
// Markdown, `VL` for plain text) are copied verbatim from the bundled
// `opencode2` built-in webfetch (htmlparser2-backed), matching upstream
// packages/core/src/tool/webfetch.ts. The tool description, input schema
// and output schema are left untouched.
//
// Two User-Agents are used:
//
//   1. PRIMARY_USER_AGENT (the built-in webfetch User-Agent) is sent first, so
//      behavior against Cloudflare and other hosts matches the stock tool.
//   2. If the response is an Anubis challenge, the request is retried once with
//      ANUBIS_USER_AGENT, a self-identifying non-browser User-Agent. Fedora's
//      Anubis deployment challenges browser-like User-Agents with a JavaScript
//      proof-of-work that webfetch cannot solve, while allowing self-identifying
//      non-browser clients.
//
// Request handling mirrors the built-in: the same Accept headers, 30s default /
// 120s max timeout, Cloudflare challenge retry (with the "opencode" fallback
// User-Agent), 5MB limit, MIME classification and
// `{ url, contentType, format, output }` result shape.
//
// This is an OpenCode 2 plugin: it default-exports an object with `id` and
// `setup` and is auto-discovered from ~/.config/opencode/plugins/.

import { Parser as bu } from "htmlparser2"

const cg=new Set(["script","style","noscript","iframe","object","embed","meta","link","template"]),R3=new Set(["address","article","aside","details","dialog","div","dl","fieldset","figcaption","figure","footer","form","header","main","nav","p","section","summary"]),Fl=5242880,Gl=Fl-65536;

function U3(e){let t=[],a=[],i=new TextEncoder,r=!1,u="",l="",d=0,m=!1,h=0,A=0,g=!1,b=0,x,q,T=!1,O,z,C,V,ie,ne=0,Z=0,D=0,re,se=(me,Te)=>{if(i.encode(me).byteLength<=Te)return me;let Nt=Array.from(me),je=0,va=Nt.length;while(je<va){let ba=Math.ceil((je+va)/2);if(i.encode(Nt.slice(0,ba).join("")).byteLength<=Te)je=ba;else va=ba-1}return Nt.slice(0,je).join("")},fe=(me,Te=!1)=>{let Nt=Te?Gl:Fl;if(!me||b>=Nt)return;let je=i.encode(me),va=Nt-b,ba=je.byteLength<=va?me:se(me,va);t.push(ba),b+=je.byteLength<=va?je.byteLength:i.encode(ba).byteLength,l=ba.at(-1)??l},xe=(me)=>{let Te=t.length;if(fe(me),t.length>Te)t[t.length-1]={raw:t[t.length-1]}},Ae=(me)=>{let Nt=t.splice(me).map((je)=>typeof je==="string"?je:je.raw).join("");return b-=i.encode(Nt).byteLength,Nt},ye=()=>"> ".repeat(Math.min(8,d)),ke=()=>{if(!m||d===0||ie)return;fe(ye()),m=!1},Be=()=>{if(!r)return;let me=O;if(me&&t.length===me.index+1&&l!==" "&&l!==`
`){let Te=t[me.index];if(typeof Te==="string")t[me.index]=` ${Te}`;b++,me.leadingSpace=!0,r=!1;return}if(l&&l!==`
`&&l!==" ")fe(" ");r=!1},Le=(me,Te=!1)=>{if(Te)Be();if(ke(),u)fe(u),u="";if(q&&!T)fe("["),T=!0;fe(me)},X=()=>{if(q&&T)fe(`](${Ke(q.href)}${Qt(q.title)})`),T=!1;r=!1,fe(`

`),h++,m=d>0,u=C?.indent??""},Ie=(me)=>{if(!q)return;me.suspendedLink=q,X(),q=void 0,T=!1},yt=(me)=>{if(x){x.text+=me;return}for(let Te of me.split(/([\t\n\f\r ]+)/)){if(!Te)continue;if(/^[\t\n\f\r ]+$/.test(Te)){r=!0;continue}if(Be(),ke(),u)fe(u),u="";if(q&&!T)fe("["),T=!0;let Nt=Te.replace(/([\\`*_[\]<>|])/g,"\\$1").replace(/~/g,"\\~").replace(/^([#+-])/,"\\$1").replace(/^(\d+)\./,"$1\\.");fe(Nt,!0)}},Ke=(me)=>me.replace(/([\\()])/g,"\\$1").replace(/[\t\n\r ]+/g,"%20"),Qt=(me)=>me?` "${me.replace(/[\t\n\r ]+/g," ").trim().replace(/([\\"])/g,"\\$1")}"`:"",ii=(me)=>{if(me==="strong"||me==="b")return"**";if(me==="em"||me==="i")return"*";if(me==="s"||me==="strike"||me==="del")return"~~";return},ca=(me)=>{if(me.inline&&!me.text)return;let Te=0,Nt=0,je=0,va=0;for(let $o of me.text)je=$o==="`"?je+1:0,va=$o==="~"?va+1:0,Te=Math.max(Te,je),Nt=Math.max(Nt,va);if(me.inline){let $o="`".repeat(Math.max(1,Te+1)),fn=/^ | $/.test(me.text)&&!/^ +$/.test(me.text)?" ":"";Be(),ke();let ad=i.encode(`${$o}${fn}${fn}${$o}`).byteLength;xe(`${$o}${fn}${se(me.text,Math.max(0,Gl-b-ad))}${fn}${$o}`);return}if(ie){yt(me.text);return}let ba=Te<=Nt?"`":"~",kr=Math.max(3,(ba==="`"?Te:Nt)+1),Ht=ba.repeat(kr);X();let ja=`${Ht}${me.language??""}
`,vr=d>0?ye():"",ln=me.text;for(;;){let $o=`${ja}${ln}${ln.endsWith(`
`)?"":`
`}${Ht}`,fn=vr?$o.replace(/^/gm,vr):$o,ad=i.encode(fn).byteLength;if(b+ad<=Gl){xe(fn),X();return}let Lb=ad-Math.max(0,Gl-b);ln=se(ln,Math.max(0,i.encode(ln).byteLength-Math.ceil(Lb)))}},Iu=new bu({onopentag(me,Te){if(A++,A>1e4){if(a.at(-1)?.suppressed)Z=a.findLastIndex((ja)=>!ja.suppressed)+2;x=void 0,g=!0}if(g){if(cg.has(me))D++;else r=!0;return}let je={suppressed:(a.at(-1)?.suppressed??!1)||cg.has(me)},va="hidden"in Te||Te["aria-hidden"]?.toLowerCase()==="true"||me==="head",ba=re;if(va||ba&&!ba.open&&!ba.summary&&me!=="summary")je.suppressed=!0;if(a.push(je),je.suppressed)return;if(x&&!x.inline){if(me==="br")x.text+=`
`;if(me==="code"&&Te.class)x.language=Te.class.match(/(?:language-|lang-)([^\s]+)/)?.[1];return}if(me==="details"){je.details={open:"open"in Te,summary:!1,previous:re},re=je.details,X();return}if(me==="summary"){if(ba)ba.summary=!0;X();return}if(me==="pre"){Ie(je),je.code={inline:!1,text:""},x=je.code;return}if(me==="code"){if(x?.inline)return;je.code={inline:!0,text:""},x=je.code;return}if(/^h[1-6]$/.test(me)){X(),Le(`${"#".repeat(Number(me[1]))} `);return}if(R3.has(me)){if(Ie(je),me==="p"&&l===" ")return;X();return}if(me==="br"){r=!1,Le(`  
`),m=d>0;return}if(me==="hr"){X(),Le("---"),X();return}let kr=ii(me);if(kr){Le(kr,!0),je.marker={index:t.length-1,block:h,previous:O},O=je.marker;return}if(me==="a"){if(q&&x?.inline){let Ht=a.findLast((ja)=>ja.link===q&&ja.linkCode===x);if(Ht){if(ca(x),T)fe(`](${Ke(q.href)}${Qt(q.title)})`);x=Ht.resumedCode,Ht.link=void 0,Ht.linkCode=void 0,q=void 0,T=!1}}if(x?.inline){if(je.resumedCode=x,x.text)ca(x);x.text="",x=void 0,je.link={href:Te.href??"",title:Te.title},q=je.link,T=!0,Le("[",!0),je.linkCode={inline:!0,text:""},x=je.linkCode;return}if(q){if(T)fe(`](${Ke(q.href)}${Qt(q.title)})`);let Ht=a.findLast((ja)=>ja.link===q);if(Ht)Ht.link=void 0;q=void 0,T=!1}return je.link={href:Te.href??"",title:Te.title},q=je.link,T=!0,Le("[",!0)}if(me==="img"){let Ht=(Te.alt??"").replace(/([\\\]])/g,"\\$1"),ja=`](${Ke(Te.src??"")}${Qt(Te.title)})`,vr="![",ln=Gl-b-i.encode("!["+ja).byteLength;Le(`![${se(Ht,Math.max(0,ln))}${ja}`,!0);return}if(me==="blockquote"){Ie(je),X(),d++,m=!0;return}if(me==="ul"||me==="ol"){Ie(je);let Ht=Number.parseInt(Te.start??"1");je.list={ordered:me==="ol",next:Number.isNaN(Ht)?1:Ht,previous:z},z=je.list,X();return}if(me==="li"){X();let Ht=Number.parseInt(Te.value??"");if(z?.ordered&&!Number.isNaN(Ht))z.next=Ht;let ja=z?.ordered?`${z.next++}.`:"-",vr=`${(C?.indent??"").slice(0,24)}${ja} `;je.item={indent:" ".repeat(vr.length),previous:C},C=je.item,u="",Le(vr);return}if(me==="table"){if(Ie(je),ne++,ne===1)X(),je.table={start:t.length,rows:[],fallback:!1,previous:V},V=je.table;else r=!0;return}if(me==="tr"){if(ne!==1){r=!0;return}if(V)V.row=[];return}if(me==="th"||me==="td"){if(ne!==1){r=!0;return}if(Te.colspan||Te.rowspan)V.fallback=!0;je.cell={start:t.length},ie=je.cell;return}if(me==="caption"){je.caption={start:t.length};return}if(me==="dt"){X(),Le("**");return}if(me==="dd"){Le(`
: `);return}},ontext(me){if(g){if(Z===0&&D===0)yt(me);return}if(a.at(-1)?.suppressed)return;yt(me)},onclosetag(me){if(A--,g){if(D>0&&cg.has(me))D--;if(Z>0&&A<Z)Z=0;return}let Te=a.pop();if(!Te||Te.suppressed)return;if(Te.linkCode){if(q!==Te.link||!T){if(Te.resumedCode.text+=Te.linkCode.text,x=Te.resumedCode,q===Te.link)q=void 0;T=!1;return}if(x=void 0,ca(Te.linkCode),Te.link&&T)fe(`](${Ke(Te.link.href)}${Qt(Te.link.title)})`);q=void 0,T=!1,x=Te.resumedCode;return}if(x&&!x.inline&&!Te.code)return;if(Te.code){if(x=void 0,ca(Te.code),Te.suspendedLink)q=Te.suspendedLink;return}if(me==="summary"){if(re)re.summary=!1;return X()}if(me==="details")return re=Te.details?.previous,X();if(me==="dt"){Le("**");return}if(me==="dd")return X();let Nt=ii(me);if(Nt){let je=r;if(r=!1,Te.marker)O=Te.marker.previous;if(Te.marker&&(Te.marker.block!==h||t.length===Te.marker.index+1)){t[Te.marker.index]="",r=je||Te.marker.leadingSpace===!0;return}Le(Nt),r=je||Te.marker?.leadingSpace===!0;return}if(me==="a"){if(Te.link&&(q===Te.link||!q)){if(q=Te.link,T||l&&l!==`
`)fe(`](${Ke(Te.link.href)}${Qt(Te.link.title)})`);T=!1,q=void 0}return}if(/^h[1-6]$/.test(me)||R3.has(me)){if(X(),Te.suspendedLink)q=Te.suspendedLink;return}if(me==="blockquote"){if(d--,X(),Te.suspendedLink)q=Te.suspendedLink;return}if(me==="li")return C=Te.item?.previous,X();if(me==="ul"||me==="ol"){if(z=Te.list?.previous,X(),Te.suspendedLink)q=Te.suspendedLink;return}if((me==="th"||me==="td")&&ne===1){if(ie=void 0,Te.cell){let je=Ae(Te.cell.start).replace(/[\t\r\n ]+/g," ").trim().replace(/(?<!\\)\|/g,"\\|");V?.row?.push(je)}return}if(me==="tr"){if(ne!==1)return;if(V?.row)V.rows.push(V.row);if(V)V.row=void 0;r=!0;return}if(me==="caption"&&Te.caption&&V){V.caption=Ae(Te.caption.start).replace(/[\t\r\n ]+/g," ").trim();return}if(me==="table"){if(ne--,ne===0){let je=Te.table;if(V=je?.previous,je){let va=Ae(je.start).replace(/[\t\r\n ]+/g," ").trim(),ba=je.rows[0]?.length??0,kr=ba>0&&je.rows.every((Ht)=>Ht.length===ba);if(va)fe(va),X();if(je.caption)fe(je.caption),X();if(!je.fallback&&kr){let Ht=`${d>0?ye():""}${u}`;u="",fe(`${Ht}| ${je.rows[0].join(" | ")} |
${Ht}|${" --- |".repeat(ba)}`);for(let ja of je.rows.slice(1))fe(`
${Ht}| ${ja.join(" | ")} |`)}else for(let[Ht,ja]of je.rows.entries()){if(Ht>0)X();fe(ja.join(" | "))}}if(X(),Te.suspendedLink)q=Te.suspendedLink;return}r=!0}}});for(let me=0;me<e.length;me+=65536)Iu.write(e.slice(me,me+65536));Iu.end();let Wu=[],un="",Jl=()=>{if(!un)return;let me=un.replace(/[ \t]+\n/g,(Te)=>Te.startsWith("  ")?`  
`:`
`).replace(/\n{3,}/g,`

`).split(`
`);Wu.push(me.map((Te,Nt)=>{if(Te)return Te;let je=me[Nt-1]?.match(/^(?:> )+/)?.[0],va=me[Nt+1]?.match(/^(?:> )+/)?.[0];if(!je||!va||je.length===va.length)return Te;return"> ".repeat(Math.min(je.length,va.length)/2).trimEnd()}).join(`
`)),un=""};for(let me of t){if(typeof me!=="string"){Jl(),Wu.push(me.raw);continue}un+=me}return Jl(),se(Wu.join("").trim(),Fl)}

function VL(e){let t="",a=0,i=new bu({onopentag(r){if(a>0||["script","style","noscript","iframe","object","embed"].includes(r))a++},ontext(r){if(a===0)t+=r},onclosetag(){if(a>0)a--}});return i.write(e),i.end(),t.trim()}

// Sent first; identical to the built-in webfetch User-Agent.
const PRIMARY_USER_AGENT =
  "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; OpenCode-User/1.0; +https://opencode.ai"

// Retried once when the primary request is served an Anubis challenge.
// Self-identifying and non-browser, which Fedora's Anubis allows.
const ANUBIS_USER_AGENT = "FedoraAgent/1.0 (+https://github.com/cverna/ai-agents)"

const MAX_RESPONSE_SIZE = 5 * 1024 * 1024
const DEFAULT_TIMEOUT_SECONDS = 30
const MAX_TIMEOUT_MS = 120 * 1000

function acceptHeader(format) {
  switch (format) {
    case "markdown":
      return "text/markdown;q=1.0, text/x-markdown;q=0.9, text/plain;q=0.8, text/html;q=0.7, */*;q=0.1"
    case "text":
      return "text/plain;q=1.0, text/markdown;q=0.9, text/html;q=0.8, */*;q=0.1"
    case "html":
      return "text/html;q=1.0, application/xhtml+xml;q=0.9, text/plain;q=0.8, text/markdown;q=0.7, */*;q=0.1"
    default:
      return "*/*"
  }
}

function buildHeaders(format, userAgent) {
  return {
    "User-Agent": userAgent,
    Accept: acceptHeader(format),
    "Accept-Language": "en-US,en;q=0.9",
  }
}

function isCloudflareChallenge(error) {
  if (!error || typeof error !== "object") return false
  return error.status === 403 && error.headers && error.headers["cf-mitigated"] === "challenge"
}

async function doFetch(url, format, timeoutMs, userAgent) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: buildHeaders(format, userAgent),
    })
    if (!response.ok) {
      const error = new Error(`Request failed with status ${response.status}`)
      error.status = response.status
      error.headers = Object.fromEntries(response.headers.entries())
      throw error
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

const mimeFrom = (contentType) => contentType.split(";", 1)[0]?.trim().toLowerCase() ?? ""
const isImageAttachment = (mime) =>
  mime.startsWith("image/") && mime !== "image/svg+xml" && mime !== "image/vnd.fastbidsheet"
const isTextualMime = (mime) =>
  !mime ||
  mime.startsWith("text/") ||
  mime === "application/json" ||
  mime.endsWith("+json") ||
  mime === "application/xml" ||
  mime.endsWith("+xml") ||
  mime === "application/javascript" ||
  mime === "application/x-javascript"

function renderContent(content, contentType, format) {
  if (!contentType.includes("text/html")) return content
  if (format === "markdown") return U3(content)
  if (format === "text") return VL(content)
  return content
}

// Anubis serves its JavaScript proof-of-work challenge as HTTP 200 text/html.
// `anubis_challenge` is the marker Anubis's own tests assert on.
function isAnubisChallenge(contentType, body) {
  return contentType.includes("text/html") && body.includes('id="anubis_challenge"')
}

async function attemptFetch(url, format, timeoutMs, userAgent) {
  const response = await fetchWithCloudflareRetry(url, format, timeoutMs, userAgent)

  const contentLength = response.headers.get("content-length")
  if (contentLength && Number.parseInt(contentLength, 10) > MAX_RESPONSE_SIZE) {
    throw new Error(`Response too large (exceeds ${MAX_RESPONSE_SIZE} byte limit)`)
  }

  const arrayBuffer = await response.arrayBuffer()
  if (arrayBuffer.byteLength > MAX_RESPONSE_SIZE) {
    throw new Error(`Response too large (exceeds ${MAX_RESPONSE_SIZE} byte limit)`)
  }

  const contentType = response.headers.get("content-type") || ""
  const mime = mimeFrom(contentType)
  if (isImageAttachment(mime)) throw new Error(`Unsupported fetched image content type: ${mime}`)
  if (!isTextualMime(mime)) throw new Error(`Unsupported fetched file content type: ${mime}`)

  const body = new TextDecoder().decode(arrayBuffer)
  return { contentType, body, anubis: isAnubisChallenge(contentType, body) }
}

async function executeWebfetch(input) {
  const url = input.url
  const format = input.format || "markdown"
  const timeoutMs = Math.min((input.timeout ?? DEFAULT_TIMEOUT_SECONDS) * 1000, MAX_TIMEOUT_MS)

  try {
    if (typeof url !== "string" || !/^https?:\/\//i.test(url)) {
      throw new Error("URL must use http:// or https://")
    }

    // Both attempts share one timeout budget, like the built-in tool.
    const deadline = Date.now() + timeoutMs
    const remaining = () => Math.max(1, deadline - Date.now())

    let result = await attemptFetch(url, format, remaining(), PRIMARY_USER_AGENT)
    if (result.anubis) {
      result = await attemptFetch(url, format, remaining(), ANUBIS_USER_AGENT)
    }

    const rendered = renderContent(result.body, result.contentType, format)
    const output = { url, contentType: result.contentType, format, output: rendered }
    return { output, content: rendered, metadata: { contentType: result.contentType } }
  } catch (error) {
    throw new Error(`Unable to fetch ${url}`, { cause: error })
  }
}

export default {
  id: "webfetch-ua",
  async setup(ctx) {
    await ctx.tool.transform((editor) => {
      editor.update("webfetch", (tool) => {
        tool.execute = async (input) => executeWebfetch(input)
      })
    })
  },
}
