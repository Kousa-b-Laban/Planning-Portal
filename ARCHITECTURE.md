# UK Property Intelligence & Planning Permission Platform — Architecture Plan

## Table of Contents

1. [Data Source Audit](#1-data-source-audit)
2. [MVP Scope](#2-mvp-scope)
3. [Architecture Plan](#3-architecture-plan)
4. [System Prompt Strategy](#4-system-prompt-strategy)
5. [Technical Decisions](#5-technical-decisions)
6. [Risks & Unknowns](#6-risks--unknowns)

---

## 1. Data Source Audit

### Confirmed Free APIs

| Data Source | Free? | API Key Required? | Rate Limits | What You Get |
|---|---|---|---|---|
| **Land Registry Price Paid** | Yes (Open Gov Licence) | No | None documented (SPARQL endpoint) | Transaction prices, dates, property type, new/old build, tenure |
| **EPC Register API** | Yes | Yes (register at epc.opendatacommunities.org) | Not officially documented; be conservative (~1 req/sec) | Energy rating, floor area, heating type, wall/roof insulation, recommendations, CO2 emissions |
| **Environment Agency Flood Monitoring** | Yes (Open Gov Licence) | No | Not documented; data updates every 15 min | Flood warnings, flood risk zones, river levels, 3-day flood forecasts |
| **UK Police API** | Yes | No | 15 requests/second per IP, max 10,000 crimes per call | Street-level crime data by location/area, outcomes, neighbourhood info |
| **Companies House API** | Yes | Yes (register at developer.company-information.service.gov.uk) | 600 requests per 5 minutes | Company details, officers, filing history — useful for freeholder/management company lookups |
| **Postcodes.io** | Yes (open source) | No | ~15,000 requests/hour | Postcode geocoding, lat/lng, local authority, parliamentary constituency, nearest postcodes |
| **PlanIt (planning applications)** | Yes | No | Not documented | Planning applications near a point/area from ~90% of UK local authorities |
| **planning.data.gov.uk** | Yes | No | None documented | Planning constraints (conservation areas, listed buildings, tree preservation orders, Article 4 directions) |
| **ONS Open Geography / Nomis** | Yes | Optional (Nomis key raises limits) | 200 req/min (ONS Beta); Nomis: 25k rows without key | Census data, population demographics, area classifications |

### Additional Valuable Sources (Not in Your Original List)

| Source | What It Adds | Notes |
|---|---|---|
| **Postcodes.io** | Geocoding, lat/lng for all other APIs, local authority lookup | Essential glue — almost every other API needs coordinates or an LA code |
| **planning.data.gov.uk** | Conservation areas, listed buildings, Article 4 directions, TPOs | **Critical for chatbot** — tells you if a property has restrictions that change PD rights |
| **Ordnance Survey Data Hub (Open)** | Boundary data, OS Open Names, OS Open Roads | Free tier; useful for maps. Premium tier (UPRNs, detailed addresses) has a free £1,000/month tier |
| **DLUHC Open Data (MHCLG)** | Housing statistics, indices of deprivation | Good for neighbourhood scoring |
| **Ofsted / Get Information About Schools** | School data near a postcode | Useful for the property dashboard (families moving to an area) |
| **TfL / National Rail APIs** | Transport links | Free; good for "how connected is this area" scoring |

### Sources That Are Harder Than Expected

| Source | Issue |
|---|---|
| **Local authority planning portals** | There is **no single national API** for historical planning applications. PlanIt aggregates most but not all councils. For full coverage, you'd need to scrape individual council sites (legally grey, technically fragile). **Recommendation:** Use PlanIt for MVP, accept partial coverage. |
| **Land Registry Title Register** | The *Price Paid* data is free, but the full title register (which tells you freehold vs leasehold definitively) costs £3 per title via the Land Registry Business Gateway. For MVP, infer tenure from Price Paid data (which includes a tenure field for most transactions) and EPC data. |
| **Census 2021 at property level** | Census data is area-level (Output Area, LSOA, MSOA), not property-level. Fine for neighbourhood stats, but won't tell you about a specific property. |

---

## 2. MVP Scope

### Principle: One Postcode, One Page, One Chat

The smallest useful product is: **enter a postcode + select an address → see a property profile → ask the chatbot planning questions about that property.**

### MVP (Phase 1) — Build This First

**Property Lookup & Profile**
- Postcode search (Postcodes.io) → list matching addresses from EPC data
- Property profile page showing:
  - EPC data (energy rating, floor area, property type, heating)
  - Transaction history (Land Registry Price Paid)
  - Flood risk summary (Environment Agency)
  - Planning constraints (planning.data.gov.uk — conservation area, listed building, Article 4)
  - Nearby planning applications (PlanIt)
- Simple, clean single-page layout — no tabs, no complexity

**Planning Permission Chatbot**
- Chat interface on the property profile page (slide-out panel or below the profile)
- Claude API with a structured system prompt covering core PD rights and Building Regs
- Property context automatically injected: "This is a [detached house] in [conservation area: yes/no], [listed: no], [flood zone: 1]..."
- Disclaimer banner: "This is guidance only, not professional advice. Always verify with your local planning authority."

**What's NOT in MVP**
- User accounts / authentication
- Saved properties / search history
- Neighbourhood demographics (ONS/crime/schools)
- Companies House lookups
- Payment / premium features
- PDF report generation
- Mobile app (responsive web only)

### Phase 2 — Layer On After MVP Validates

- Neighbourhood data tab (crime stats, schools, demographics, transport)
- Companies House integration (leasehold management company info)
- Save properties / comparison
- User accounts with saved chat history
- More sophisticated chatbot with RAG over planning policy documents

### Phase 3 — Growth Features

- PDF property reports
- Professional accounts (architects, agents)
- API access for third parties
- Email alerts for new planning applications near saved properties

---

## 3. Architecture Plan

### Tech Stack

| Layer | Choice | Rationale |
|---|---|---|
| Framework | **Next.js 14+ (App Router)** | Your preference; SSR for SEO, API routes for backend, React for UI |
| Styling | **Tailwind CSS** | Fast prototyping, responsive by default, good mobile support |
| AI | **Anthropic Claude API** (claude-sonnet-4-20250514 for MVP) | Your preference; strong reasoning for planning law. Sonnet is cheaper for MVP; upgrade to Opus for complex cases later |
| Database | **None for MVP** → PostgreSQL (Supabase) for Phase 2 | MVP doesn't need persistence — all data is fetched live from APIs. Add a DB when you add user accounts. |
| Caching | **Next.js built-in fetch caching + unstable_cache** | Cache API responses to avoid redundant calls and respect rate limits |
| Hosting | **Vercel** | Zero-config Next.js hosting, generous free tier, edge functions |
| Maps | **Leaflet + OpenStreetMap** (free) | For showing property location, flood zones, nearby planning apps |

### Folder Structure

```
planning-portal/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── layout.tsx                # Root layout (nav, footer, metadata)
│   │   ├── page.tsx                  # Homepage — postcode search
│   │   ├── property/
│   │   │   └── [uprn]/
│   │   │       └── page.tsx          # Property profile page
│   │   ├── api/
│   │   │   ├── property/
│   │   │   │   └── route.ts          # Aggregates all property data from external APIs
│   │   │   ├── search/
│   │   │   │   └── route.ts          # Postcode search → address list
│   │   │   └── chat/
│   │   │       └── route.ts          # Chat endpoint (streams Claude responses)
│   │   └── globals.css
│   ├── components/
│   │   ├── search/
│   │   │   ├── PostcodeSearch.tsx     # Search input + autocomplete
│   │   │   └── AddressList.tsx       # Address picker from search results
│   │   ├── property/
│   │   │   ├── PropertyHeader.tsx    # Address, type, key stats
│   │   │   ├── EPCCard.tsx           # Energy rating display
│   │   │   ├── TransactionHistory.tsx # Price paid timeline
│   │   │   ├── FloodRisk.tsx         # Flood zone indicator
│   │   │   ├── PlanningConstraints.tsx # Conservation area, listed building badges
│   │   │   ├── NearbyPlanning.tsx    # Recent nearby planning applications
│   │   │   └── PropertyMap.tsx       # Leaflet map component
│   │   ├── chat/
│   │   │   ├── ChatPanel.tsx         # Main chat container
│   │   │   ├── ChatMessage.tsx       # Individual message bubble
│   │   │   └── ChatInput.tsx         # Input with send button
│   │   └── ui/
│   │       ├── Card.tsx              # Reusable card wrapper
│   │       ├── Badge.tsx             # Status badges
│   │       └── Skeleton.tsx          # Loading states
│   ├── lib/
│   │   ├── api/
│   │   │   ├── epc.ts               # EPC Register API client
│   │   │   ├── land-registry.ts     # Land Registry SPARQL/API client
│   │   │   ├── flood.ts             # Environment Agency API client
│   │   │   ├── planning.ts          # PlanIt + planning.data.gov.uk client
│   │   │   ├── postcodes.ts         # Postcodes.io client
│   │   │   └── types.ts             # Shared TypeScript types for API responses
│   │   ├── chat/
│   │   │   ├── system-prompt.ts     # System prompt builder (injects property context)
│   │   │   └── message-utils.ts     # Chat message formatting
│   │   └── utils/
│   │       ├── cache.ts             # Caching helpers
│   │       └── formatting.ts        # Currency, date, address formatting
│   └── types/
│       └── property.ts              # Core property types used across the app
├── public/
│   └── ...                           # Static assets
├── tailwind.config.ts
├── next.config.ts
├── tsconfig.json
├── package.json
└── .env.local                        # API keys (EPC, Companies House)
```

### Data Flow

```
User enters postcode
        │
        ▼
[Postcodes.io] → validates postcode, returns lat/lng + local authority
        │
        ▼
[EPC API] → search by postcode → returns list of addresses with LMK keys
        │
        ▼
User selects an address
        │
        ▼
[API route: /api/property] → fires parallel requests:
    ├── [EPC API] → full certificate data for this address
    ├── [Land Registry] → price paid data for this address
    ├── [Environment Agency] → flood risk for lat/lng
    ├── [planning.data.gov.uk] → constraints (conservation area, listed building)
    └── [PlanIt] → nearby planning applications
        │
        ▼
All data merged into a single PropertyProfile object
        │
        ▼
Rendered on the property profile page
        │
        ▼
User opens chat → PropertyProfile context injected into system prompt
        │
        ▼
[Claude API] → streaming response with planning guidance
```

### Key Architecture Decisions

**Why aggregate on the server (API routes) rather than the client?**
- Keeps API keys secret (EPC key, etc.)
- Allows server-side caching
- Single loading state for the user (one API call returns everything)
- Can add rate limiting and error handling centrally

**Why no database for MVP?**
- All data comes from external APIs — we're not creating data, we're aggregating it
- No user accounts means nothing to persist
- Adding a DB later (for user accounts, saved searches, chat history) is straightforward with Supabase/Prisma

**Address identification strategy**
- The EPC API returns addresses with unique LMK_KEY identifiers
- Use this as the property identifier in URLs (or encode postcode + address)
- UPRNs (Unique Property Reference Numbers) would be ideal but require OS Data Hub premium tier
- For MVP, use EPC LMK_KEY as the primary identifier; fall back to postcode + address string matching for Land Registry lookups

---

## 4. System Prompt Strategy

### Recommended Approach: Structured System Prompt (MVP) → RAG (Phase 2)

**For MVP: A well-structured system prompt is sufficient.**

Reasoning:
- UK permitted development rights (the GPDO) and Building Regulations are well-established and change infrequently
- Claude already has strong baseline knowledge of UK planning law from training data
- A system prompt can provide the decision framework without needing to embed entire legislation
- RAG adds significant complexity (vector DB, chunking, retrieval logic) — overkill for MVP

**System Prompt Structure:**

```
1. ROLE & DISCLAIMERS (~200 tokens)
   - You are a UK planning permission assistant
   - Always include disclaimer that this is guidance, not professional advice
   - Recommend consulting local planning authority for definitive answers

2. PROPERTY CONTEXT (dynamically injected, ~100-200 tokens)
   - Property type: [detached/semi/terrace/flat]
   - Conservation area: [yes/no]
   - Listed building: [yes/no, grade]
   - Article 4 direction: [yes/no, restrictions]
   - Flood zone: [1/2/3]
   - Tenure: [freehold/leasehold]
   - Local authority: [name]
   - EPC data: [floor area, current rating]

3. PLANNING KNOWLEDGE FRAMEWORK (~2000-3000 tokens)
   - Permitted Development rights summary (GPDO Schedule 2, Parts 1-3)
     - Part 1: Development within curtilage of dwellinghouse
       - Extensions (rear, side, roof), outbuildings, porches, etc.
       - Key limits: height, depth, floor area, % of curtilage
     - Part 2: Minor operations (gates, fences, walls, painting)
     - Part 3: Changes of use
   - When PD rights are REMOVED:
     - Listed buildings (always need Listed Building Consent)
     - Conservation areas (restricted PD — no cladding, side extensions, roof alterations visible from highway)
     - Article 4 directions (specific PD rights removed)
     - Flats/maisonettes (most Part 1 PD doesn't apply)
     - Conditions on original planning permission
   - Building Regulations: when they apply, what approval means
   - Prior Approval: what it is, when needed, how it differs from full planning

4. RESPONSE FORMAT INSTRUCTIONS (~200 tokens)
   - Structure answers with clear headings
   - Always state: (a) planning permission needed? (b) building regs needed? (c) estimated costs (d) documents needed
   - Flag when conservation area / listed status changes the answer
   - Recommend next steps (e.g., "contact your LPA", "hire a structural engineer")
```

**Total system prompt: ~3,000-4,000 tokens** — well within Claude's context window, leaving plenty of room for conversation.

**When to move to RAG (Phase 2):**
- When you want to cite specific policy paragraphs (e.g., "GPDO Schedule 2, Part 1, Class A, paragraph A.1(f)")
- When you need to cover local planning policies (each council has its own Local Plan)
- When legislation changes and you need to update faster than model retraining
- Documents to index: GPDO, Building Regulations Approved Documents (A-S), NPPF, common Local Plan policies

---

## 5. Technical Decisions

### Decisions to Make Now

| Decision | Recommendation | Rationale |
|---|---|---|
| **Package manager** | pnpm | Faster, stricter, saves disk space |
| **TypeScript** | Yes, strict mode | Catch API response shape issues early |
| **Component library** | None (Tailwind + custom) | Avoid overhead; you only need cards, badges, inputs |
| **State management** | React Server Components + minimal client state | Most data is server-fetched; chat is the only real client state |
| **Chat state** | `useChat` from Vercel AI SDK | Handles streaming, message history, loading states out of the box |
| **HTTP client** | Native `fetch` with Next.js caching | No need for axios; Next.js fetch has built-in caching and revalidation |
| **Environment variables** | `.env.local` for secrets | EPC API key, Anthropic API key, Companies House key |
| **Error handling** | Graceful degradation per data source | If flood API is down, show "unavailable" — don't fail the whole page |
| **Testing** | Vitest + React Testing Library | Lightweight; test API client functions and key components |

### Caching Strategy

This is critical because you're hitting multiple external APIs on every property load.

```
Postcodes.io responses:     Cache 30 days (postcodes don't change)
EPC data:                   Cache 24 hours (certificates update infrequently)
Land Registry Price Paid:   Cache 24 hours (monthly data releases)
Flood risk:                 Cache 1 hour (can change during flood events)
Planning constraints:       Cache 7 days (conservation areas rarely change)
Nearby planning apps:       Cache 1 hour (new applications submitted regularly)
```

Implementation: Use Next.js `fetch` with `next: { revalidate: seconds }` for server-side caching. For MVP this is sufficient. In Phase 2, add Redis (Upstash, free tier on Vercel) for shared caching across serverless functions.

### API Rate Limit Protection

- **Server-side only**: All external API calls go through your API routes, never from the client
- **Request deduplication**: If 10 users look up the same postcode in a minute, cache means only 1 external call
- **Sequential fallback**: If an API returns 429 (rate limited), return cached data or "temporarily unavailable"
- **For the Claude API**: Implement basic rate limiting per IP (e.g., max 10 chat messages per minute per IP) to prevent abuse. Use Vercel's edge middleware or a simple in-memory counter for MVP.

### Cost Estimation (MVP)

| Item | Cost |
|---|---|
| Vercel hosting | Free (hobby tier) |
| External data APIs | Free |
| Claude API (Sonnet) | ~$0.003 per chat message (assuming ~1k input + 500 output tokens avg) |
| Domain name | ~£10/year |
| **Total at 100 users/day, 5 messages each** | **~$1.50/day ($45/month)** |

The main cost driver is Claude API usage. Sonnet keeps this low. If you upgrade to Opus for complex queries, costs increase ~5x.

---

## 6. Risks & Unknowns

### High Priority

**Legal liability for planning advice**
- This is the #1 risk. If someone relies on your chatbot, builds without permission, and faces enforcement action, they could blame your platform.
- **Mitigation**: Prominent disclaimers on every chat response. Terms of service stating this is "informational guidance only, not professional or legal advice." Recommend users verify with their Local Planning Authority. Consider adding "confidence levels" to chatbot responses.
- **Note**: Even professional planning consultants get things wrong. The key is setting expectations.

**Data accuracy and staleness**
- EPC data can be years old. Land Registry data has a ~2 month lag. Planning constraints may not reflect very recent changes.
- **Mitigation**: Always show the "data as of" date. Add disclaimers about data currency. Don't present data as definitive — present it as "last known."

**API reliability and availability**
- You're dependent on 5+ external APIs. Any one being down degrades the experience.
- **Mitigation**: Graceful degradation (show what you can, mark unavailable sections). Caching means recent lookups still work. Health monitoring for external APIs.

### Medium Priority

**Address matching across APIs**
- Different APIs use different address formats. Land Registry says "14 HIGH STREET", EPC says "14, High Street, Flat 2". Matching records across sources for the same property is genuinely hard.
- **Mitigation**: Match on postcode + fuzzy address string matching. Accept that some matches will fail — show "no data found" rather than wrong data. UPRNs solve this perfectly but require OS Data Hub premium.

**Chatbot hallucination on planning specifics**
- Claude may confidently state incorrect permitted development limits (e.g., wrong height limits, wrong floor area thresholds).
- **Mitigation**: The structured system prompt with specific numbers helps anchor responses. In Phase 2, RAG with actual GPDO text provides citations. Consider a "verify this" link to the relevant legislation.

**Conservation area / Article 4 data gaps**
- planning.data.gov.uk is still being populated. Not all conservation areas or Article 4 directions are mapped yet.
- **Mitigation**: When constraint data is missing, the chatbot should say "I couldn't verify whether this property is in a conservation area — please check with [local authority name]" rather than assuming it isn't.

### Lower Priority (But Worth Knowing)

**Scaling costs**
- If the product takes off, Claude API costs scale linearly with users. At 10,000 users/day with 5 messages each, you're looking at ~$450/month just for AI.
- **Mitigation**: Consider caching common Q&A patterns. Use Sonnet for simple questions, Opus only for complex ones. Introduce usage limits or paid tiers.

**GDPR / data privacy**
- You're processing postcodes and addresses which could be considered personal data if linked to a user.
- **Mitigation**: For MVP (no user accounts), you're not storing any personal data. When you add accounts, ensure proper privacy policy, data retention policies, and user deletion capability.

**Competitor risk**
- Rightmove, Zoopla, and others could add similar features. They have the data and the users.
- **Mitigation**: Move fast. The planning chatbot is the differentiator — the big players don't have this. Focus on the chatbot being excellent.

**Scottish / Northern Irish law differences**
- Planning law differs significantly across UK nations. The GPDO applies to England. Scotland has its own GPDO equivalent. Northern Ireland has separate planning legislation.
- **Mitigation**: For MVP, explicitly state "This service covers England and Wales only." Expand to Scotland/NI later with separate system prompt configurations.

---

## Questions for You Before We Start Building

1. **England only or England & Wales for MVP?** Wales has slightly different PD rights. Simplest to start England-only.

2. **Property identification**: Are you comfortable using EPC data as the primary address source? This means properties without an EPC won't appear in search results. (Most residential properties have one, but not all — especially very old or never-sold properties.)

3. **Chat model**: Start with Claude Sonnet (cheaper, faster) or go straight to Opus (smarter but ~5x cost)? Sonnet is likely good enough for most planning queries.

4. **Hosting**: Vercel is the natural choice for Next.js. Any preferences or constraints? (AWS, self-hosted, etc.)

5. **Domain name**: Do you have one in mind? This affects nothing technically but is worth thinking about early.

6. **MVP timeline**: Are you thinking weeks or months? This affects how much we polish vs. ship rough.
