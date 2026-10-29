import type { Task } from "@/lib/exercises";

// Tarefas F9 (pacote s15; conteúdo do subagente).
const TASKS_25_26_F9: Task[] = [] = [
  {
    id: "t-25-selectivity",
    conceptId: 25,
    type: "compare",
    prompt:
      "A planner uses a sequential scan for this catalog request, although an index on category_id exists. Which explanation is best supported by the information given, and what evidence would you inspect before changing the index?",
    context:
      "The table has 240,000 products. The request filters on category_id = 42 and active = true, orders by created_at descending, and returns 30 rows. Measurements indicate that the predicate may match a substantial share of the table, but no target-engine plan output or representative runtime comparison is provided.",
    options: [
      {
        key: "a",
        label:
          "The sequential scan may be reasonable if many rows qualify; inspect the plan, selectivity, and measured work before deciding whether a different index helps.",
      },
      {
        key: "b",
        label:
          "The index is defective because every query with an indexed filter should use an index scan.",
      },
      {
        key: "c",
        label:
          "The limit proves that the database reads only 30 rows, so the sequential scan must be caused by a missing index on created_at.",
      },
      {
        key: "d",
        label:
          "Add indexes to category_id, active, and created_at separately without measuring; the planner will combine them at no additional write cost.",
      },
    ],
    rubric: {
      criteria: [
        {
          key: "choice_selectivity",
          label: "Connects scan choice to selectivity",
          cause:
            "Treats an index as automatically cheaper without considering how many rows qualify or how much table data must be fetched.",
          check: (a) => a.picked?.includes("a") ?? false,
        },
        {
          key: "choice_evidence",
          label: "Names relevant evidence",
          cause:
            "Infers the correct access path from the index declaration or result limit alone instead of inspecting plan and workload evidence.",
          check: (a) => a.picked?.includes("a") ?? false,
        },
      ],
      expected:
        "Option A is best supported. An index can be ignored when the predicate matches a large fraction of the table or when its use would require costly row fetches. A 30-row output limit does not establish that only 30 rows were examined. Inspect target-engine plan output, representative estimated and actual row evidence where available, data distribution, ordering work, and read/write measurements before changing the index.",
      nextStep:
        "Compare a measured candidate access path with the current plan on representative data, and include the write cost of any additional index.",
    },
    helpLevels: [
      "Separate the number of rows returned from the number of rows the database may need to examine.",
      "Ask how many rows match the predicate and what work remains after locating index entries.",
      "An index is a candidate access path, not a command. A low-selectivity predicate can make a scan reasonable; use plan and workload evidence before changing it.",
    ],
  },
  {
    id: "t-25-write-cost",
    conceptId: 25,
    type: "find-flaw",
    prompt:
      "Find the unsupported claim in the proposal and choose the response that corrects it without dismissing a potentially useful index.",
    context:
      "The product-import service inserts and edits thousands of rows during a daily batch. A teammate proposes an index on active and says: \"This can only make our filtered reads faster. Inserts and updates are unaffected, so we should keep it even if the planner rarely uses it.\" No read/write measurements or index-usage review are supplied.",
    options: [
      {
        key: "a",
        label:
          "The proposal ignores maintenance and storage costs; measure whether the index benefits relevant reads and how it affects inserts and updates before keeping it.",
      },
      {
        key: "b",
        label:
          "The proposal is sound because indexes are separate from table rows and therefore do not participate in writes.",
      },
      {
        key: "c",
        label:
          "The index must be removed immediately because every additional index makes every write fail.",
      },
      {
        key: "d",
        label:
          "Keep the index without review because an index that is rarely selected cannot add write work.",
      },
    ],
    rubric: {
      criteria: [
        {
          key: "choice_maintenance",
          label: "Identifies index write maintenance",
          cause:
            "Treats an index as read-only metadata and omits the work needed to maintain it as indexed values and rows change.",
          check: (a) => a.picked?.includes("a") ?? false,
        },
        {
          key: "choice_balance",
          label: "Keeps the decision evidence-based",
          cause:
            "Replaces the unsupported claim with an absolute rule instead of weighing measured read benefit against write and storage cost.",
          check: (a) => a.picked?.includes("a") ?? false,
        },
      ],
      expected:
        "Option A identifies the flaw. Inserts, deletes, and updates to indexed keys generally require corresponding index maintenance, with engine-specific costs. That does not prove the index should be removed: it may help important reads. Compare representative read plans and performance with import and update workload, inspect whether the index serves other queries or constraints, and decide from the overall workload.",
      nextStep:
        "List the read queries the index is meant to support and the writes that maintain it, then compare both sides using representative evidence.",
    },
    helpLevels: [
      "Consider what must change in an index when a row is inserted or its indexed value changes.",
      "An index can improve some reads and still add storage or maintenance work to writes.",
      "Choose the response that recognizes both sides: measure read benefit and write cost before keeping or dropping the index.",
    ],
  },
  {
    id: "t-26-projection",
    conceptId: 26,
    type: "choose-info",
    prompt:
      "The joined query has replaced 100 per-product category lookups, but the page is still slow. Which next investigation is most useful before rewriting the query or adding an index?",
    context:
      "The endpoint currently selects every column from products and categories. Each product row includes a large import_payload used by a separate administrative workflow, while the page displays only product id, name, price, and category name. No execution-plan evidence is available yet.",
    options: [
      {
        key: "a",
        label:
          "Capture the exact query and representative plan or runtime evidence, then compare a projection containing only the fields the page needs while checking result equivalence.",
      },
      {
        key: "b",
        label:
          "Assume the remaining issue is still N+1 and restore one category query per product so each lookup is smaller.",
      },
      {
        key: "c",
        label:
          "Add an index to every selected column, including import_payload, before inspecting the query plan.",
      },
      {
        key: "d",
        label:
          "Remove the category join because joins are inherently slower, even though the page needs the category name.",
      },
    ],
    rubric: {
      criteria: [
        {
          key: "choice_projection",
          label: "Recognizes unused projected data",
          cause:
            "Focuses only on query count or indexes and overlooks that the endpoint requests a large column it does not use.",
          check: (a) => a.picked?.includes("a") ?? false,
        },
        {
          key: "choice_measurement",
          label: "Uses plan evidence and checks result",
          cause:
            "Recommends a rewrite or index from query appearance alone without establishing baseline work and preserving the required result.",
          check: (a) => a.picked?.includes("a") ?? false,
        },
      ],
      expected:
        "Option A is the strongest next investigation. N+1 has already been addressed, so inspect the cost of the remaining query. A focused projection avoids requesting import_payload for this page and can reduce data transferred or processed, but physical-I/O benefit depends on engine and storage layout. Compare the exact query and plan or representative runtime evidence, and verify that required rows, fields, and ordering remain correct.",
      nextStep:
        "Write down the page's required fields and compare the baseline query with an equivalent focused projection using the target database's documented plan output.",
    },
    helpLevels: [
      "The application already reduced the number of queries. Look at the work and data requested by the remaining query.",
      "Identify which selected fields the page actually displays and which large field belongs to another workflow.",
      "Measure the exact query, test a focused projection, and preserve result correctness; do not claim an I/O improvement without evidence.",
    ],
  },
  {
    id: "t-26-seq-scan",
    conceptId: 26,
    type: "find-flaw",
    prompt:
      "A reviewer sees a sequential scan in the plan and says it proves the database ignored a useful index. Choose the response that identifies the flaw and the next check.",
    context:
      "A reporting query filters on a low-selectivity status value and reads many rows to calculate a total. An index exists on status. The reviewer proposes forcing an index scan, but has not compared estimated and actual row counts or representative resource and runtime evidence.",
    options: [
      {
        key: "a",
        label:
          "A sequential scan can be reasonable when many rows qualify; compare selectivity and target-engine plan and runtime evidence before forcing another path.",
      },
      {
        key: "b",
        label:
          "Any sequential scan proves a missing index, regardless of rows returned or data distribution.",
      },
      {
        key: "c",
        label:
          "Force the index scan because an index on the filter column always reads fewer pages than a table scan.",
      },
      {
        key: "d",
        label:
          "Replace the query with a subquery because nested query syntax prevents sequential scans.",
      },
    ],
    rubric: {
      criteria: [
        {
          key: "choice_scan",
          label: "Recognizes a scan may be appropriate",
          cause:
            "Interprets a plan operator as inherently wrong without considering selectivity and the amount of data required.",
          check: (a) => a.picked?.includes("a") ?? false,
        },
        {
          key: "choice_verification",
          label: "Requests relevant verification",
          cause:
            "Forces a plan from operator names alone without comparing evidence for the target engine and workload.",
          check: (a) => a.picked?.includes("a") ?? false,
        },
      ],
      expected:
        "Option A is best. A low-selectivity predicate and an aggregate that reads many rows can make a sequential scan cheaper than traversing an index and fetching many table rows. The plan must be interpreted in context. Compare selectivity, estimated and actual row evidence where available, resource information, and representative runtime on the target engine before considering a forced path.",
      nextStep:
        "Consult the target database's plan documentation and compare the scan with a candidate alternative on the same representative data and query parameters.",
    },
    helpLevels: [
      "The query needs many rows to calculate the total. Ask whether an index would avoid reading most of those rows.",
      "An index can locate matching entries but may still require many row fetches; a scan is not automatically a failure.",
      "Choose the answer that uses selectivity and engine-specific evidence rather than forcing an access path from the operator name alone.",
    ],
  },
];

