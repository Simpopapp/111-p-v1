import type { Task } from "@/lib/exercises";

// Tarefas de prática âncora de Performance (PRD project2 D8 / pacote s3-exercicios).
// Tarefas F9 (pacote s16; conteúdo do subagente).
const TASKS_93_F9: Task[] = [
  {
    id: "t-93-compare",
    conceptId: 93,
    type: "compare",
    prompt:
      "Compare the two checkout windows. Which conclusion best supports the next engineering decision? Choose one.",
    context:
      "Both windows contain 100 completed requests measured from gateway receipt to response completion, using nearest-rank percentiles. Window A: 95 at 100 ms, 3 at 200 ms, 2 at 1000 ms (mean 121 ms, P99 1000 ms). Window B: 95 at 105 ms, 3 at 250 ms, 2 at 2000 ms (mean 147.25 ms, P99 2000 ms). Failures and timeouts are reported separately and have not changed between windows.",
    options: [
      { key: "a", label: "The mean rose about 21.7% but P99 doubled; investigate the tail using traces and segmentation before attributing cause." },
      { key: "b", label: "The mean rose only modestly, so the tail is effectively unchanged and no investigation is warranted." },
      { key: "c", label: "The P99 doubling proves the database is the cause; optimize database queries immediately." },
      { key: "d", label: "Average the two P99 values to decide the combined system's P99." },
    ],
    rubric: {
      criteria: [
        {
          key: "tail-change-and-causality",
          label: "Recognizes the disproportionate tail change without claiming a cause",
          cause:
            "The response either lets the mean conceal a doubled P99 or mistakes a percentile signal for causal evidence.",
          check: (a) => a.picked?.length === 1 && a.picked[0] === "a",
        },
      ],
      expected:
        "P99 rises from 1000 to 2000 ms (2×), while mean rises from 121 to 147.25 ms (about 21.7%). This makes tail-focused investigation worthwhile, but the distribution alone cannot identify the responsible dependency. Compare traces, routes, instances, and workload before choosing a fix.",
      nextStep:
        "Choose a segmentation (route, instance, or dependency) and state what trace evidence would distinguish queueing from a slow downstream call.",
    },
    helpLevels: [
      "Compare rank 99 in both sorted samples, separately from the arithmetic mean.",
      "The mean changes by 26.25 ms; P99 changes from 1000 to 2000 ms. Ask whether that proves a specific cause.",
      "Select the option that prioritizes investigation of the tail but requires traces/segmentation before naming a culprit.",
    ],
  },
  {
    id: "t-93-find-flaw",
    conceptId: 93,
    type: "find-flaw",
    prompt:
      "Identify the main flaw in this reliability report and choose the best correction.",
    context:
      "A service reports P99 = 80 ms from successful requests only. During the same window, 4% of requests timed out and were omitted. The dashboard then averages the P99 summaries of two unequal-volume instances to claim the fleet P99 is 80 ms. One instance handled 990 successful requests at 10 ms; the other handled 10 at 1000 ms.",
    options: [
      { key: "a", label: "The report is sound because P99 already includes timeouts and weighting." },
      { key: "b", label: "Both selection and aggregation are flawed: disclose timeouts and population, then merge compatible weighted distributions or observations rather than averaging P99 summaries." },
      { key: "c", label: "Use the maximum latency as the fleet P99; it always equals nearest-rank P99." },
      { key: "d", label: "Average the instance P99 values after weighting each instance equally, regardless of request volume." },
    ],
    rubric: {
      criteria: [
        {
          key: "population-and-aggregation",
          label: "Detects successful-only selection and invalid averaging of percentile summaries",
          cause:
            "The response assumes omitted failures are represented in a successful-only sample, or assumes percentile summaries can be combined arithmetically without preserving request counts and distributions.",
          check: (a) => a.picked?.length === 1 && a.picked[0] === "b",
        },
      ],
      expected:
        "A successful-only P99 is conditional on completing requests and hides the 4% timeouts; report their count/rate and define their treatment. The fleet calculation also cannot average instance P99s. With the stated 990 requests at 10 ms and 10 at 1000 ms, combined nearest-rank P99 at rank 990 is 10 ms, while the simple average of instance P99s (10 and 1000 ms) is 505 ms. Preserve weights and distribution using merged observations or compatible histogram/sketch data; disclose approximation and window alignment.",
      nextStep:
        "Rewrite the report header with population, window, boundary, convention, failures, and aggregation method before using it for a decision.",
    },
    helpLevels: [
      "Ask which requests are absent from the successful-only sample and whether the two instances handled equal volume.",
      "A percentile summarizes its input population; omitted timeouts cannot affect its rank. Percentile summaries also do not retain all counts/distribution detail.",
      "Choose the correction that reports failures and combines weighted underlying distributions, not per-instance P99 numbers.",
    ],
  },
];

