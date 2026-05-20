import { createRequire } from "node:module";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const runtimeRequire = createRequire(
  "C:/Users/IAST356/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json"
);
const artifactToolPath = runtimeRequire.resolve("@oai/artifact-tool");
const {
  Presentation,
  PresentationFile,
  row,
  column,
  grid,
  layers,
  panel,
  text,
  shape,
  rule,
  fill,
  hug,
  fixed,
  wrap,
  grow,
  fr,
  auto,
} = await import(pathToFileURL(artifactToolPath).href);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../../..");
const presentationRoot = path.join(repoRoot, "docs", "presentation");
const outputDir = path.join(presentationRoot, "output");
const previewDir = path.join(outputDir, "previews");
const pptxPreviewDir = path.join(outputDir, "pptx-previews");
const pptxPath = path.join(outputDir, "Smart_Maintenance_Logbook_Project_Deep_Dive.pptx");
const notesPath = path.join(outputDir, "Smart_Maintenance_Logbook_Speaker_Notes.md");
const reportPath = path.join(outputDir, "build-report.json");

await fs.mkdir(previewDir, { recursive: true });
await fs.mkdir(pptxPreviewDir, { recursive: true });

const SLIDE = { width: 1920, height: 1080 };
const colors = {
  slate950: "#020617",
  slate900: "#0F172A",
  slate800: "#1E293B",
  slate700: "#334155",
  slate600: "#475569",
  slate500: "#64748B",
  slate300: "#CBD5E1",
  slate200: "#E2E8F0",
  slate100: "#F1F5F9",
  slate50: "#F8FAFC",
  white: "#FFFFFF",
  blue: "#2563EB",
  cyan: "#0891B2",
  emerald: "#059669",
  amber: "#D97706",
  rose: "#E11D48",
  violet: "#7C3AED",
};

const presentation = Presentation.create({
  slideSize: SLIDE,
});

const speakerNotes = [];

function addNotes(index, title, notes) {
  speakerNotes.push({ index, title, notes });
}

function compose(slide, node) {
  slide.compose(node, {
    frame: { left: 0, top: 0, width: SLIDE.width, height: SLIDE.height },
    baseUnit: 8,
  });
}

function bg(color = colors.slate50) {
  return shape({ name: "slide-background", width: fill, height: fill, fill: color });
}

function titleText(value, color = colors.slate900, size = 60) {
  return text(value, {
    name: "slide-title",
    width: wrap(1500),
    height: hug,
    style: { fontSize: size, bold: true, color },
  });
}

function subtitleText(value, color = colors.slate600, size = 26, maxWidth = 1320) {
  return text(value, {
    name: "slide-subtitle",
    width: wrap(maxWidth),
    height: hug,
    style: { fontSize: size, color },
  });
}

function eyebrow(value, color = colors.blue) {
  return text(value.toUpperCase(), {
    name: "section-label",
    width: fill,
    height: hug,
    style: { fontSize: 18, bold: true, color },
  });
}

function bodyText(value, options = {}) {
  return text(value, {
    name: options.name || "body-text",
    width: options.width || fill,
    height: hug,
    style: {
      fontSize: options.size || 26,
      color: options.color || colors.slate700,
      bold: options.bold || false,
    },
  });
}

function smallText(value, color = colors.slate500) {
  return text(value, {
    name: "small-text",
    width: fill,
    height: hug,
    style: { fontSize: 18, color },
  });
}

function chip(value, accent = colors.blue, width = hug) {
  return panel(
    {
      name: "chip",
      width,
      height: hug,
      padding: { x: 18, y: 9 },
      fill: `${accent}18`,
      stroke: `${accent}55`,
      borderRadius: 24,
    },
    text(value, {
      name: "chip-label",
      width: width === hug ? wrap(360) : fill,
      height: hug,
      style: { fontSize: 18, bold: true, color: accent },
    })
  );
}

function bullet(label, body, accent = colors.blue) {
  return row(
    { name: "bullet-row", width: fill, height: hug, gap: 18, alignItems: "start" },
    [
      shape({
        name: "bullet-dot",
        width: fixed(14),
        height: fixed(14),
        fill: accent,
        borderRadius: 7,
      }),
      column({ name: "bullet-copy", width: fill, height: hug, gap: 5 }, [
        text(label, {
          name: "bullet-label",
          width: fill,
          height: hug,
          style: { fontSize: 25, bold: true, color: colors.slate900 },
        }),
        text(body, {
          name: "bullet-body",
          width: fill,
          height: hug,
          style: { fontSize: 21, color: colors.slate600 },
        }),
      ]),
    ]
  );
}

function bulletList(items, accent = colors.blue, gap = 20) {
  return column(
    { name: "bullet-list", width: fill, height: hug, gap },
    items.map((item) => bullet(item[0], item[1], item[2] || accent))
  );
}

function card(title, body, accent = colors.blue, opts = {}) {
  return panel(
    {
      name: opts.name || "card",
      width: opts.width || fill,
      height: opts.height || hug,
      padding: { x: 28, y: 24 },
      fill: opts.fill || colors.white,
      stroke: opts.stroke || colors.slate200,
      borderRadius: 18,
    },
    column({ name: "card-content", width: fill, height: hug, gap: 12 }, [
      row({ name: "card-title-row", width: fill, height: hug, gap: 12, alignItems: "center" }, [
        shape({ name: "card-accent", width: fixed(10), height: fixed(32), fill: accent, borderRadius: 5 }),
        text(title, {
          name: "card-title",
          width: fill,
          height: hug,
          style: { fontSize: opts.titleSize || 26, bold: true, color: colors.slate900 },
        }),
      ]),
      text(body, {
        name: "card-body",
        width: fill,
        height: hug,
        style: { fontSize: opts.bodySize || 21, color: colors.slate600 },
      }),
    ])
  );
}

function metric(label, value, helper, accent = colors.blue) {
  return column({ name: "metric", width: fill, height: hug, gap: 8 }, [
    text(value, {
      name: "metric-value",
      width: fill,
      height: hug,
      style: { fontSize: 62, bold: true, color: accent },
    }),
    text(label, {
      name: "metric-label",
      width: fill,
      height: hug,
      style: { fontSize: 24, bold: true, color: colors.slate900 },
    }),
    text(helper, {
      name: "metric-helper",
      width: fill,
      height: hug,
      style: { fontSize: 18, color: colors.slate500 },
    }),
  ]);
}

function flowStep(title, body, accent = colors.blue) {
  return panel(
    {
      name: "flow-step",
      width: fill,
      height: hug,
      padding: { x: 22, y: 20 },
      fill: colors.white,
      stroke: colors.slate200,
      borderRadius: 16,
    },
    column({ name: "flow-step-copy", width: fill, height: hug, gap: 9 }, [
      chip(title, accent, fill),
      text(body, {
        name: "flow-step-body",
        width: fill,
        height: hug,
        style: { fontSize: 19, color: colors.slate600 },
      }),
    ])
  );
}

