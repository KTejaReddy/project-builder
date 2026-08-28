# ProjectForge AI - Local AI Software Engineering Mentor

ProjectForge AI is an interactive, local-first AI-powered software generation and educational platform. It acts as an intelligent Software Engineering Mentor, generating functional software projects while teaching the user how they work step-by-step. 

All AI capabilities—such as planner roadmap creation, architectural vector designs, API specifications, coding guides, chat mentors, and code diagnostics reviewers—are powered offline by local, open-source models using **Ollama**.

---

## 1. Prerequisites

Before installing, ensure your environment meets the following requirements:

*   **Operating System**: Windows 10/11, macOS (Intel/Apple Silicon), or Linux.
*   **Node.js**: Version **v18.17.0** or later (v20+ LTS recommended).
*   **Package Manager**: **npm** (included with Node.js).
*   **Software Dependencies**:
    *   **Ollama**: Installed and running locally.
    *   **Git**: Required for cloning the repository.
*   **Hardware Recommendations**:
    *   8 GB RAM minimum (16 GB or higher recommended for running larger local LLMs like 7B parameters).
    *   NVIDIA GPU with VRAM (strongly recommended for fast token generation, though CPU inference works fine for smaller models).

---

## 2. Installation

Follow these exact commands to download and configure the project locally:

1.  **Clone the Repository**:
    ```bash
    git clone <repository-url>
    cd "project builder"
    ```
2.  **Install Node.js Dependencies**:
    ```bash
    npm install
    ```
    *(Note: Both frontend and backend dependencies run inside this single unified Next.js App Router codebase, so no separate installation commands are necessary).*

---

## 3. Environment Setup

ProjectForge AI operates in a hybrid storage mode:
*   **Default (Offline-First)**: If no environment keys are supplied, the app gracefully falls back to storing projects, active codes, and lesson progress directly in your browser's `LocalStorage`.
*   **SaaS Database Sync**: Supply Supabase environment variables to persist data in a cloud database.

Create a `.env.local` file in the root directory:

```env
# Optional Supabase Database Persistence
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Optional Legacy Cloud API Keys (Not required; Ollama is used by default)
# OPENAI_API_KEY=sk-proj-xxxx
# GEMINI_API_KEY=AIzaSyxxxx
# ANTHROPIC_API_KEY=sk-ant-xxxx
# GROQ_API_KEY=gsk_xxxx
```

> [!NOTE]
> If you configure Supabase, execute the SQL schema inside [schema.sql](file:///C:/Users/tejar/.gemini/antigravity-ide/brain/532f10fa-bc5f-4e00-8ffa-7d7dd53ef326/schema.sql) using the Supabase SQL Editor.

---

## 4. Ollama Setup (Local AI Engine)

ProjectForge AI runs entirely on local inference. Setup your Ollama server as follows:

1.  **Install Ollama**:
    *   **Windows / macOS**: Download and run the official installer from [ollama.com](https://ollama.com).
    *   **Linux**: Execute `curl -fsSL https://ollama.com/install.sh | sh` in your terminal.
2.  **Pull the Required Model**:
    ProjectForge AI defaults to **Llama 3.2** (`llama3.2` - 3B parameters) for balanced execution and low resource overhead. Pull it with:
    ```bash
    ollama pull llama3.2
    ```
    *Optional supplementary models*:
    *   For reasoning support: `ollama pull deepseek-r1:7b`
    *   For advanced coding: `ollama pull qwen2.5-coder`
3.  **Start the Ollama Server**:
    *   By default, the Ollama application launches automatically in the background on startup.
    *   To start it manually from the terminal:
        ```bash
        ollama serve
        ```
4.  **Verify Ollama is Running**:
    Open your browser and navigate to `http://localhost:11434`. You should see the message:
    `Ollama is running`

---

## 5. Running the Application

The frontend UI components and server-side proxy route handlers run concurrently:

1.  **Start Development Server**:
    Run this command in your terminal:
    ```bash
    npm run dev
    ```
2.  **Access the Application**:
    Open your web browser and navigate to:
    [http://localhost:3000](http://localhost:3000)

*   **Port Config**: Next.js runs on port **3000** by default. Ollama is proxied dynamically through port **3000** via Next.js `/api/ollama` endpoints to prevent browser CORS issues.

---

## 6. First Run & Configurations

1.  **Launch Dashboard**: Open `http://localhost:3000`. You will land on the interactive homepage.
2.  **Access Settings**:
    Click the **Settings** icon on the top right or go to `http://localhost:3000/settings`.
3.  **Validate connection**:
    Under the **Ollama Local Engine** card, verify your URL is set to `http://localhost:11434` and click **Test Connection**. A green alert saying *Connection Active* should appear.
4.  **Manage Models**:
    Click the **Refresh** icon next to the active model dropdown. Your pulled models (e.g. `llama3.2`) will appear in the dropdown and in the **Installed Models Manager** list table. Select your model and click **Save Preferences** at the bottom.

---

## 7. Troubleshooting

*   **Error: "Ollama Offline" in Workspace / Connection Refused in Settings**:
    *   *Cause*: Ollama service is not running or is blocked by local firewalls.
    *   *Fix*: Ensure Ollama is running in your taskbar/menu tray. Run `ollama serve` in a new terminal window to restart it manually.
*   **Blank Chat Responses or JSON Generation Loops**:
    *   *Cause*: The default model `llama3.2` has not been pulled.
    *   *Fix*: Run `ollama pull llama3.2` in your command line and refresh settings.
*   **TypeScript / Compilation issues**:
    *   Ensure you have installed packages using `npm install`. You can clean-install dependencies by running `rm -rf .next node_modules package-lock.json && npm install`.

---

## 8. Stopping the Application

*   **Stop Next.js Server**: Press `Ctrl + C` in the terminal where `npm run dev` is running.
*   **Stop Ollama**: Quit the Ollama application from your system menu bar/system tray icon.

---

## 9. Production Build & Deployment

To build a highly optimized bundle for hosting or production:

1.  **Compile Production Build**:
    ```bash
    npm run build
    ```
2.  **Start Production Server**:
    ```bash
    npm run start
    ```
    The application will serve on port `3000` with pre-rendered, optimized routing.
