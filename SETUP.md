# SETUP — PROJECT BUDDY CLIENT ACQUISITION OS

## Prerequisites
- **Node.js**: v18.0.0 or higher (v24.x installed)
- **npm**: v9.0.0 or higher
- **Ollama**: Recommended for local LLM inference (http://localhost:11434)

## Installation & Running

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Initialize Database & Knowledge Base**:
   ```bash
   npm run db:init
   ```

3. **Start Ollama Service (Optional but recommended)**:
   ```bash
   ollama serve
   ollama pull llama3
   ```

4. **Launch Application**:
   ```bash
   npm run dev
   ```
   Open browser at `http://localhost:3000`.

5. **First-Run Setup Wizard**:
   - Complete the 11-step setup wizard on first launch.
   - Configure Ollama endpoint and model.
   - Load Project Buddy knowledge base.
   - Set conservative daily outreach limits.