function arrow(accent = colors.slate300) {
  return text("->", {
    name: "flow-arrow",
    width: fixed(54),
    height: hug,
    style: { fontSize: 34, bold: true, color: accent },
  });
}

function standardSlide(section, title, subtitle, content, notes) {
  const slide = presentation.slides.add();
  const index = presentation.slides.count;
  compose(
    slide,
    layers({ name: `slide-${index}-layers`, width: fill, height: fill }, [
      bg(colors.slate50),
      column(
        {
          name: "slide-root",
          width: fill,
          height: fill,
          padding: { x: 84, y: 58 },
          gap: 26,
        },
        [
          column({ name: "title-stack", width: fill, height: hug, gap: 12 }, [
            eyebrow(section),
            titleText(title),
            subtitleText(subtitle),
          ]),
          content,
          row({ name: "footer", width: fill, height: hug, alignItems: "center" }, [
            text("Smart Maintenance Logbook Web MVP", {
              name: "footer-left",
              width: fill,
              height: hug,
              style: { fontSize: 15, color: colors.slate500 },
            }),
            text(String(index).padStart(2, "0"), {
              name: "footer-page",
              width: fixed(48),
              height: hug,
              style: { fontSize: 15, color: colors.slate500, bold: true },
            }),
          ]),
        ]
      ),
    ])
  );
  slide.speakerNotes.setText(notes);
  addNotes(index, title, notes);
}

function sectionSlide(section, title, subtitle, notes, accent = colors.blue) {
  const slide = presentation.slides.add();
  const index = presentation.slides.count;
  compose(
    slide,
    layers({ name: `section-${index}-layers`, width: fill, height: fill }, [
      bg(colors.slate900),
      shape({ name: "accent-block", width: fixed(680), height: fill, fill: `${accent}33` }),
      column(
        {
          name: "section-root",
          width: fill,
          height: fill,
          padding: { x: 104, y: 100 },
          gap: 34,
          justifyContent: "center",
        },
        [
          eyebrow(section, colors.cyan),
          titleText(title, colors.white, 74),
          subtitleText(subtitle, colors.slate300, 30, 1120),
          rule({ name: "section-rule", width: fixed(260), stroke: accent, weight: 8 }),
        ]
      ),
    ])
  );
  slide.speakerNotes.setText(notes);
  addNotes(index, title, notes);
}

function coverSlide() {
  const slide = presentation.slides.add();
  const index = presentation.slides.count;
  const notes = [
    "Start by saying this is not just a UI demo. It is an inspection workflow MVP.",
    "The core idea is: an inspector can capture a railway defect from text or voice, attach evidence, and the system converts it into structured data that supervisors and managers can act on.",
    "Important message for seniors: the system is intentionally modular. The MVP works with deterministic extraction, while Whisper and Ollama are optional intelligence layers.",
  ].join("\n\n");
  compose(
    slide,
    layers({ name: "cover-layers", width: fill, height: fill }, [
      bg(colors.slate950),
      shape({ name: "left-accent", width: fixed(28), height: fill, fill: colors.blue }),
      shape({ name: "bottom-rail", width: fill, height: fixed(12), fill: colors.cyan }),
      grid(
        {
          name: "cover-root",
          width: fill,
          height: fill,
          padding: { x: 112, y: 86 },
          columns: [fr(1), fixed(420)],
          columnGap: 52,
          alignItems: "center",
        },
        [
          column(
            {
              name: "cover-title-stack",
              width: fill,
              height: hug,
              gap: 34,
              justifyContent: "center",
            },
            [
              eyebrow("Project deep dive", colors.cyan),
              text("Smart\nMaintenance\nLogbook", {
                name: "cover-title",
                width: fixed(980),
                height: hug,
                style: { fontSize: 96, bold: true, color: colors.white },
              }),
              text(
                "A railway inspection MVP that turns field transcripts, audio, and image evidence into structured defect logs and dashboard intelligence.",
                {
                  name: "cover-subtitle",
                  width: fixed(1120),
                  height: hug,
                  style: { fontSize: 30, color: colors.slate300 },
                }
              ),
              row({ name: "cover-chips", width: fill, height: hug, gap: 14 }, [
                chip("FastAPI backend", colors.emerald),
                chip("Next.js frontend", colors.cyan),
                chip("PostgreSQL / SQLite ready", colors.amber),
                chip("Whisper + Ollama optional", colors.violet),
              ]),
            ]
          ),
          column(
            {
              name: "cover-right-rail",
              width: fill,
              height: hug,
              gap: 34,
            },
            [
              metric("Local backend", "8101", "FastAPI API endpoint", colors.cyan),
              metric("Local frontend", "3101", "Next.js dashboard UI", colors.emerald),
              metric("Demo roles", "3", "Inspector, Supervisor, Manager", colors.amber),
            ]
          ),
        ]
      ),
    ])
  );
  slide.speakerNotes.setText(notes);
  addNotes(index, "Smart Maintenance Logbook", notes);
}

coverSlide();

standardSlide(
  "Why this project exists",
  "Manual inspection logs are hard to act on quickly",
  "The MVP focuses on reducing reporting friction while preserving evidence and operational visibility.",
  grid(
    {
      name: "problem-grid",
      width: fill,
      height: grow(1),
      columns: [fr(1), fr(1)],
      columnGap: 30,
      rowGap: 24,
    },
    [
      card(
        "Field reporting is messy",
        "Inspectors may speak in Hindi, Kannada, English, or mixed phrases. The system needs to accept typed text, recorded audio, and uploaded audio.",
        colors.rose
      ),
      card(
        "Evidence is separated from the log",
        "Images and audio clips are valuable, but they are usually stored away from the defect entry. This project keeps media linked to the defect record.",
        colors.amber
      ),
      card(
        "Supervisors need structured fields",
        "A sentence like 'B2 brake pipe leakage' must become coach, component, defect type, severity, description, and status.",
        colors.blue
      ),
      card(
        "Managers need summary intelligence",
        "The same defect stream should feed dashboards: open defects, critical defects, status distribution, component concentration, and recent risk.",
        colors.emerald
      ),
    ]
  ),
  [
    "Explain the business problem first.",
    "The old way is a free-text log. Free text is useful for humans, but it is weak for filtering, prioritizing, dashboards, and accountability.",
    "The project therefore creates a single flow: capture defect evidence once, convert the transcript into structured fields, and then use the structured data across supervisor and manager views.",
  ].join("\n\n")
);

