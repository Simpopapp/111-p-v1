// Lições âncora autorizadas (PRD project2 D2 / pacote s1-licoes).
// Conteúdo gerado pelo enxame, integrado pelo agente principal (practiceIds
// sincronizados com src/lib/exercises-data).

import type { Lesson } from "./types";

export const LESSONS_PERFORMANCE: Lesson[] = [
  {
    id: 2,
    rev: "2.1",
    objective:
      "Choose a cache key and freshness policy from a concrete read workload, then predict hits, misses, and stale responses.",
    prereqIds: [],
    mentalModel: {
      definition:
        "Caching stores a reusable result closer to its consumer so later requests can avoid repeated computation or retrieval. Correct reuse depends on the cache key, freshness rules, and access boundaries.",
      analogy:
        "A student writes an answer on a sticky note instead of solving the same problem repeatedly.",
      analogyLimits:
        "The note can become outdated, and two apparently similar questions may depend on different currencies, users, or permissions. Remembering an answer does not establish that reuse is correct.",
      correspondence: [
        ["Cache key", "Label identifying the exact question"],
        ["Cached value", "Written answer"],
        ["TTL or invalidation", "Rule for replacing an outdated note"],
      ],
    },
    scenario: {
      system: "A product catalog using cache-aside reads.",
      data: "A teaching sequence requests the same product in USD at 0, 10, and 20 seconds. A cached value has a 30-second TTL; the source price changes at second 15.",
      symptom:
        "Database reads fall, but the request at second 20 receives the previous display price.",
      constraints: [
        "Catalog display prices may be stale for up to 30 seconds.",
        "Checkout must validate the current price against the authoritative source.",
        "Currency must be part of the cache key.",
      ],
      baseline:
        "Without caching, all three reads reach the database. With the stated cache, one miss loads the value and two hits reuse it.",
    },
    representation: {
      kind: "request-flow",
      caption: "A cache hit avoids a source read but does not prove freshness.",
      data: {
        nodes: [
          { id: "reader", label: "Catalog request" },
          { id: "cache", label: "Cache: product and currency key" },
          { id: "db", label: "Authoritative product store" },
          { id: "response", label: "Display response" },
        ],
        edges: [
          { from: "reader", to: "cache", label: "Look up key" },
          { from: "cache", to: "response", label: "Hit: reuse value" },
          { from: "cache", to: "db", label: "Miss: fetch and populate" },
          { from: "db", to: "response", label: "Return fetched value" },
        ],
        window: { durationMs: 30000, label: "One illustrative TTL" },
        limits: { ttlSeconds: 30, keyDimensions: ["productId", "currency"] },
      },
      textEquivalent:
        "At second 0, a miss loads the USD price. Seconds 10 and 20 are hits. The source changes at second 15, so the second-20 response is stale but within the stated display tolerance.",
    },
    worked: {
      decision:
        "Cache catalog display values by product and currency for 30 seconds, while validating checkout prices independently.",
      reasoning: [
        "Repeated reads of the same key are candidates for reuse because their output dependencies match.",
        "The initial miss performs a database read and stores the result; the next two requests reuse it.",
        "A source update does not automatically invalidate a separate cache, so the second-20 response remains old.",
        "The display policy explicitly accepts bounded staleness; checkout has a different correctness requirement.",
        "Measure hit ratio, miss latency, and stale-value incidents; a high hit ratio alone does not demonstrate correctness.",
      ],
    },
    contrast: [
      {
        alternative: "Invalidate on every product update",
        tradeoff:
          "Can reduce stale reads but introduces delivery, ordering, and race conditions between updates and cache fills.",
        whenNotToUse:
          "Do not assume invalidation guarantees immediate consistency unless the full update-and-read protocol establishes it.",
      },
    ],
    misconceptions: [
      {
        wrong: "A cache key containing the product ID is always sufficient.",
        discriminant:
          "List every input that changes the returned value or who may see it.",
        counterexample:
          "A USD request populates a product-only key; a later EUR request receives the USD amount labeled as EUR.",
      },
    ],
    practiceIds: ["t-2-predict", "t-2-variant"],
    evidenceCriteria: [
      "Classify the three requests as miss, hit, and hit.",
      "Identify the second-20 response as stale and explain why it is permitted only for display.",
      "Include currency in the key and separate checkout correctness from catalog freshness.",
    ],
    transfer: {
      variant:
        "Cache a school timetable while ensuring student-specific accommodations cannot leak through a shared cache key.",
      domain: "Education software",
    },
    provenance: {
      reviewed: false,
      notes:
        "Expanded from canonical concept 2. TTL and request times are teaching values, not recommended production defaults. Independent technical review is pending.",
    },
  },
  {
    id: 27,
    rev: "2.1",
    objective:
      "Detect query-count growth from a request trace and replace per-record relationship fetches with a bounded retrieval plan.",
    prereqIds: [],
    mentalModel: {
      definition:
        "An N+1 query pattern occurs when one query retrieves N records and subsequent code issues an additional query for each record to obtain related data.",
      analogy:
        "A waiter brings ten pancakes, then makes a separate trip for each pancake's butter.",
      analogyLimits:
        "A database join can multiply rows, and one enormous trip may transfer more data than several bounded trips. Fewer queries are not automatically less total work.",
      correspondence: [
        ["Initial list query", "Trip bringing the pancakes"],
        ["Per-record relationship query", "Separate butter trip for each pancake"],
        ["Batch fetch", "One trip carrying the required butter portions"],
      ],
    },
    scenario: {
      system: "A blog feed displaying 20 posts and their authors.",
      data: "The teaching model has five distinct authors and a fixed 4 ms round-trip overhead per sequential query, excluding execution and transfer.",
      symptom:
        "The trace contains one post query followed by 20 author queries.",
      constraints: [
        "The feed remains paginated to 20 posts.",
        "Only author ID and display name are needed.",
        "The solution must preserve posts and their author mapping.",
      ],
      baseline:
        "There are 21 queries and 84 ms of modeled round-trip overhead; repeated authors do not prevent the naive loop from fetching them again.",
    },
    representation: {
      kind: "query-explainer",
      caption: "Compare query-count growth, not just one fast local execution.",
      data: {
        statement:
          "Feed request: SELECT id, author_id, title FROM posts ORDER BY created_at DESC LIMIT 20 — only the author retrieval differs by strategy.",
        versions: [
          {
            label: "Lazy per-post author fetch",
            plan: [
              {
                step: "List posts",
                detail: "SELECT id, author_id, title FROM posts ORDER BY created_at DESC LIMIT 20",
                cost: "1 query · 4 ms",
              },
              {
                step: "Fetch author for each post",
                detail: "SELECT id, display_name FROM authors WHERE id = $1 — issued once per post",
                cost: "20 queries · 80 ms",
              },
            ],
          },
          {
            label: "Batch distinct authors",
            plan: [
              {
                step: "List posts",
                detail: "Same list query; collect the distinct author IDs from the bounded page",
                cost: "1 query · 4 ms",
              },
              {
                step: "Fetch distinct authors in one query",
                detail: "SELECT id, display_name FROM authors WHERE id IN (...)",
                cost: "1 query · 4 ms",
              },
            ],
          },
          {
            label: "Posts joined to authors",
            plan: [
              {
                step: "Single joined query",
                detail: "SELECT p.id, p.title, a.display_name FROM posts p JOIN authors a ON a.id = p.author_id ORDER BY p.created_at DESC LIMIT 20",
                cost: "1 query · 4 ms",
              },
            ],
          },
        ],
        plan: [
          {
            step: "List posts",
            detail: "SELECT id, author_id, title FROM posts ORDER BY created_at DESC LIMIT 20",
            cost: "1 query · 4 ms",
          },
          {
            step: "Fetch distinct authors in one query",
            detail: "SELECT id, display_name FROM authors WHERE id IN (...)",
            cost: "1 query · 4 ms",
          },
        ],
        note: "Sequential queries; 4 ms fixed modeled round-trip overhead; execution and transfer excluded. Overhead estimates, not total latency: a join can multiply rows and change pagination semantics.",
      },
      textEquivalent:
        "For 20 posts, lazy loading issues 21 queries with 84 ms modeled overhead. A distinct-author batch uses two queries and 8 ms; a suitable join uses one query and 4 ms. These are overhead estimates, not total latency predictions.",
    },
    worked: {
      decision:
        "Fetch the page of posts, collect its distinct author IDs, then fetch those authors in one bounded query and map by ID.",
      reasoning: [
        "Count queries within one feed request: one list query plus 20 relationship queries equals 21.",
        "Five distinct authors mean repeated per-post lookups are redundant, but the structural problem is the loop issuing queries.",
        "Collect unique author IDs from the already bounded page; the second query returns at most those five authors.",
        "Map each post to its author without changing post ordering or dropping records with missing optional relationships.",
        "Compare a join as another valid plan, then inspect row volume and execution plans rather than declaring any single query optimal.",
      ],
    },
    contrast: [
      {
        alternative: "Join the required author fields into the post query",
        tradeoff:
          "Can eliminate a round trip, but joins to multiple one-to-many relationships may multiply rows and complicate pagination.",
        whenNotToUse:
          "Do not blindly join every relationship when row multiplication changes page semantics or transfers excessive repeated data.",
      },
    ],
    misconceptions: [
      {
        wrong: "A fast individual query means there is no N+1 problem.",
        discriminant:
          "Measure how query count grows when the number of displayed records grows.",
        counterexample:
          "An author query taking only 4 ms of overhead still contributes 80 ms when issued sequentially for 20 posts.",
      },
    ],
    practiceIds: ["t-27-find-flaw"],
    evidenceCriteria: [
      "Derive N + 1 queries and calculate 21 for 20 posts.",
      "Produce a bounded two-query retrieval plan with correct author mapping.",
      "Explain why query count, row volume, and pagination semantics all matter.",
    ],
    transfer: {
      variant:
        "Replace one remote employee-directory call per payroll row with a bounded batch lookup, preserving missing-employee handling.",
      domain: "Payroll integration",
    },
    provenance: {
      reviewed: false,
      notes:
        "Expanded from canonical concept 27. Latency arithmetic isolates illustrative round-trip overhead and makes no total-performance guarantee. Independent technical review is pending.",
    },
  },
  {
    id: 91,
    rev: "2.1",
    objective:
      "Calculate nearest-rank P50 and P99 from a defined latency sample and distinguish tail evidence from an average.",
    prereqIds: [],
    mentalModel: {
      definition:
        "Latency is elapsed time between defined start and completion events. A percentile summarizes a distribution: under the nearest-rank convention, P99 is the value at rank ceil(0.99 × N) after sorting N observations.",
      analogy:
        "Record the waiting time for every customer in a queue, then inspect the customer near the slow end rather than only the average wait.",
      analogyLimits:
        "A percentile is not the probability that the next customer waits exactly that long, and a small or selectively recorded sample may not represent future traffic. Different percentile conventions can also differ.",
      correspondence: [
        ["Latency observation", "One customer's measured wait"],
        ["P50", "Middle ranked wait"],
        ["P99", "Wait at the 99th-percentile rank"],
      ],
    },
    scenario: {
      system: "A checkout endpoint measured from request arrival to response completion.",
      data: "A teaching sample contains 100 completed requests: 95 at 50 ms, three at 200 ms, and two at 1000 ms.",
      symptom:
        "The mean looks modest while some customers experience a full second of waiting.",
      constraints: [
        "Use nearest-rank percentiles for this exercise.",
        "Report the sample size and measurement boundary.",
        "Track timeouts and failures separately rather than silently omitting them.",
      ],
      baseline:
        "The mean is 73.5 ms, P50 is 50 ms, and P99 is 1000 ms. The mean conceals the magnitude of the slow tail.",
    },
    representation: {
      kind: "latency-histogram",
      caption: "Locate percentile ranks in the cumulative request count.",
      data: {
        unit: "ms",
        bins: [
          { min: 0, max: 100, count: 95, label: "95 observations at 50 ms" },
          { min: 100, max: 500, count: 3, label: "3 observations at 200 ms" },
          { min: 500, max: 1500, count: 2, label: "2 observations at 1000 ms" },
        ],
        sample: { count: 100, values: [{ value: 50, count: 95 }, { value: 200, count: 3 }, { value: 1000, count: 2 }] },
        markers: [
          { label: "P50", value: 50 },
          { label: "Mean", value: 73.5 },
          { label: "P99", value: 1000 },
        ],
        scenario: "Completed checkout requests in one illustrative window",
        note: "Exact repeated values support the arithmetic; coarse bins alone would only bound a percentile.",
      },
      textEquivalent:
        "Sorted ranks 1–95 are 50 ms, ranks 96–98 are 200 ms, and ranks 99–100 are 1000 ms. P50 is rank 50: 50 ms. P99 is rank 99: 1000 ms. Mean: 7350 divided by 100, or 73.5 ms.",
    },
    worked: {
      decision:
        "Report P50, P99, sample size, and failures, then use traces to investigate slow database calls or remote hops.",
      reasoning: [
        "Define the boundary first; browser-perceived latency and server-only latency measure different intervals.",
        "Sort the 100 observations and select rank ceil(0.50 × 100) = 50 for P50.",
        "Select rank ceil(0.99 × 100) = 99 for P99; it falls among the 1000 ms observations.",
        "Compute the mean as (95 × 50 + 3 × 200 + 2 × 1000) / 100 = 73.5 ms.",
        "The distribution demonstrates a tail, not its cause. Correlate slow traces with queries, network hops, and queueing before choosing a fix.",
      ],
    },
    contrast: [
      {
        alternative: "Report only average latency",
        tradeoff:
          "A mean is compact and useful for some aggregate calculations but can hide a small group of very slow requests.",
        whenNotToUse:
          "Do not use the mean alone to judge a user-facing tail-latency objective.",
      },
    ],
    misconceptions: [
      {
        wrong: "The overall P99 is the average of each server's P99.",
        discriminant:
          "Ask whether summaries preserve the weighted underlying distribution.",
        counterexample:
          "Server A handles 990 requests at 10 ms and B handles 10 at 1000 ms. Their P99 average is 505 ms, but combined nearest-rank P99 is 10 ms at rank 990.",
      },
    ],
    practiceIds: ["t-91-predict"],
    evidenceCriteria: [
      "Calculate P50 = 50 ms, P99 = 1000 ms, and mean = 73.5 ms using the stated convention.",
      "Explain why coarse histogram bins cannot reveal exact values without additional information.",
      "Request measurement boundaries, sample sizes, failures, and slow traces before recommending an optimization.",
    ],
    transfer: {
      variant:
        "Measure document-processing turnaround from submission to delivery, including failed jobs, and explain why median completion time alone misses delayed customers.",
      domain: "Administrative workflow analytics",
    },
    provenance: {
      reviewed: false,
      notes:
        "Expanded from canonical concept 91, Latency, with percentiles as its measurement lens. Canonical concept 93 remains distinct. Samples are instructional, not service-level recommendations. Independent technical review is pending.",
    },
  },
  {
    id: 44,
    rev: "2.1",
    objective:
      "Use backlog growth and downstream saturation to choose admission control before assuming more workers will increase useful throughput.",
    prereqIds: [15],
    mentalModel: {
      definition:
        "Backpressure propagates limited consumption capacity upstream so producers slow, pause, or receive explicit rejection. It bounds admitted work; it does not automatically increase capacity or guarantee that producers cooperate.",
      analogy:
        "A receiver asks someone pouring water to slow down before the cup overflows.",
      analogyLimits:
        "Software signals can be delayed or ignored. Rejected producers may retry and amplify load, and accepted work already in the system still needs processing.",
      correspondence: [
        ["Producer rate", "Pouring rate"],
        ["Bounded buffer", "Cup capacity"],
        ["Upstream capacity signal", "Request to slow pouring"],
      ],
    },
    scenario: {
      system: "A research export service shares one saturated storage dependency.",
      data:
        "Offered load is 6 jobs/s and useful completion is 4 jobs/s. Unfinished work begins at 20. Adding workers in a controlled trial leaves completions at 4/s and increases storage waits.",
      symptom:
        "Unfinished work rises to 40 after ten seconds while oldest-job age increases.",
      constraints: [
        "Clients can obey a temporary admission limit and delay requests locally.",
        "No accepted job may be silently discarded.",
        "The shared dependency is already saturated.",
      ],
      baseline:
        "Admitting all 6 jobs/s adds 2 unfinished jobs/s. Admitting 3/s while completing 4/s drains existing work at 1 job/s under the teaching assumptions.",
    },
    representation: {
      kind: "event-track",
      caption:
        "Compare offered, admitted, and completed rates before and after upstream control.",
      data: {
        unit: "s",
        lanes: [
          { id: "load", label: "Offered / admitted work", kind: "signal" },
          { id: "service", label: "Useful service", kind: "signal" },
          { id: "backlog", label: "Unfinished work", kind: "signal" },
        ],
        events: [
          { ts: 0, lane: "load", label: "Offered 6/s; admitted 6/s", kind: "info" },
          { ts: 0, lane: "service", label: "4/s; shared storage saturated", kind: "warn" },
          { ts: 0, lane: "backlog", label: "20 unfinished", kind: "info" },
          { ts: 10, lane: "backlog", label: "40 unfinished", kind: "warn" },
          { ts: 10, lane: "load", label: "Admit 3/s; cooperative clients defer excess", kind: "info" },
          { ts: 20, lane: "backlog", label: "30 unfinished", kind: "success" },
          { ts: 30, lane: "backlog", label: "20 unfinished", kind: "success" },
        ],
        window: { from: 0, to: 30 },
        note:
          "Constant-rate conservation model, not S5 throughput. Deferred client work is outside this backlog and has not disappeared. Real control needs capacity bounds, fairness, retry guidance, and verification of useful completions.",
      },
      textEquivalent:
        "Starting with 20 unfinished jobs, admitting 6/s and completing 4/s yields 40 after ten seconds. At t=10 admission falls to 3/s while service remains 4/s. Unfinished work then falls to 30 at t=20 and 20 at t=30. Excess offered work is deferred by cooperative clients, not silently lost.",
    },
    worked: {
      decision:
        "Bound admission, communicate delay upstream, and verify backlog age and useful completions before adding more workers against the saturated dependency.",
      reasoning: [
        "A rising count and rising oldest age indicate sustained accumulation, not just a brief burst.",
        "The controlled worker trial did not increase useful completions, so worker shortage is not established.",
        "At 6 admitted minus 4 completed, backlog grows by 2/s.",
        "Reducing admitted work to 3/s leaves 1/s of service to drain existing work.",
        "Measure deferred requests and user impact as well as server backlog; moving waiting upstream is a trade-off.",
        "After stabilizing, investigate the shared bottleneck and test whether additional capacity would raise useful throughput.",
      ],
    },
    contrast: [
      {
        alternative: "Add worker capacity after measuring worker saturation",
        tradeoff:
          "Can raise throughput when workers are the bottleneck and dependencies have headroom.",
        whenNotToUse:
          "Do not assume more workers help when a shared dependency is saturated and a controlled trial adds contention rather than completions.",
      },
      {
        alternative: "Keep buffering a short bounded burst",
        tradeoff:
          "Avoids rejecting a temporary surge but requires enough capacity and an acceptable waiting budget.",
        whenNotToUse:
          "Do not retain unbounded work when sustained admission exceeds service or deadlines make the waiting work useless.",
      },
    ],
    misconceptions: [
      {
        wrong: "A larger queue is backpressure.",
        discriminant: "Look for an upstream change in admitted rate.",
        counterexample:
          "Doubling storage while admitting 6/s and completing 4/s only delays overflow; it does not slow producers.",
      },
      {
        wrong: "A falling server backlog proves demand was satisfied.",
        discriminant: "Track rejected and deferred work outside that backlog.",
        counterexample:
          "Admission control lowers server backlog while clients accumulate deferred requests; end-to-end waiting may still be unacceptable.",
      },
    ],
    practiceIds: ["t-44-compare"],
    evidenceCriteria: [
      "Calculate backlog growth and drain rates with explicit boundaries.",
      "Separate offered load from admitted load.",
      "Use downstream saturation evidence before recommending workers.",
      "Name the upstream cost and verify the intervention.",
    ],
    transfer: {
      variant:
        "A video receiver cannot decode incoming frames fast enough. Compare requesting a lower sending rate, bounded buffering, and adding decoder capacity under a fixed network budget.",
      domain: "Live video processing",
    },
    provenance: {
      reviewed: false,
      notes:
        "Canonical concept 44 in Performance. Rates are illustrative; S5 slow mode shows accumulation but does not implement upstream flow control or capacity benchmarking. Independent review is pending.",
    },
  },

  // Lição 93 — P99 Latency (F9, pacote s16; conteúdo do subagente).
  {
  id: 93,
  rev: "3.0",
  objective:
    "Interpret a P99 change from an explicitly defined request distribution and choose what evidence to collect before optimizing a tail.",
  prereqIds: [91, 60, 92],
  mentalModel: {
    definition:
      "P99 is a rank-based summary of a defined set of latency observations. With nearest-rank convention, sort N observations and select rank ceil(0.99 × N). It describes the observed distribution at a stated boundary and window; it does not identify a cause or guarantee future latency.",
    analogy:
      "Imagine arranging every checkout wait from shortest to longest and reading the wait at the 99th position out of 100.",
    analogyLimits:
      "Real traffic is not a fixed queue: request mix, concurrency, time windows, failures, and measurement boundaries change. A percentile rank is not a promise about the next request, and aggregating percentiles alone loses the underlying distribution.",
    correspondence: [
      ["One latency observation", "One measured checkout wait"],
      ["Sorted sample", "Waits arranged shortest to longest"],
      ["Nearest-rank P99", "Value at rank ceil(0.99 × N)"],
    ],
  },
  scenario: {
    system:
      "A checkout service measures end-to-end request latency from gateway receipt to completed response, across a 10-minute window.",
    data:
      "In the baseline window there are 100 completed requests: ranks 1–95 are 100 ms, ranks 96–98 are 200 ms, and ranks 99–100 are 1000 ms. A later comparable window has 100 requests: 95 at 105 ms, three at 250 ms, and two at 2000 ms.",
    symptom:
      "The mean changes from 121 ms to 147.25 ms, while nearest-rank P99 rises from 1000 ms to 2000 ms; the tail worsens more sharply than the average suggests.",
    constraints: [
      "Use nearest-rank convention and state N, boundary, and window whenever reporting the percentile.",
      "The histogram bins are exact-value groups for this teaching sample; coarse production buckets only bound a percentile unless finer data is available.",
      "Completed requests exclude timeouts and failures unless those outcomes are represented separately; never silently treat them as fast or absent without disclosure.",
      "Do not average per-instance or per-window P99 values as a substitute for merging weighted observations or compatible histograms.",
    ],
    baseline:
      "Baseline: 95 × 100 + 3 × 200 + 2 × 1000 = 12,100 ms total, mean 121 ms; rank ceil(0.99 × 100) = 99 is 1000 ms. Later: 95 × 105 + 3 × 250 + 2 × 2000 = 14,725 ms, mean 147.25 ms; rank 99 is 2000 ms.",
  },
  representation: {
    kind: "latency-histogram",
    caption:
      "Read the cumulative counts to locate rank 99; the second window doubles P99 although its mean rises by only about 21.7%.",
    data: {
      unit: "ms",
      bins: [
        { from: 100, to: 100, count: 95 },
        { from: 200, to: 200, count: 3 },
        { from: 1000, to: 1000, count: 2 },
      ],
      sample: [...Array(95).fill(100), ...Array(3).fill(200), ...Array(2).fill(1000)],
      markers: [
        { label: "P50", value: 100, convention: "nearest-rank" },
        { label: "P99", value: 1000, convention: "nearest-rank" },
      ],
      scenario: { label: "Baseline mean", mean: 121 },
      note:
        "Exact repeated values are shown to make ranks auditable. Counts are 95 + 3 + 2 = 100; rank 99 lies in the 1000 ms group. Coarse buckets, small samples, censored failures, and incompatible windows limit inference.",
    },
    textEquivalent:
      "100 observations: ranks 1–95 = 100 ms, 96–98 = 200 ms, 99–100 = 1000 ms. P50 is rank 50 = 100 ms; P99 is rank ceil(0.99 × 100) = 99 = 1000 ms. Mean = (95 × 100 + 3 × 200 + 2 × 1000) / 100 = 121 ms. The later sample has P99 2000 ms and mean 147.25 ms.",
  },
  worked: {
    decision:
      "Treat the P99 increase as a signal to investigate the affected tail, not as proof that a particular component is slow. Compare compatible distributions and traces before selecting an optimization.",
    reasoning: [
      "Fix the measurement boundary, population, time window, and percentile convention before comparing values.",
      "For N = 100, nearest-rank P99 selects rank ceil(99) = 99, not the maximum by definition.",
      "Cumulative counts put rank 99 in the final two observations: 1000 ms at baseline and 2000 ms later.",
      "The mean rises 26.25 ms (about 21.7%), while P99 doubles; the mean alone understates the tail change.",
      "Split or correlate by route, instance, dependency, and trace; inspect timeouts, errors, and traffic mix before attributing cause.",
      "Do not average percentile summaries across servers or windows: use weighted underlying observations or a compatible mergeable distribution.",
    ],
  },
  contrast: [
    {
      alternative: "Report only mean latency",
      tradeoff:
        "The mean is useful for total work and broad trends, but a small slow population can dominate user harm without moving it proportionally.",
      whenNotToUse:
        "Do not use the mean alone to judge a user-facing tail objective or to dismiss a sharp P99 regression.",
    },
    {
      alternative: "Compare only the maximum",
      tradeoff:
        "The maximum surfaces the single most extreme observation but is highly sensitive to sample size and isolated anomalies; P99 summarizes a specified rank instead.",
      whenNotToUse:
        "Do not treat P99 as a replacement for failure counts, nor interpret it as a guarantee about every request.",
    },
  ],
  misconceptions: [
    {
      wrong: "P99 always means the slowest request, or 99% of requests take exactly that long.",
      discriminant:
        "Ask for N, rank convention, sample boundary, and the number of observations above the selected rank.",
      counterexample:
        "For 100 observations with 99 at 100 ms and one at 10,000 ms, nearest-rank P99 is rank 99 = 100 ms; maximum is 10,000 ms. The extreme observation is not automatically P99.",
    },
    {
      wrong: "Averaging instance P99 values or window P99 values gives the combined P99.",
      discriminant:
        "Check whether the underlying counts and weights are preserved; percentile summaries discard distribution detail.",
      counterexample:
        "Instance A serves 990 requests at 10 ms and B serves 10 at 1000 ms. A's P99 is 10 ms and B's is 1000 ms; their simple average is 505 ms, but the combined 1000-request nearest-rank P99 is rank 990 = 10 ms.",
    },
  ],
  practiceIds: ["t-93-compare", "t-93-find-flaw"],
  evidenceCriteria: [
    "Calculate P99 under a named convention from a distribution whose count, boundary, and sample size are explicit.",
    "Explain how P99 and mean can move by different proportions and identify why that changes investigation priority.",
    "Reject a percentile computed only from successful requests when failures/timeouts are material, and request their separate counts or an explicit treatment.",
    "Explain why averaging per-instance/window percentiles can conceal a tail and name a distribution-preserving aggregation approach.",
    "Distinguish a tail signal from causal evidence and select trace or segmentation data to investigate next.",
  ],
  transfer: {
    variant:
      "For a document-rendering pipeline, compare two explicitly sampled submission-to-delivery windows. Include retries, timeouts, and unfinished jobs separately; use the changed P99 to prioritize trace investigation without assuming the renderer is the cause.",
    domain: "Asynchronous document processing",
  },
  provenance: {
    reviewed: false,
    notes:
      "New editorial proposal for canonical concept 93, informed by the existing latency lesson and canonical relationship to composition. Percentiles use nearest-rank examples with explicit instructional samples; examples are not service-level recommendations. Independent technical and editorial review is pending.",
  },
},
];