export const TASKS_PERFORMANCE: Task[] = [
  {
    id: "t-2-predict",
    conceptId: 2,
    type: "predict",
    prompt:
      "Before observing the requests, predict the values returned at t=20 and t=31 seconds. Choose one.",
    context:
      "At t=0, a product read puts price $40 in a cache with a 30-second TTL. At t=10, an administrator changes the database price to $45. Writes do not invalidate this cache. A read uses an unexpired entry; otherwise it fetches the current database value and caches it. No other reads or writes occur, and reads do not extend the TTL.",
    options: [
      { key: "a", label: "$45 at t=20; $45 at t=31." },
      { key: "b", label: "$40 at t=20; $40 at t=31." },
      { key: "c", label: "$40 at t=20; $45 at t=31." },
      { key: "d", label: "$45 at t=20; $40 at t=31." },
    ],
    rubric: {
      criteria: [
        {
          key: "choice-freshness",
          label: "Track cache lifetime independently from database updates.",
          cause:
            "The prediction assumes a database write refreshes a separate cache automatically, or assumes a cache hit extends a fixed TTL despite the stated policy.",
          check: (a) => a.picked?.length === 1 && a.picked[0] === "c",
        },
      ],
      expected:
        "The t=20 request returns the unexpired cached $40. By t=31 the entry has expired, so the read fetches $45 from the database. This reduces repeated database work while allowing stale reads before expiry.",
      nextStep:
        "Add write-time invalidation to the timeline and identify which response changes.",
    },
    helpLevels: [
      "Draw separate timelines for the database value and the cached value.",
      "A write changes only the database in this scenario; the original cache expiry is still t=30.",
      "Evaluate each read against that expiry before deciding whether it reaches the database.",
    ],
  },
  {
    id: "t-2-variant",
    conceptId: 2,
    type: "variant",
    prompt:
      "Transfer the cache reasoning to museum audio guides. Which policy meets the requirement while avoiding a database read for every play? Choose one.",
    context:
      "Unlike the product-price scenario, this system serves exhibit descriptions. Ordinary edits may remain stale for up to 120 seconds. All description reads use one shared cache. Safety closures use a separate uncached alert channel. Writes cannot reliably publish invalidation events. Cache entries can have a fixed lifetime measured from their database fetch.",
    options: [
      { key: "a", label: "Cache descriptions for 10 minutes after each database fetch." },
      {
        key: "b",
        label:
          "Cache descriptions for 90 seconds after each database fetch, without extending expiry on hits.",
      },
      { key: "c", label: "Cache descriptions for 90 seconds after their most recent cache hit." },
    ],
    rubric: {
      criteria: [
        {
          key: "choice-staleness",
          label: "Bound stale descriptions independently of reading frequency.",
          cause:
            "The policy either exceeds the permitted stale interval or restarts expiry on cache hits, allowing a popular description to remain stale indefinitely without invalidation.",
          check: (a) => a.picked?.length === 1 && a.picked[0] === "b",
        },
      ],
      expected:
        "A fixed 90-second lifetime bounds stale reuse below the 120-second allowance while serving repeated plays from cache. Sliding expiry can keep a popular old entry alive indefinitely. The separate alert channel carries the stricter safety requirement.",
      nextStep:
        "Place an edit immediately after a cache fill, then simulate continuous plays until the next database fetch.",
    },
    helpLevels: [
      "The changed domain still has the same two stores: an authoritative database and a reusable copy.",
      "Look for an expiry rule that frequent reads cannot postpone.",
      "Test the worst case: an edit just after a cache fill followed by a steady stream of plays.",
    ],
  },
  {
    id: "t-27-find-flaw",
    conceptId: 27,
    type: "find-flaw",
    prompt:
      "Find the change that removes the page-size-dependent database round trips while preserving each order's customer name. Choose one.",
    context:
      "An admin page first fetches 50 orders in one query. It then loops over those orders and awaits getCustomer(order.customerId) once per order. Each call issues a database query; no relation cache is present. The page therefore makes 51 database queries. The customer relation is many-to-one.",
    options: [
      { key: "a", label: "Run the existing customer lookups concurrently." },
      { key: "b", label: "Increase the database connection-pool limit." },
      { key: "c", label: "Fetch the orders with their customer names using a relation join." },
      { key: "d", label: "Add an index on the customer primary key." },
    ],
    rubric: {
      criteria: [
        {
          key: "choice-roundtrips",
          label: "Replace per-order relation lookups with a set-based fetch.",
          cause:
            "The proposed fix changes scheduling, connection capacity, or individual lookup speed while preserving the extra query for every order.",
          check: (a) => a.picked?.length === 1 && a.picked[0] === "c",
        },
      ],
      expected:
        "Joining the many-to-one customer relation retrieves the required names with the orders in one query. Batched eager loading would also remove the per-order query growth, though it may use two queries. Concurrent lookups still issue 51 queries and may increase database pressure.",
      nextStep:
        "Compare query counts for pages of 10, 50, and 100 orders before and after the relation fetch.",
    },
    helpLevels: [
      "Count database calls rather than only measuring how long the loop takes.",
      "Parallel execution overlaps calls but does not eliminate their round trips.",
      "Move relation retrieval out of the per-order loop and into a set-based database operation.",
    ],
  },
  {
    id: "t-91-predict",
    conceptId: 91,
    type: "predict",
    prompt:
      "Before publishing the dashboard, predict the mean and P99 for this sample. Use the nearest-rank percentile definition and choose one.",
    context:
      "A batch contains exactly 1,000 requests: 980 complete in 20 ms and 20 complete in 1,020 ms. Nearest-rank P99 is the value at position ceil(0.99 × N) in the ascending list. The dashboard also reports the arithmetic mean.",
    options: [
      { key: "a", label: "Mean 40 ms; P99 20 ms." },
      { key: "b", label: "Mean 20 ms; P99 1,020 ms." },
      { key: "c", label: "Mean 40 ms; P99 1,020 ms." },
      { key: "d", label: "Mean 1,020 ms; P99 1,020 ms." },
    ],
    rubric: {
      criteria: [
        {
          key: "choice-tail",
          label: "Use a weighted mean and locate the percentile's ranked request.",
          cause:
            "The prediction substitutes the typical fast response for either the weighted mean or the 990th ranked response, hiding the slow minority.",
          check: (a) => a.picked?.length === 1 && a.picked[0] === "c",
        },
      ],
      expected:
        "The mean is (980 × 20 + 20 × 1,020) / 1,000 = 40 ms. Positions 981 through 1,000 are 1,020 ms, so position 990 gives a P99 of 1,020 ms. A small mean does not rule out a costly tail from slow database calls or remote hops.",
      nextStep:
        "Split the slow requests by database duration and remote-hop duration to locate the tail's dominant contributor.",
    },
    helpLevels: [
      "The mean uses all durations; P99 selects a position in a sorted list.",
      "Find the last position occupied by a 20 ms request, then calculate the P99 rank.",
      "Check whether rank 990 falls inside the final block of 20 slow requests, and weight both groups when calculating the mean.",
    ],
  },
  ...TASKS_93_F9,
];