standardSlide(
  "MVP scope",
  "The system is a working inspection workflow, not only a form",
  "It has capture, extraction, evidence storage, review, status tracking, and analytics in one local demo.",
  row({ name: "mvp-row", width: fill, height: grow(1), gap: 28, alignItems: "stretch" }, [
    column({ name: "left-metrics", width: fixed(500), height: fill, gap: 28, justifyContent: "center" }, [
      metric("Backend API", "FastAPI", "Routers, schemas, models, services", colors.blue),
      metric("Frontend UI", "Next.js", "TypeScript dashboard experience", colors.cyan),
      metric("Storage", "DB + files", "Metadata in DB, media on disk", colors.emerald),
    ]),
    panel(
      {
        name: "mvp-summary-panel",
        width: fill,
        height: fill,
        padding: { x: 38, y: 34 },
        fill: colors.white,
        stroke: colors.slate200,
        borderRadius: 18,
      },
      bulletList(
        [
          ["Inspector", "Creates a defect from transcript or audio and attaches image/audio evidence."],
          ["Supervisor", "Filters defects, reviews transcript and media, and updates status with remarks."],
          ["Manager", "Sees total/open/in-progress/resolved/critical counts and component/status analytics."],
          ["Intelligence layers", "Rule-based extraction is fast and deterministic; Whisper and Ollama are optional for speech and smarter extraction."],
        ],
        colors.blue,
        24
      )
    ),
  ]),
  [
    "The MVP is intentionally scoped but complete enough to demo end to end.",
    "It does not try to solve authentication, deployment, notifications, or enterprise integrations yet.",
    "This is good engineering because the riskiest workflow is validated first: can a field defect become a useful structured log with evidence and dashboards?",
  ].join("\n\n")
);

standardSlide(
  "Users",
  "Three demo roles represent the railway maintenance workflow",
  "The frontend role switcher changes the working perspective without adding complex authentication to the MVP.",
  grid(
    {
      name: "role-grid",
      width: fill,
      height: grow(1),
      columns: [fr(1), fr(1), fr(1)],
      columnGap: 28,
    },
    [
      card("Inspector: Ramesh Kumar", "Logs defects from the field. Enters train, coach, location, transcript, audio, and image evidence.", colors.cyan),
      card("Supervisor: Suresh Patil", "Reviews incoming defects, checks media, filters by severity/status/component, and updates progress.", colors.blue),
      card("Manager: Anita Rao", "Uses analytics to understand workload, critical defects, component trends, and operational status.", colors.emerald),
    ]
  ),
  [
    "Make it clear that demo role switching is not production auth.",
    "For MVP, role switching lets the team see all user journeys without login complexity.",
    "Production should later add real authentication, authorization, audit trails, and user management.",
  ].join("\n\n")
);

sectionSlide(
  "End-to-end flow",
  "From field observation to dashboard decision",
  "Every screen and API exists to move one defect through capture, enrichment, review, and reporting.",
  [
    "This section is the most important for explaining the project.",
    "You can present it as a pipeline: observation -> capture -> storage -> transcription -> extraction -> review -> analytics.",
    "Point out that data is never trapped in the UI. The backend stores the defect and exposes it back to supervisor and manager views.",
  ].join("\n\n"),
  colors.cyan
);

standardSlide(
  "System flow",
  "A defect moves through seven clear stages",
  "The design keeps the normal path fast and makes heavier intelligence features optional.",
  column({ name: "seven-stage-flow", width: fill, height: grow(1), gap: 34, justifyContent: "center" }, [
    row({ name: "flow-row-1", width: fill, height: hug, gap: 12, alignItems: "center" }, [
      flowStep("1 Capture", "Inspector enters train, coach, location, text/audio/image.", colors.cyan),
      arrow(),
      flowStep("2 Create", "Backend creates a defect code and initial Open status.", colors.blue),
      arrow(),
      flowStep("3 Store", "Defect metadata goes to DB; media files go to uploads.", colors.emerald),
    ]),
    row({ name: "flow-row-2", width: fill, height: hug, gap: 12, alignItems: "center" }, [
      flowStep("4 Transcribe", "Optional Whisper converts recorded audio to text.", colors.violet),
      arrow(),
      flowStep("5 Extract", "Rules extract coach, component, type, severity, description.", colors.amber),
      arrow(),
      flowStep("6 Review", "Supervisor checks evidence and updates status.", colors.rose),
      arrow(),
      flowStep("7 Analyze", "Manager dashboard summarizes trends and risk.", colors.emerald),
    ]),
  ]),
  [
    "Use this slide to narrate the full working demo.",
    "The key idea is separation of responsibilities. The browser captures inputs. The API validates and stores. Services transcribe/extract. Dashboards read structured data.",
    "The fast path is typed transcript plus rule extraction. The richer path adds audio transcription and optional AI refinement.",
  ].join("\n\n")
);

standardSlide(
  "Architecture",
  "The project is layered so each responsibility is easy to explain",
  "Frontend, API routers, services, database models, upload storage, Whisper, and Ollama are separated.",
  grid(
    {
      name: "architecture-grid",
      width: fill,
      height: grow(1),
      columns: [fr(1.1), fr(1.1), fr(1.1)],
      rows: [auto, auto],
      columnGap: 24,
      rowGap: 24,
    },
    [
      card("Browser UI", "Next.js pages: Inspector, Supervisor, Manager. Uses Fetch API and browser MediaRecorder.", colors.cyan),
      card("FastAPI app", "Health, auth, defects, media, and dashboard routers. CORS allows the frontend origin.", colors.blue),
      card("Service layer", "Storage, rule extractor, speech-to-text, and optional LLM extractor keep logic outside routers.", colors.violet),
      card("Database", "SQLAlchemy models store users, defects, media metadata, and status history.", colors.emerald),
      card("File storage", "Audio and image files are stored under backend/uploads, with only paths stored in DB.", colors.amber),
      card("Optional intelligence", "Whisper runs local speech-to-text. Ollama runs local LLM extraction only when requested.", colors.rose),
    ]
  ),
  [
    "Explain why layering matters.",
    "If a senior asks where logic belongs: routing belongs in routers, business logic belongs in services, persistence belongs in models/database, DTO validation belongs in Pydantic schemas.",
    "This makes the app easier to test and easier to replace later. For example, Whisper can be swapped for another speech provider without rewriting the whole frontend.",
  ].join("\n\n")
);