export const TASKS_DATABASE: Task[] = [
  {
    id: "t-81-order",
    conceptId: 81,
    type: "order",
    prompt:
      "Order the four steps. Each step has the prerequisites described below. Which step would lose its justification if an unlisted old writer remained active?",
    context:
      "A read-only archive serves old queries using shelf_code. New queries will use location_code with the same meaning. All writes are paused until this migration finishes. The new query release is allowed only after copied values are verified. The retirement check covers all readers; if an old writer were discovered, that check would also need to cover it before removal. The task evaluates the order; use the retirement step to identify the broken assumption.",
    options: [
      {
        key: "a",
        label: "Release queries that read location_code after verification.",
      },
      {
        key: "b",
        label: "Copy shelf_code into location_code and verify every value.",
      },
      {
        key: "c",
        label: "Confirm old users are retired, then remove shelf_code.",
      },
      {
        key: "d",
        label: "Add location_code while preserving shelf_code.",
      },
    ],
    rubric: {
      criteria: [
        {
          key: "sequence",
          label: "Respect field creation, verified copying, and reader retirement.",
          cause:
            "The proposed sequence uses a field before it is ready or removes a field while an old user may still require it.",
          check: (a) => a.order?.join(",") === "d,b,a,c",
        },
      ],
      expected:
        "Add the field, copy and verify while writes are paused, release the new queries, then confirm retirement and remove the old field. Step c loses its justification if an old writer remains: it is still a user of shelf_code. If writes were not paused, this copy-only plan would additionally need a synchronization protocol.",
      nextStep:
        "Remove the write pause and identify how an update arriving during the copy could be lost from location_code.",
    },
    helpLevels: [
      "For each step, list the field and data it requires.",
      "The new query release requires verified values, and removal requires retirement evidence.",
      "The order is d, b, a, c. An undiscovered old writer invalidates c's retirement assumption; live writes would also require synchronization during copying.",
    ],
  },
  {
    id: "t-81-find-flaw",
    conceptId: 81,
    type: "find-flaw",
    prompt:
      "Which observation most directly contradicts the plan's claim that the new field will stay current? Choose one.",
    context:
      "A service adds display_label, copies nickname once, and deploys new servers that write both fields. Old servers remain for one day and still update nickname only. There is no trigger, change capture, or reconciliation. The plan claims that all display_label values stay current because new servers dual-write.",
    options: [
      {
        key: "a",
        label: "The copy runs in batches of 500 rows.",
      },
      {
        key: "b",
        label: "An old server updates nickname after that row was copied.",
      },
      {
        key: "c",
        label: "A new server inserts a row with both values equal.",
      },
      {
        key: "d",
        label: "A read uses an explicit list of columns.",
      },
    ],
    rubric: {
      criteria: [
        {
          key: "diagnosis",
          label: "Find a writer outside the claimed synchronization mechanism.",
          cause:
            "The diagnosis treats new-server dual writes as coverage for old servers that do not execute that code.",
          check: (a) => a.picked?.length === 1 && a.picked[0] === "b",
        },
      ],
      expected:
        "The old-server update changes nickname but not display_label after the one-time copy. Dual writes in new code cannot synchronize writers still running old code.",
      nextStep:
        "List every active write path and propose either a bridge covering it or a coordinated period without that writer.",
    },
    helpLevels: [
      "Trace one row after its copy has finished.",
      "Ask which versions execute the dual-write code.",
      "Option b supplies a counterexample: the old server changes only nickname, leaving display_label stale.",
    ],
  },
  {
    id: "t-82-predict",
    conceptId: 82,
    type: "predict",
    prompt:
      "Predict the old exporter's behavior on each schema. Choose one.",
    context:
      "The exporter explicitly SELECTs id, code and INSERTs id, code. S1 has those columns. S2 retains them and adds language NOT NULL DEFAULT 'en'; that default is acceptable. S3 instead renames code to numeric_code and changes its type to integer, with no alias or adapter. The exporter still sends alphanumeric values such as 'A7'.",
    options: [
      {
        key: "a",
        label: "Reads and inserts work on S2; both fail on S3.",
      },
      {
        key: "b",
        label: "Reads work but inserts fail on S2; both work on S3.",
      },
      {
        key: "c",
        label: "Both fail on S2; reads work but inserts fail on S3.",
      },
      {
        key: "d",
        label: "Reads and inserts work on both S2 and S3.",
      },
    ],
    rubric: {
      criteria: [
        {
          key: "prediction",
          label: "Track explicit column names and omitted-field defaults.",
          cause:
            "The prediction overlooks either S2's acceptable insert default or S3's removal of the exact column the exporter queries.",
          check: (a) => a.picked?.length === 1 && a.picked[0] === "a",
        },
      ],
      expected:
        "S2 preserves code and supplies language for old inserts. S3 removes code, so both old SQL statements fail; even merely redirecting the name would not establish that alphanumeric values fit an integer contract.",
      nextStep:
        "Evaluate a new exporter that requires language against S1 to test the opposite compatibility direction.",
    },
    helpLevels: [
      "Evaluate SELECT and INSERT separately.",
      "An omitted field can use a default, but a missing named column cannot.",
      "Option a matches the contract: S2 preserves both operations; S3 removes code and also introduces an incompatible value domain.",
    ],
  },
  {
    id: "t-82-variant",
    conceptId: 82,
    type: "variant",
    prompt:
      "Transfer the compatibility reasoning to archive importers. Choose the accurate matrix summary.",
    context:
      "Layout L1 has accession and title. L2 preserves both and adds collection with default 'general'. Importer I1 reads and writes only accession and title, explicitly by name; 'general' is acceptable. I2 also requires collection and has no fallback. Both importers require accession. L3 removes accession. Assume no adapters or other changes.",
    options: [
      {
        key: "a",
        label: "I1 works on L2; I2 works on L1; both fail on L3.",
      },
      {
        key: "b",
        label: "I1 fails on L2; I2 fails on L1; both work on L3.",
      },
      {
        key: "c",
        label: "I1 works on L2; I2 fails on L1; both fail on L3.",
      },
      {
        key: "d",
        label: "I1 fails on L2; I2 works on L1; both fail on L3.",
      },
    ],
    rubric: {
      criteria: [
        {
          key: "transfer",
          label: "Check both compatibility directions and the shared dependency.",
          cause:
            "The matrix assumes compatibility is symmetric or overlooks that both importers still depend on accession.",
          check: (a) => a.picked?.length === 1 && a.picked[0] === "c",
        },
      ],
      expected:
        "I1 works on L2 because its fields remain and the new default is acceptable. I2 fails on L1 because collection is absent. Both fail on L3 because accession is removed. A newer layout does not imply universal compatibility.",
      nextStep:
        "Add a row for an importer that explicitly tolerates missing collection and explain which result changes.",
    },
    helpLevels: [
      "Write each importer's required fields beside each layout.",
      "The default helps an old writer on L2; it cannot add a field to L1.",
      "Option c preserves the direction of each check and catches the accession dependency shared by both importers.",
    ],
  },
  ...TASKS_25_26_F9,
];