standardSlide(
  "Device vs server",
  "The browser captures evidence; the backend processes and stores it",
  "This split keeps the demo simple while leaving room for future on-device speech options.",
  grid(
    {
      name: "device-server-grid",
      width: fill,
      height: grow(1),
      columns: [fr(1), fr(1)],
      columnGap: 34,
    },
    [
      panel(
        {
          name: "device-panel",
          width: fill,
          height: fill,
          padding: { x: 34, y: 30 },
          fill: colors.white,
          stroke: colors.slate200,
          borderRadius: 18,
        },
        column({ name: "device-copy", width: fill, height: hug, gap: 22 }, [
          chip("Inspector device", colors.cyan, fixed(260)),
          bulletList([
            ["Records audio", "MediaRecorder creates a browser audio file."],
            ["Previews image", "The UI shows selected image evidence before submit."],
            ["Sends requests", "Fetch API posts JSON and FormData to FastAPI."],
            ["Shows results", "The UI displays transcript, translation, extracted fields, and errors."],
          ], colors.cyan, 18),
        ])
      ),
      panel(
        {
          name: "server-panel",
          width: fill,
          height: fill,
          padding: { x: 34, y: 30 },
          fill: colors.white,
          stroke: colors.slate200,
          borderRadius: 18,
        },
        column({ name: "server-copy", width: fill, height: hug, gap: 22 }, [
          chip("Backend server", colors.blue, fixed(260)),
          bulletList([
            ["Stores data", "SQLAlchemy writes defects, users, media rows, and status history."],
            ["Stores files", "Audio/image binaries are saved under backend/uploads."],
            ["Runs extraction", "Rules and optional Ollama convert transcripts into structured fields."],
            ["Runs Whisper", "When enabled, local backend Whisper converts audio to text/English."],
          ], colors.blue, 18),
        ])
      ),
    ]
  ),
  [
    "This answers the common confusion: the extractor does not understand audio directly.",
    "Audio must first become text. In the current architecture, the browser records the audio, sends it to the backend, and the backend runs Whisper if enabled.",
    "Images and audio files are stored on the backend machine in the uploads folder; the database stores only metadata and file paths.",
  ].join("\n\n")
);

sectionSlide(
  "Backend design",
  "FastAPI is the stable center of the MVP",
  "It owns validation, persistence, media storage, extraction, transcription, and dashboard APIs.",
  [
    "Now explain the backend as the core system.",
    "FastAPI was chosen because it is quick to build, strongly typed with Pydantic, easy to document, and good for JSON APIs.",
    "SQLAlchemy gives a clean database layer, while services keep extraction and storage logic testable.",
  ].join("\n\n"),
  colors.blue
);

standardSlide(
  "Backend folder map",
  "The backend is organized around routers, models, schemas, and services",
  "This makes it easy to point a senior to the exact place where each behavior lives.",
  grid(
    {
      name: "backend-folder-grid",
      width: fill,
      height: grow(1),
      columns: [fr(1), fr(1)],
      columnGap: 30,
      rowGap: 20,
    },
    [
      card("app/main.py", "Creates FastAPI, adds CORS, mounts uploads, includes routers, and exposes GET /health.", colors.blue),
      card("app/database.py", "Creates SQLAlchemy engine/session, creates tables, and seeds demo users/defects.", colors.emerald),
      card("app/models.py", "Defines User, DefectLog, MediaFile, and StatusHistory database tables.", colors.cyan),
      card("app/schemas.py", "Defines Pydantic request/response shapes for API validation.", colors.violet),
      card("app/routers/*", "Separates auth, defects, media upload, and dashboard endpoints.", colors.amber),
      card("app/services/*", "Contains extractor, storage, speech, optional LLM extraction, and extraction pipeline logic.", colors.rose),
    ]
  ),
  [
    "Use this slide when asked 'where is the logic written?'.",
    "The rule-based extractor is in backend/app/services/extractor.py.",
    "Whisper speech-to-text is in backend/app/services/speech.py.",
    "Ollama LLM extraction is in backend/app/services/llm_extractor.py and the merge/fallback logic is in extraction_pipeline.py.",
  ].join("\n\n")
);

standardSlide(
  "API surface",
  "The backend exposes focused API groups",
  "Each group maps to one part of the operational workflow.",
  grid(
    {
      name: "api-table",
      width: fill,
      height: grow(1),
      columns: [fr(0.9), fr(1.25), fr(1.75)],
      rowGap: 12,
      columnGap: 16,
    },
    [
      chip("Group", colors.slate700, fill),
      chip("Endpoints", colors.slate700, fill),
      chip("Purpose", colors.slate700, fill),
      bodyText("Health", { size: 22, bold: true }),
      bodyText("GET /health", { size: 20 }),
      bodyText("Shows API status, DB backend, ports, Whisper, and LLM flags.", { size: 20 }),
      bodyText("Auth", { size: 22, bold: true }),
      bodyText("GET /api/auth/demo-users", { size: 20 }),
      bodyText("Returns seeded demo users for role switching.", { size: 20 }),
      bodyText("Defects", { size: 22, bold: true }),
      bodyText("POST/GET/PATCH /api/defects...", { size: 20 }),
      bodyText("Creates, lists, retrieves, updates status, transcribes, and extracts defects.", { size: 20 }),
      bodyText("Media", { size: 22, bold: true }),
      bodyText("POST /media/audio, POST /media/image, GET /media", { size: 20 }),
      bodyText("Uploads evidence and lists files linked to a defect.", { size: 20 }),
      bodyText("Dashboard", { size: 22, bold: true }),
      bodyText("/summary, /defects-by-component, /defects-by-status, /recent-defects", { size: 20 }),
      bodyText("Feeds supervisor and manager summary views.", { size: 20 }),
    ]
  ),
  [
    "This is the answer to 'where do I find all the APIs?'.",
    "FastAPI also gives interactive docs if enabled by default at /docs, but the core endpoint list is shown here.",
    "Every page in the frontend calls these APIs through frontend/lib/api.ts.",
  ].join("\n\n")
);

standardSlide(
  "Database model",
  "The database stores structured records; the file system stores binaries",
  "This is deliberate because storing large audio/image blobs in the DB would make the MVP heavier.",
  grid(
    {
      name: "data-model-grid",
      width: fill,
      height: grow(1),
      columns: [fr(1), fr(1)],
      columnGap: 30,
      rowGap: 20,
    },
    [
      card("User", "id, name, employee_id, role, password_hash, created_at. Demo users support role switching.", colors.cyan),
      card("DefectLog", "defect_code, train, coach, component, type, severity, transcript, translation, status, location, timestamps.", colors.blue),
      card("MediaFile", "defect_id, file_type, file_path, original_filename, uploaded_at. Links evidence to one defect.", colors.amber),
      card("StatusHistory", "defect_id, old_status, new_status, remarks, updated_by, updated_at. Preserves supervisor workflow changes.", colors.emerald),
    ]
  ),
  [
    "Explain that DefectLog is the main business table.",
    "MediaFile does not store binary data. It stores path and metadata only.",
    "This is standard because DB queries stay light, backups can be planned separately, and object storage can replace local uploads later.",
  ].join("\n\n")
);

standardSlide(
  "Storage strategy",
  "Data and evidence are stored in different places for the right reasons",
  "Metadata needs querying; audio/images need durable file storage.",
  row({ name: "storage-row", width: fill, height: grow(1), gap: 34, alignItems: "stretch" }, [
    panel(
      {
        name: "db-storage",
        width: fill,
        height: fill,
        padding: { x: 34, y: 30 },
        fill: colors.white,
        stroke: colors.slate200,
        borderRadius: 18,
      },
      column({ name: "db-storage-copy", width: fill, height: hug, gap: 22 }, [
        chip("Database", colors.emerald, fixed(220)),
        bulletList([
          ["Defect rows", "Train, coach, component, type, severity, status."],
          ["Transcript rows", "Raw transcript and translated English text."],
          ["Media metadata", "Original filename and relative file path."],
          ["Status history", "Every supervisor status change with remarks."],
        ], colors.emerald, 18),
      ])
    ),
    panel(
      {
        name: "file-storage",
        width: fill,
        height: fill,
        padding: { x: 34, y: 30 },
        fill: colors.white,
        stroke: colors.slate200,
        borderRadius: 18,
      },
      column({ name: "file-storage-copy", width: fill, height: hug, gap: 22 }, [
        chip("Uploads folder", colors.amber, fixed(260)),
        bulletList([
          ["Audio files", "Stored under backend/uploads/audio."],
          ["Image files", "Stored under backend/uploads/images."],
          ["Safe filenames", "UUID prefix and extension validation."],
          ["Static serving", "FastAPI mounts /uploads so UI can play or preview evidence."],
        ], colors.amber, 18),
      ])
    ),
  ]),
  [
    "This is a key architecture talking point.",
    "The DB is for searchable structured data. Files are for binary evidence.",
    "For production, local uploads should move to object storage such as S3, Azure Blob, or an internal file store, but the DB schema can still store paths/URLs.",
  ].join("\n\n")
);

sectionSlide(
  "Extraction intelligence",
  "Fast rules first, optional AI second",
  "The project avoids blocking the MVP on heavy models while still allowing smarter refinement.",
  [
    "This section should answer why the app is not fully AI-only.",
    "The deterministic extractor is fast, stable, and testable. Whisper and Ollama add intelligence, but they are resource-heavy and can be slower.",
    "The architecture makes AI additive, not a single point of failure.",
  ].join("\n\n"),
  colors.violet
);

standardSlide(
  "Rule-based extractor",
  "The extractor converts known railway phrases into structured fields",
  "It does not guess from audio. It receives text and applies transparent rules.",
  grid(
    {
      name: "extractor-grid",
      width: fill,
      height: grow(1),
      columns: [fr(1), fr(1)],
      columnGap: 30,
      rowGap: 20,
    },
    [
      card("Coach detection", "Regex detects S1/S2/S3, B1/B2, A1/A2, D1, C1 and normalizes values like S-3 to S3.", colors.cyan),
      card("Component rules", "Door, brake, wheel, electrical, seat, toilet/water, window, and leakage keywords map to component names.", colors.blue),
      card("Severity rules", "Brake leakage, wheel crack, smoke, fire, and electrical spark become Critical; damaged/not closing becomes Medium.", colors.rose),
      card("Defect type rules", "The extractor returns short labels like Door not closing, Brake leakage, Electrical spark, or Seat damage.", colors.amber),
    ]
  ),
  [
    "Say clearly: the extractor does not process audio directly.",
    "The audio has to become text first. Then extractor.py reads that text.",
    "The benefit of a rule-based extractor is explainability. If a senior asks why a brake leakage became Critical, we can point to an exact rule.",
  ].join("\n\n")
);

standardSlide(
  "Whisper speech-to-text",
  "Whisper is optional, local backend speech-to-text",
  "When enabled, it converts audio into text and can translate Hindi/Kannada audio into English.",
  column({ name: "whisper-content", width: fill, height: grow(1), gap: 26, justifyContent: "center" }, [
    row({ name: "whisper-flow", width: fill, height: hug, gap: 12, alignItems: "center" }, [
      flowStep("Record/upload", "Browser creates or selects audio.", colors.cyan),
      arrow(),
      flowStep("Upload", "Audio saved in backend uploads.", colors.amber),
      arrow(),
      flowStep("Transcribe", "Backend loads local Whisper model.", colors.violet),
      arrow(),
      flowStep("Translate", "Non-English speech becomes English text.", colors.blue),
      arrow(),
      flowStep("Extract", "Rules structure the English text.", colors.emerald),
    ]),
    panel(
      {
        name: "whisper-note",
        width: fill,
        height: hug,
        padding: { x: 30, y: 24 },
        fill: colors.white,
        stroke: colors.slate200,
        borderRadius: 18,
      },
      bodyText(
        "Important: Whisper is not a cloud service in this MVP. It runs on the backend machine using local model files. If ENABLE_WHISPER=false or Whisper is not installed, the app still works with typed transcripts.",
        { size: 25, color: colors.slate700 }
      )
    ),
  ]),
  [
    "This answers the confusion around optional Whisper.",
    "Optional does not mean unused. It means the project can run without it. When ENABLE_WHISPER=true and dependencies/models are available, the backend uses it.",
    "The model runs on the backend machine, not inside PgAdmin and not in the browser. Audio is uploaded to the backend and processed there.",
  ].join("\n\n")
);

standardSlide(
  "Multilingual handling",
  "Hindi and Kannada audio are translated into English before extraction",
  "The extractor rules are English-focused, so translation gives it a consistent input language.",
  grid(
    {
      name: "language-grid",
      width: fill,
      height: grow(1),
      columns: [fr(1), fr(1), fr(1)],
      columnGap: 26,
    },
    [
      card("Auto detect", "Useful for quick demos, but less reliable when audio is noisy or language is mixed.", colors.cyan),
      card("Select Hindi/Kannada", "The UI lets the user choose language so the backend can use the stronger non-English Whisper model.", colors.violet),
      card("English output", "The backend saves raw_transcript and translated_text, then extracts from the best English text available.", colors.emerald),
    ]
  ),
  [
    "Explain why translation is part of the architecture.",
    "The extraction rules are built around English railway terms such as brake pipe, door, leakage, electrical panel, smoke, and seat cushion.",
    "For Hindi/Kannada, Whisper first transcribes/translate to English. Then the extractor runs on English text. This is why audio quality and language selection matter.",
  ].join("\n\n")
);

standardSlide(
  "Optional Ollama LLM",
  "The LLM is used as a refinement layer, not the default critical path",
  "It can interpret more flexible wording, but the app keeps rule extraction as a safe fallback.",
  grid(
    {
      name: "llm-grid",
      width: fill,
      height: grow(1),
      columns: [fr(1), fr(1)],
      columnGap: 32,
      rowGap: 24,
    },
    [
      card("Local model", "Ollama runs on localhost with llama3.2:latest. No cloud LLM call is required in this setup.", colors.violet),
      card("Structured JSON", "The backend asks the LLM to return only coach, component, type, severity, and description.", colors.blue),
      card("Validation", "Pydantic validates the LLM output and rejects unsupported component/severity values.", colors.emerald),
      card("Fallback", "If Ollama is slow, unavailable, or invalid, rule-based extraction remains the reliable result.", colors.amber),
    ]
  ),
  [
    "Say this honestly: local LLMs can be slower on normal laptops, especially without GPU acceleration.",
    "That is why the Submit flow remains fast and the UI offers Improve with AI as a separate action.",
    "This gives the demo both reliability and intelligence.",
  ].join("\n\n")
);

standardSlide(
  "Why fast-first matters",
  "A field workflow should not wait for heavy AI when rules can give a good first result",
  "The project separates immediate logging from optional intelligence refinement.",
  row({ name: "fast-first-row", width: fill, height: grow(1), gap: 34, alignItems: "stretch" }, [
    panel(
      {
        name: "fast-path-panel",
        width: fill,
        height: fill,
        padding: { x: 34, y: 30 },
        fill: colors.white,
        stroke: colors.slate200,
        borderRadius: 18,
      },
      column({ name: "fast-path-copy", width: fill, height: hug, gap: 22 }, [
        chip("Default path", colors.emerald, fixed(230)),
        bulletList([
          ["Typed transcript", "Immediate defect creation."],
          ["Rule extraction", "Fast coach/component/severity result."],
          ["Media upload", "Audio/image evidence attached."],
          ["Dashboard update", "Supervisor and manager can see it quickly."],
        ], colors.emerald, 18),
      ])
    ),
    panel(
      {
        name: "ai-path-panel",
        width: fill,
        height: fill,
        padding: { x: 34, y: 30 },
        fill: colors.white,
        stroke: colors.slate200,
        borderRadius: 18,
      },
      column({ name: "ai-path-copy", width: fill, height: hug, gap: 22 }, [
        chip("Optional AI path", colors.violet, fixed(250)),
        bulletList([
          ["Whisper", "Transcribes and translates audio when enabled."],
          ["Ollama", "Improves extraction only when user requests it."],
          ["Confidence guard", "Weak transcription avoids overwriting defect fields."],
          ["Fallback", "Rules protect the demo if local AI is slow."],
        ], colors.violet, 18),
      ])
    ),
  ]),
  [
    "This is one of the strongest design decisions.",
    "In production, we could move transcription and LLM extraction to background jobs. For the MVP, keeping default submit fast avoids a bad user experience.",
    "If someone asks why English was faster than Hindi/Kannada, explain that multilingual Whisper models are larger and require more CPU.",
  ].join("\n\n")
);

sectionSlide(
  "Frontend design",
  "The UI is role-based and demo-ready",
  "Each page is designed around what that user needs to do next.",
  [
    "Move from backend into frontend.",
    "The design uses a professional dashboard style: slate background, white cards, subtle borders, responsive layout, loading states, errors, and empty states.",
    "The UI communicates system state clearly: backend unreachable, Whisper enabled/disabled, smart extraction enabled, upload/transcription notices.",
  ].join("\n\n"),
  colors.cyan
);

standardSlide(
  "Frontend structure",
  "Next.js pages are supported by reusable dashboard components",
  "The API client centralizes backend calls so pages stay focused on user experience.",
  grid(
    {
      name: "frontend-grid",
      width: fill,
      height: grow(1),
      columns: [fr(1), fr(1)],
      columnGap: 30,
      rowGap: 20,
    },
    [
      card("app/inspector/page.tsx", "Inspector workspace for creating defects from transcript/audio/image evidence.", colors.cyan),
      card("app/supervisor/page.tsx", "Supervisor workspace for filtering, reviewing media, transcribing evidence, and updating status.", colors.blue),
      card("app/manager/page.tsx", "Manager analytics view with summary cards, component buckets, status buckets, and critical defects.", colors.emerald),
      card("components/*", "AppShell, Sidebar, DefectForm, DefectTable, AudioRecorder, ImageUpload, StatCard, LoadingBlock, EmptyState.", colors.amber),
      card("lib/api.ts", "Single API client for health, demo users, defects, media, transcription, extraction, and dashboard endpoints.", colors.violet),
      card("lib/types.ts", "Frontend TypeScript types mirror backend response payloads for safer UI development.", colors.rose),
    ]
  ),
  [
    "The frontend is not just static pages; it is wired to the backend API.",
    "DefectForm is the main Inspector component. Supervisor page manages filters, detail panel, status updates, and audio transcription.",
    "The frontend reads /health to decide whether to show Whisper and LLM features.",
  ].join("\n\n")
);

standardSlide(
  "Inspector workflow",
  "The Inspector page is optimized for fast defect capture",
  "It supports typed transcript, audio recording, audio upload fallback, image preview, and extracted result display.",
  column({ name: "inspector-flow", width: fill, height: grow(1), gap: 28, justifyContent: "center" }, [
    row({ name: "inspector-flow-row", width: fill, height: hug, gap: 12, alignItems: "center" }, [
      flowStep("Enter context", "Train, coach, location.", colors.cyan),
      arrow(),
      flowStep("Capture narrative", "Type transcript or record/upload audio.", colors.blue),
      arrow(),
      flowStep("Attach image", "Upload image evidence with preview.", colors.amber),
      arrow(),
      flowStep("Submit fast", "Create defect and run fast extraction.", colors.emerald),
      arrow(),
      flowStep("Review result", "Show code, coach, component, type, severity.", colors.violet),
    ]),
    panel(
      {
        name: "inspector-note",
        width: fill,
        height: hug,
        padding: { x: 30, y: 22 },
        fill: colors.white,
        stroke: colors.slate200,
        borderRadius: 18,
      },
      bodyText(
        "If audio is submitted and Whisper is enabled, the UI first saves the defect, uploads audio, transcribes it, shows the transcript, then runs fast extraction. AI refinement is a separate button.",
        { size: 25 }
      )
    ),
  ]),
  [
    "This is the main live demo path.",
    "For a reliable demo, use a typed transcript first. Then show audio as an enhancement.",
    "The UI now shows Voice transcript early so the user can see what Whisper heard before AI refinement runs.",
  ].join("\n\n")
);

standardSlide(
  "Supervisor workflow",
  "The Supervisor page turns captured logs into action",
  "It is built for reviewing evidence, filtering defects, and updating progress.",
  grid(
    {
      name: "supervisor-grid",
      width: fill,
      height: grow(1),
      columns: [fr(1), fr(1)],
      columnGap: 30,
      rowGap: 20,
    },
    [
      card("Summary cards", "Total, open, in-progress, resolved, and critical counts give instant workload status.", colors.blue),
      card("Defect table", "Filter by status, severity, and component, then select a defect for details.", colors.cyan),
      card("Evidence review", "Supervisor sees transcript, English translation, audio playback, and image previews.", colors.amber),
      card("Status update", "Status dropdown plus remarks writes to DefectLog and StatusHistory.", colors.emerald),
    ]
  ),
  [
    "The Supervisor page is where structured data becomes operational control.",
    "The status update is not only a UI change. The backend updates the defect and creates a StatusHistory row.",
    "This provides the base for future audit trails and accountability.",
  ].join("\n\n")
);

standardSlide(
  "Manager workflow",
  "The Manager page aggregates the defect stream into decisions",
  "It focuses on trends and risk rather than individual form entry.",
  row({ name: "manager-row", width: fill, height: grow(1), gap: 34, alignItems: "stretch" }, [
    panel(
      {
        name: "manager-left",
        width: fixed(660),
        height: fill,
        padding: { x: 34, y: 30 },
        fill: colors.white,
        stroke: colors.slate200,
        borderRadius: 18,
      },
      column({ name: "manager-metrics", width: fill, height: hug, gap: 28 }, [
        metric("Total defects", "All", "Complete captured log volume", colors.blue),
        metric("Critical defects", "Risk", "Brake, wheel, smoke, fire, electrical spark", colors.rose),
        metric("Resolved defects", "Closure", "Work completed and tracked", colors.emerald),
      ])
    ),
    panel(
      {
        name: "manager-right",
        width: fill,
        height: fill,
        padding: { x: 34, y: 30 },
        fill: colors.white,
        stroke: colors.slate200,
        borderRadius: 18,
      },
      bulletList(
        [
          ["Defects by component", "Shows concentration areas like Brake System, Door, Electrical System, Seat/Berth."],
          ["Defects by status", "Shows whether issues are stuck Open, In Progress, or moving to Resolved."],
          ["Recent critical defects", "Gives leadership immediate visibility into safety-sensitive observations."],
          ["Future extension", "The same model can support date filters, depot filters, SLA charts, and export reports."],
        ],
        colors.emerald,
        26
      )
    ),
  ]),
  [
    "The manager dashboard proves that structured logging is valuable.",
    "Once defects are structured, dashboard APIs can group by component, status, severity, train, depot, time range, or assigned team.",
    "In production, this can become weekly performance reporting and risk tracking.",
  ].join("\n\n")
);

sectionSlide(
  "Engineering decisions",
  "Why these methods were chosen",
  "The project balances demo speed, local privacy, reliability, and future production paths.",
  [
    "This section helps answer senior-level 'why' questions.",
    "Do not present this as the final production architecture. Present it as an MVP architecture that is easy to evolve.",
    "The biggest principle is: prove the workflow first, then harden deployment, auth, queues, storage, and model serving.",
  ].join("\n\n"),
  colors.emerald
);

standardSlide(
  "Technology choices",
  "Each tool was selected for a practical MVP reason",
  "The choices keep the system understandable and replaceable.",
  grid(
    {
      name: "tech-choice-grid",
      width: fill,
      height: grow(1),
      columns: [fr(1), fr(1)],
      columnGap: 30,
      rowGap: 20,
    },
    [
      card("FastAPI", "Fast to build, typed request/response validation with Pydantic, good for Python AI/service integration.", colors.blue),
      card("SQLAlchemy", "Clean database models and sessions, with ability to switch SQLite/PostgreSQL through DATABASE_URL.", colors.emerald),
      card("Next.js + TypeScript", "Professional dashboard UI, component reuse, type safety, and clean API integration.", colors.cyan),
      card("Local uploads", "Simple MVP evidence storage without adding Docker, S3, or infrastructure too early.", colors.amber),
      card("Whisper optional", "Adds speech-to-text while keeping typed transcript workflow available on low-resource machines.", colors.violet),
      card("Ollama optional", "Adds local LLM intelligence without making cloud LLM dependency mandatory.", colors.rose),
    ]
  ),
  [
    "When explaining this, avoid saying 'this is perfect production architecture'.",
    "Say it is a production-style MVP: modular, testable, and designed so individual parts can be upgraded.",
    "For example, local uploads can become S3; local Whisper can become a GPU service or cloud speech API; demo auth can become real auth.",
  ].join("\n\n")
);

standardSlide(
  "Alternatives considered",
  "There are multiple ways to build this; the MVP chose the lowest-friction path",
  "These alternatives become useful when moving from demo to production.",
  grid(
    {
      name: "alternatives-grid",
      width: fill,
      height: grow(1),
      columns: [fr(1), fr(1)],
      columnGap: 30,
      rowGap: 20,
    },
    [
      card("On-device speech", "Possible in a mobile app using native SDKs or small models. Reduces upload latency but increases device requirements.", colors.cyan),
      card("Cloud speech API", "Usually faster and more accurate at scale, but needs internet, vendor cost, and data/privacy review.", colors.blue),
      card("Cloud LLM extraction", "Could be more accurate and faster than local CPU Ollama, but introduces external dependency and cost.", colors.violet),
      card("Background jobs", "Better production UX: submit immediately, process audio/AI in queue, notify UI when complete.", colors.emerald),
      card("Object storage", "S3/Azure Blob/Internal NAS is better than local uploads for production evidence retention.", colors.amber),
      card("Full auth/RBAC", "Needed for production so each user only performs allowed actions and every change is auditable.", colors.rose),
    ]
  ),
  [
    "This slide is useful if someone challenges the chosen architecture.",
    "Yes, audio processing can be done on-device, especially in a native mobile app. But browser-based local speech-to-text with good multilingual accuracy is harder and device-dependent.",
    "For this web MVP, backend transcription is simpler to demo and centralizes model setup.",
  ].join("\n\n")
);

standardSlide(
  "Performance tradeoffs",
  "The slow parts are model loading and multilingual speech processing",
  "The project protects the UX by keeping the first structured result fast.",
  row({ name: "performance-row", width: fill, height: grow(1), gap: 32, alignItems: "stretch" }, [
    card(
      "Fast operations",
      "Typed transcript extraction, defect creation, media metadata saving, listing defects, dashboard summaries, and status updates.",
      colors.emerald,
      { height: fill }
    ),
    card(
      "Slower operations",
      "Whisper model loading, Hindi/Kannada transcription, translation, and local Ollama extraction on CPU.",
      colors.amber,
      { height: fill }
    ),
    card(
      "Mitigation",
      "Submit fast first, show transcript early, run extraction separately, make AI refinement optional, and keep rule fallback.",
      colors.blue,
      { height: fill }
    ),
  ]),
  [
    "Give a direct explanation if asked why it became slow after adding LLM.",
    "Whisper and Ollama both use local compute. If the laptop has limited CPU/RAM and no GPU acceleration, it will take longer.",
    "The current design avoids making the whole form wait for LLM by moving smart refinement behind a separate button.",
  ].join("\n\n")
);

standardSlide(
  "Demo flow",
  "A clean live demo should start with the reliable path",
  "Show the complete workflow first, then show optional voice and AI features.",
  column({ name: "demo-flow", width: fill, height: grow(1), gap: 20 }, [
    bulletList(
      [
        ["1. Start backend", "Run FastAPI on 127.0.0.1:8101 and confirm /health is ok.", colors.blue],
        ["2. Start frontend", "Run Next.js on 127.0.0.1:3101 and open the Inspector page.", colors.cyan],
        ["3. Submit typed transcript", "Use 'Coach B2 brake pipe leakage...' to show Critical extraction quickly.", colors.emerald],
        ["4. Review as supervisor", "Open Supervisor, select the new defect, inspect transcript/media, update status.", colors.amber],
        ["5. Review as manager", "Open Manager to show changed summary and component/status analytics.", colors.violet],
        ["6. Optional voice/AI", "Record audio, transcribe to text, then optionally click Improve with AI.", colors.rose],
      ],
      colors.blue,
      16
    ),
  ]),
  [
    "For the live demo, do not start with the slowest feature.",
    "First prove the core workflow with typed transcript. Then show audio transcription as enhancement.",
    "If the network tunnel is used, remind the team it works only while local backend/frontend/tunnel processes are running.",
  ].join("\n\n")
);

standardSlide(
  "Production roadmap",
  "The MVP is complete enough to validate, but production needs hardening",
  "These are the next upgrades before real deployment.",
  grid(
    {
      name: "roadmap-grid",
      width: fill,
      height: grow(1),
      columns: [fr(1), fr(1)],
      columnGap: 30,
      rowGap: 20,
    },
    [
      card("Authentication and RBAC", "Replace demo role switcher with real login, permissions, audit identity, password policy, and sessions.", colors.blue),
      card("Deployment architecture", "Use managed PostgreSQL, backend service, frontend hosting, HTTPS, domain, and proper environment management.", colors.emerald),
      card("Background processing", "Queue audio transcription and AI extraction so the UI remains responsive for large files.", colors.violet),
      card("Durable media storage", "Move uploads to object storage or enterprise file storage with retention and access controls.", colors.amber),
      card("Model strategy", "Choose local GPU Whisper/Ollama, cloud speech/LLM, or hybrid based on cost, privacy, accuracy, and latency.", colors.rose),
      card("Operational features", "Assignments, notifications, SLA, search, export, audit logs, mobile experience, and monitoring.", colors.cyan),
    ]
  ),
  [
    "This slide prevents overclaiming.",
    "Say the MVP proves the workflow. Production needs security, deployment, reliability, scale, and governance.",
    "The architecture already has extension points for those improvements.",
  ].join("\n\n")
);

standardSlide(
  "Final message for seniors",
  "This MVP proves the inspection-to-decision loop",
  "The strongest story is not only AI; it is reliable structured maintenance workflow with optional intelligence.",
  row({ name: "final-row", width: fill, height: grow(1), gap: 34, alignItems: "stretch" }, [
    panel(
      {
        name: "final-left",
        width: fill,
        height: fill,
        padding: { x: 38, y: 34 },
        fill: colors.slate900,
        stroke: colors.slate900,
        borderRadius: 18,
      },
      column({ name: "final-message", width: fill, height: hug, gap: 26 }, [
        text("What to say", {
          name: "final-heading",
          width: fill,
          height: hug,
          style: { fontSize: 34, bold: true, color: colors.white },
        }),
        text(
          "We built a working railway maintenance logbook where inspectors can capture defects with transcript, audio, and image evidence; the backend structures the report; supervisors act on it; managers see analytics.",
          {
            name: "final-statement",
            width: fill,
            height: hug,
            style: { fontSize: 30, color: colors.slate100 },
          }
        ),
      ])
    ),
    panel(
      {
        name: "final-right",
        width: fill,
        height: fill,
        padding: { x: 38, y: 34 },
        fill: colors.white,
        stroke: colors.slate200,
        borderRadius: 18,
      },
      bulletList(
        [
          ["Reliability", "Rule-based extraction keeps the core demo fast and explainable."],
          ["Intelligence", "Whisper and Ollama are integrated as optional local AI layers."],
          ["Traceability", "Defect, evidence, user, and status history are stored as separate records."],
          ["Scalability path", "The same architecture can move to real auth, background jobs, object storage, and production DB."],
        ],
        colors.emerald,
        26
      )
    ),
  ]),
  [
    "Close with confidence but be accurate.",
    "Say: The project is demo-ready for the workflow. It is not production-hardened yet.",
    "The most important achievement is the complete loop: capture -> store -> extract -> review -> update -> analyze.",
  ].join("\n\n")
);

const notesMarkdown = [
  "# Smart Maintenance Logbook - Speaker Notes",
  "",
  "Use these notes while presenting the PPT. The slides are intentionally clean; the detailed explanation lives here and in the PowerPoint speaker notes.",
  "",
  ...speakerNotes.flatMap((slide) => [
    `## Slide ${String(slide.index).padStart(2, "0")} - ${slide.title}`,
    "",
    slide.notes,
    "",
  ]),
].join("\n");

await fs.writeFile(notesPath, notesMarkdown, "utf8");

const pptxBlob = await PresentationFile.exportPptx(presentation);
await pptxBlob.save(pptxPath);

for (let i = 0; i < presentation.slides.count; i += 1) {
  const slide = presentation.slides.getItem(i);
  const png = await slide.export({ format: "png" });
  const bytes = Buffer.from(await png.arrayBuffer());
  await fs.writeFile(path.join(previewDir, `slide-${String(i + 1).padStart(2, "0")}.png`), bytes);
}

const imported = await PresentationFile.importPptx(await fs.readFile(pptxPath));
for (let i = 0; i < imported.slides.count; i += 1) {
  const slide = imported.slides.getItem(i);
  const png = await slide.export({ format: "png" });
  const bytes = Buffer.from(await png.arrayBuffer());
  await fs.writeFile(path.join(pptxPreviewDir, `slide-${String(i + 1).padStart(2, "0")}.png`), bytes);
}

await fs.writeFile(
  reportPath,
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      slideCount: presentation.slides.count,
      pptxPath,
      notesPath,
      sourcePreviewDir: previewDir,
      importedPptxPreviewDir: pptxPreviewDir,
    },
    null,
    2
  ),
  "utf8"
);

console.log(`Built ${presentation.slides.count} slides`);
console.log(pptxPath);
console.log(previewDir);
console.log(pptxPreviewDir);
