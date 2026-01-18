# Deep Agents - TypeScript

Deep Agents is a TypeScript library that enables building sophisticated AI agents capable of handling complex, multi-step tasks through a combination of planning tools, subagent delegation, filesystem operations, persistent memory, and discoverable skills. The library extends the simple tool-calling agent pattern by providing agents with the ability to plan and decompose tasks, manage context through file systems, spawn specialized subagents for context isolation, maintain long-term memory across conversations using LangGraph's Store infrastructure, and leverage reusable skills for common workflows.

Built on LangGraph and LangChain, Deep Agents provides a modular middleware architecture inspired by Claude Code. Each core capability—planning via todo lists, filesystem operations for context management, subagent spawning, skills loading, and agent memory—is implemented as composable middleware that can be customized or used independently. The library supports multiple backend options for file storage including ephemeral state-based storage, persistent store-based storage, direct filesystem access, and sandbox environments for executing shell commands, making it flexible enough to handle various deployment scenarios from development to production.

## Core APIs and Functions

### Creating a Basic Deep Agent

```typescript
import { createDeepAgent } from "deepagents";
import { tool } from "langchain";
import { z } from "zod";

// Define a custom tool
const searchTool = tool(
  async ({ query }: { query: string }) => {
    // Your search implementation
    return `Search results for: ${query}`;
  },
  {
    name: "search",
    description: "Search for information",
    schema: z.object({
      query: z.string().describe("The search query"),
    }),
  }
);

// Create agent with default configuration (Claude Sonnet 4.5)
const agent = createDeepAgent({
  tools: [searchTool],
  systemPrompt: "You are a helpful research assistant.",
});

// Invoke the agent
const result = await agent.invoke({
  messages: [{ role: "user", content: "Research AI agents" }],
});

console.log(result.messages[result.messages.length - 1].content);
```

### Configuring Custom Models

```typescript
import { ChatAnthropic } from "@langchain/anthropic";
import { ChatOpenAI } from "@langchain/openai";
import { createDeepAgent } from "deepagents";

// Using Anthropic Claude with custom settings
const anthropicAgent = createDeepAgent({
  model: new ChatAnthropic({
    model: "claude-sonnet-4-20250514",
    temperature: 0,
    maxTokens: 4096,
  }),
  systemPrompt: "You are an expert code reviewer.",
});

// Using OpenAI GPT
const openaiAgent = createDeepAgent({
  model: new ChatOpenAI({
    model: "gpt-4o",
    temperature: 0.7,
  }),
  systemPrompt: "You are a creative writing assistant.",
});

// Using model name string (defaults to Claude)
const stringModelAgent = createDeepAgent({
  model: "claude-sonnet-4-5-20250929",
  tools: [],
});
```

### Creating Subagents for Task Delegation

```typescript
import { createDeepAgent, type SubAgent } from "deepagents";
import { tool } from "langchain";
import { z } from "zod";

// Define specialized tools
const codeAnalysisTool = tool(
  async ({ code }: { code: string }) => {
    return `Analysis: ${code.length} characters`;
  },
  {
    name: "analyze_code",
    description: "Analyze code quality",
    schema: z.object({
      code: z.string(),
    }),
  }
);

const testGeneratorTool = tool(
  async ({ functionName }: { functionName: string }) => {
    return `Generated test for ${functionName}`;
  },
  {
    name: "generate_test",
    description: "Generate unit tests",
    schema: z.object({
      functionName: z.string(),
    }),
  }
);

// Define subagents with specific capabilities
const codeReviewSubagent: SubAgent = {
  name: "code-reviewer",
  description: "Analyzes code for quality, security, and best practices",
  systemPrompt: "You are an expert code reviewer. Analyze code thoroughly and provide detailed feedback.",
  tools: [codeAnalysisTool],
  model: "claude-sonnet-4-20250514",
};

const testWriterSubagent: SubAgent = {
  name: "test-writer",
  description: "Generates comprehensive unit tests for functions",
  systemPrompt: "You are a testing expert. Write thorough unit tests with edge cases.",
  tools: [testGeneratorTool],
  model: "gpt-4o",
};

// Create main agent with subagents
const mainAgent = createDeepAgent({
  systemPrompt: "You are a senior software engineer. Delegate code review to the code-reviewer and test generation to the test-writer.",
  subagents: [codeReviewSubagent, testWriterSubagent],
});

// The main agent can now delegate to subagents
const result = await mainAgent.invoke({
  messages: [
    {
      role: "user",
      content: "Review this function and generate tests: function add(a, b) { return a + b; }",
    },
  ],
});
```

### Using State Backend (Ephemeral Storage)

```typescript
import { createDeepAgent, StateBackend } from "deepagents";

// Default configuration uses StateBackend automatically
const agent = createDeepAgent({
  systemPrompt: "You can save information to files using write_file tool.",
});

// Explicitly configure StateBackend
const explicitAgent = createDeepAgent({
  backend: (config) => new StateBackend(config),
  systemPrompt: "Store research findings in files for later reference.",
});

// Files are stored in agent state, persist within conversation thread
const result = await agent.invoke({
  messages: [
    {
      role: "user",
      content: "Research quantum computing and save findings to quantum_notes.md",
    },
  ],
});

// Access files from state
console.log("Files created:", Object.keys(result.files || {}));
```

### Using Store Backend (Persistent Storage)

```typescript
import { createDeepAgent, StoreBackend } from "deepagents";
import { MemorySaver } from "@langchain/langgraph";
import { InMemoryStore } from "@langchain/langgraph-checkpoint";

// Setup persistent storage
const store = new InMemoryStore();
const checkpointer = new MemorySaver();

const agent = createDeepAgent({
  backend: (config) => new StoreBackend(config),
  store: store,
  checkpointer: checkpointer,
  systemPrompt: "You have access to persistent storage. Information saved will be available across all conversations.",
});

// First conversation - save information
const result1 = await agent.invoke(
  {
    messages: [
      {
        role: "user",
        content: "Save my preferences: I prefer Python over JavaScript. Write this to preferences.txt",
      },
    ],
  },
  { configurable: { thread_id: "user-123" } }
);

// Second conversation - access saved information
const result2 = await agent.invoke(
  {
    messages: [
      {
        role: "user",
        content: "What are my language preferences? Read from preferences.txt",
      },
    ],
  },
  { configurable: { thread_id: "user-456" } }
);

// File persists across threads
console.log("Retrieved preferences across conversations");
```

### Using Filesystem Backend (Real Files)

```typescript
import { createDeepAgent, FilesystemBackend } from "deepagents";
import * as path from "path";

// Configure agent to read/write actual files
const workspaceDir = path.join(process.cwd(), "agent-workspace");

const agent = createDeepAgent({
  backend: (config) => new FilesystemBackend({
    rootDir: workspaceDir,
    virtualMode: true, // Sandbox to rootDir
    maxFileSizeMb: 10,
  }),
  systemPrompt: "You can read and write files to the workspace directory.",
});

// Agent can now interact with real files
const result = await agent.invoke({
  messages: [
    {
      role: "user",
      content: "Create a TODO list in todo.md with 3 tasks for today",
    },
  ],
});

// File is written to ./agent-workspace/todo.md
console.log(`File created at: ${path.join(workspaceDir, "todo.md")}`);
```

### Using Composite Backend (Multiple Storage Types)

```typescript
import {
  createDeepAgent,
  CompositeBackend,
  StateBackend,
  StoreBackend,
} from "deepagents";
import { InMemoryStore } from "@langchain/langgraph-checkpoint";
import { MemorySaver } from "@langchain/langgraph";

// Combine state (ephemeral) and store (persistent) backends
const store = new InMemoryStore();
const checkpointer = new MemorySaver();

const agent = createDeepAgent({
  backend: (config) =>
    new CompositeBackend({
      state: new StateBackend(config),
      store: config.store ? new StoreBackend(config) : undefined,
    }),
  store: store,
  checkpointer: checkpointer,
  systemPrompt: "You have both temporary (state) and permanent (store) storage available.",
});

// Agent automatically routes to appropriate backend
const result = await agent.invoke(
  {
    messages: [
      {
        role: "user",
        content: "Save temporary notes to /tmp/notes.txt and permanent settings to /store/config.json",
      },
    ],
  },
  { configurable: { thread_id: "session-1" } }
);
```

### Using Sandbox Backend (Shell Command Execution)

```typescript
import {
  createDeepAgent,
  BaseSandbox,
  type ExecuteResponse,
  type FileUploadResponse,
  type FileDownloadResponse,
} from "deepagents";
import { spawn } from "child_process";

// Create a concrete sandbox by extending BaseSandbox
class LocalShellSandbox extends BaseSandbox {
  readonly id = "local-shell";
  private readonly workingDirectory: string;

  constructor(workingDirectory: string) {
    super();
    this.workingDirectory = workingDirectory;
  }

  // Required: implement execute() method
  async execute(command: string): Promise<ExecuteResponse> {
    return new Promise((resolve) => {
      const child = spawn("/bin/bash", ["-c", command], {
        cwd: this.workingDirectory,
      });

      const chunks: string[] = [];
      child.stdout.on("data", (data) => chunks.push(data.toString()));
      child.stderr.on("data", (data) => chunks.push(data.toString()));

      child.on("close", (exitCode) => {
        resolve({
          output: chunks.join(""),
          exitCode,
          truncated: false,
        });
      });
    });
  }

  async uploadFiles(
    files: Array<[string, Uint8Array]>,
  ): Promise<FileUploadResponse[]> {
    return files.map(([path]) => ({ path, error: null }));
  }

  async downloadFiles(paths: string[]): Promise<FileDownloadResponse[]> {
    return paths.map((path) => ({
      path,
      content: null,
      error: "file_not_found",
    }));
  }
}

// Use the sandbox with your agent
const sandbox = new LocalShellSandbox("./workspace");

const agent = createDeepAgent({
  backend: sandbox,
  systemPrompt: "You can run shell commands using the execute tool.",
});

// Agent now has access to the execute tool
const result = await agent.invoke({
  messages: [
    {
      role: "user",
      content: "Run 'ls -la' to list all files in the workspace",
    },
  ],
});
```

### Adding Skills Middleware for Discoverable Capabilities

```typescript
import {
  createDeepAgent,
  createSettings,
  createSkillsMiddleware,
  listSkills,
} from "deepagents";

// Create settings with project detection
const settings = createSettings();
const agentName = "research-assistant";

// Get skills directories (user and project-level)
const userSkillsDir = settings.getUserSkillsDir(agentName);
const projectSkillsDir = settings.getProjectSkillsDir();

// List available skills
const skills = listSkills({
  userSkillsDir,
  projectSkillsDir,
});

console.log("Available skills:", skills);

// Create skills middleware
const skillsMiddleware = createSkillsMiddleware({
  skillsDir: userSkillsDir,
  assistantId: agentName,
  projectSkillsDir: projectSkillsDir || undefined,
});

// Create agent with skills support
const agent = createDeepAgent({
  middleware: [skillsMiddleware],
  systemPrompt: "You are a research assistant with access to specialized skills.",
});

// Skills are automatically injected into the system prompt
// Agent can read SKILL.md files to learn how to use each skill
const result = await agent.invoke({
  messages: [
    {
      role: "user",
      content: "What skills do you have? Use the web-research skill to research quantum computing.",
    },
  ],
});
```

### Adding Agent Memory Middleware for Long-term Memory

```typescript
import {
  createDeepAgent,
  createSettings,
  createAgentMemoryMiddleware,
} from "deepagents";

// Create settings with project detection
const settings = createSettings();
const agentName = "code-assistant";

// Get memory paths
const userMemoryPath = settings.getUserAgentMdPath(agentName);
const projectMemoryPath = settings.getProjectAgentMdPath();

console.log("User memory:", userMemoryPath);
console.log("Project memory:", projectMemoryPath);

// Create agent memory middleware
const memoryMiddleware = createAgentMemoryMiddleware({
  settings,
  assistantId: agentName,
});

// Create agent with long-term memory
const agent = createDeepAgent({
  middleware: [memoryMiddleware],
  systemPrompt: "You are a code assistant that remembers user preferences.",
});

// Memory from agent.md files is automatically loaded into the system prompt
// Agent can read and write to memory files to persist knowledge
const result = await agent.invoke({
  messages: [
    {
      role: "user",
      content: "Remember that I prefer TypeScript over JavaScript and always want type annotations.",
    },
  ],
});

// Later conversation - memory persists
const result2 = await agent.invoke({
  messages: [
    {
      role: "user",
      content: "What are my coding preferences?",
    },
  ],
});
```

### Combining Skills and Memory Middleware

```typescript
import {
  createDeepAgent,
  createSettings,
  createSkillsMiddleware,
  createAgentMemoryMiddleware,
} from "deepagents";
import { ChatAnthropic } from "@langchain/anthropic";

// Setup configuration
const settings = createSettings();
const agentName = "full-featured-agent";

// Create both middleware instances
const skillsMiddleware = createSkillsMiddleware({
  skillsDir: settings.getUserSkillsDir(agentName),
  assistantId: agentName,
  projectSkillsDir: settings.getProjectSkillsDir(),
});

const memoryMiddleware = createAgentMemoryMiddleware({
  settings,
  assistantId: agentName,
});

// Create agent with both skills and memory
const agent = createDeepAgent({
  model: new ChatAnthropic({ model: "claude-sonnet-4-20250514" }),
  middleware: [skillsMiddleware, memoryMiddleware],
  systemPrompt: "You are a powerful assistant with skills and memory.",
});

// Agent now has:
// - Discoverable skills from SKILL.md files
// - Long-term memory from agent.md files
// - All standard Deep Agent features (todos, filesystem, subagents)
const result = await agent.invoke({
  messages: [
    {
      role: "user",
      content: "Check my memory for preferences, then use your skills to help me with this task.",
    },
  ],
});
```

### Using Settings API for Project Detection

```typescript
import { createSettings, findProjectRoot } from "deepagents";

// Create settings with automatic project detection
const settings = createSettings();

console.log("User deepagents directory:", settings.userDeepagentsDir);
console.log("Project root:", settings.projectRoot);
console.log("Has project:", settings.hasProject);

// Get various paths
const agentName = "my-agent";
console.log("Agent directory:", settings.getAgentDir(agentName));
console.log("User skills dir:", settings.getUserSkillsDir(agentName));
console.log("Project skills dir:", settings.getProjectSkillsDir());
console.log("User agent.md path:", settings.getUserAgentMdPath(agentName));
console.log("Project agent.md path:", settings.getProjectAgentMdPath());

// Manual project root detection
const projectRoot = findProjectRoot("/path/to/workspace");
console.log("Found project at:", projectRoot);

// Create settings with custom options
const customSettings = createSettings({
  projectRoot: "/custom/project",
  userDeepagentsDir: "/custom/deepagents",
});
```

### Implementing Human-in-the-Loop with interruptOn

```typescript
import { createDeepAgent } from "deepagents";
import { MemorySaver } from "@langchain/langgraph";
import { tool } from "langchain";
import { z } from "zod";

// Define sensitive tool that requires approval
const deleteFileTool = tool(
  async ({ filePath }: { filePath: string }) => {
    // Delete implementation
    return `Deleted: ${filePath}`;
  },
  {
    name: "delete_file",
    description: "Delete a file",
    schema: z.object({
      filePath: z.string(),
    }),
  }
);

const agent = createDeepAgent({
  tools: [deleteFileTool],
  checkpointer: new MemorySaver(),
  interruptOn: {
    delete_file: {
      allowedDecisions: ["approve", "edit", "reject"],
    },
  },
  systemPrompt: "You can delete files, but will require user approval.",
});

// First invocation - agent requests to delete file
const config = { configurable: { thread_id: "session-1" } };
const result1 = await agent.invoke(
  {
    messages: [{ role: "user", content: "Delete old_data.txt" }],
  },
  config
);

// Agent is interrupted, waiting for approval
console.log("Interrupted for approval:", result1.interrupt);

// Resume with approval
const result2 = await agent.invoke(
  {
    interrupt_decision: {
      resume_value: { action: "approve" },
    },
  },
  config
);

console.log("File deleted after approval");
```

### Adding Custom Middleware

```typescript
import { createDeepAgent } from "deepagents";
import type { AgentMiddleware } from "langchain";
import { tool } from "langchain";
import { z } from "zod";

// Define custom tools
const fetchApiTool = tool(
  async ({ endpoint }: { endpoint: string }) => {
    return `API response from ${endpoint}`;
  },
  {
    name: "fetch_api",
    description: "Fetch data from API",
    schema: z.object({
      endpoint: z.string(),
    }),
  }
);

const parseJsonTool = tool(
  async ({ json }: { json: string }) => {
    return JSON.parse(json);
  },
  {
    name: "parse_json",
    description: "Parse JSON string",
    schema: z.object({
      json: z.string(),
    }),
  }
);

// Create custom middleware
class ApiMiddleware implements AgentMiddleware {
  tools = [fetchApiTool, parseJsonTool];

  // Optional: Add custom hooks
  async beforeToolExecution(toolName: string, toolInput: any) {
    console.log(`Executing tool: ${toolName}`);
    return toolInput;
  }
}

const agent = createDeepAgent({
  systemPrompt: "You can fetch and parse API data.",
  middleware: [new ApiMiddleware()],
});

const result = await agent.invoke({
  messages: [
    {
      role: "user",
      content: "Fetch data from /api/users and parse the response",
    },
  ],
});
```

### Building a Research Agent with Multiple Subagents

```typescript
import { createDeepAgent, type SubAgent } from "deepagents";
import { ChatAnthropic } from "@langchain/anthropic";
import { tool } from "langchain";
import { TavilySearch } from "@langchain/tavily";
import { z } from "zod";

// Internet search tool
const internetSearch = tool(
  async ({ query, maxResults = 5 }: { query: string; maxResults?: number }) => {
    const tavily = new TavilySearch({
      maxResults,
      tavilyApiKey: process.env.TAVILY_API_KEY,
    });
    return await tavily._call({ query });
  },
  {
    name: "internet_search",
    description: "Search the internet",
    schema: z.object({
      query: z.string(),
      maxResults: z.number().optional().default(5),
    }),
  }
);

// Research subagent for deep dives
const researchSubagent: SubAgent = {
  name: "research-agent",
  description: "Conducts in-depth research on specific topics. Give it one focused question at a time.",
  systemPrompt: `You are a thorough researcher. Conduct deep research and provide a detailed answer.

Your FINAL message is what gets passed to the user, so make it comprehensive.`,
  tools: [internetSearch],
};

// Critique subagent for quality control
const critiqueSubagent: SubAgent = {
  name: "critique-agent",
  description: "Reviews and critiques research reports for completeness and quality.",
  systemPrompt: `You are an editor. Read the report from final_report.md and critique it.

Check for:
- Comprehensive coverage of the topic
- Proper structure and organization
- Accurate citations
- Clear, fluent writing

Do not edit the report yourself, just provide critique.`,
  tools: [internetSearch],
};

// Main orchestrator agent
const agent = createDeepAgent({
  model: new ChatAnthropic({
    model: "claude-sonnet-4-20250514",
    temperature: 0,
  }),
  tools: [internetSearch],
  subagents: [researchSubagent, critiqueSubagent],
  systemPrompt: `You are an expert researcher. Your workflow:

1. Save the user's question to question.txt
2. Use research-agent to investigate topics (call multiple in parallel for different aspects)
3. Compile findings into final_report.md with proper markdown structure
4. Use critique-agent to review the report
5. Make improvements based on critique
6. Iterate until the report is excellent

Format reports with:
- # Title
- ## Sections
- Proper citations: [1] Source: URL
- ### Sources section at end`,
});

// Execute complex research task
const result = await agent.invoke(
  {
    messages: [
      {
        role: "user",
        content: "Research the current state of quantum computing and write a comprehensive report",
      },
    ],
  },
  { recursionLimit: 100 }
);

// Access the generated report
console.log("Report:", result.files["/final_report.md"]);
console.log("Todo list:", result.todos);
```

### Streaming Agent Responses

```typescript
import { createDeepAgent } from "deepagents";

const agent = createDeepAgent({
  systemPrompt: "You are a helpful assistant.",
});

// Stream agent responses in real-time
const stream = await agent.stream({
  messages: [
    {
      role: "user",
      content: "Write a short story about a robot",
    },
  ],
});

for await (const chunk of stream) {
  if (chunk.messages) {
    const lastMessage = chunk.messages[chunk.messages.length - 1];
    if (lastMessage.content) {
      process.stdout.write(lastMessage.content);
    }
  }

  // Access intermediate state
  if (chunk.todos) {
    console.log("\nCurrent todos:", chunk.todos);
  }
}
```

### Using Filesystem Tools Independently

```typescript
import { createAgent } from "langchain";
import { createFilesystemMiddleware, StateBackend } from "deepagents";

// Use filesystem middleware without other deep agent features
const agent = createAgent({
  model: "claude-sonnet-4-20250514",
  middleware: [
    createFilesystemMiddleware({
      backend: (config) => new StateBackend(config),
      systemPrompt: "Use filesystem tools to organize information.",
      customToolDescriptions: {
        ls: "List files in a directory",
        read_file: "Read file contents with line numbers",
        write_file: "Create a new file",
        edit_file: "Edit existing file by string replacement",
        glob: "Find files matching a pattern like **/*.ts",
        grep: "Search for text within files using regex",
      },
    }),
  ],
});

const result = await agent.invoke({
  messages: [
    {
      role: "user",
      content: "Create a file structure for a TypeScript project: src/, tests/, and README.md",
    },
  ],
});

// Agent has access to: ls, read_file, write_file, edit_file, glob, grep
console.log("Created files:", Object.keys(result.files || {}));
```

## Summary

Deep Agents provides a powerful framework for building AI agents that can handle complex, multi-step tasks through planning, memory management, task delegation, and discoverable skills. The primary use cases include research agents that gather and synthesize information from multiple sources, code assistants that analyze and generate code with specialized subagents for testing and review, data analysis workflows that process and store results across multiple conversation sessions, and autonomous task executors that break down complex objectives into manageable subtasks. The library is particularly well-suited for applications requiring agents to maintain context over long interactions, delegate specialized work to focused subagents, persist information across conversation threads, leverage reusable skills for common workflows, and execute shell commands in sandboxed environments.

Integration patterns in Deep Agents are designed around modularity and composability. The `createDeepAgent` function provides a batteries-included solution with planning, filesystem, and subagent capabilities automatically configured, while individual middleware components—including Skills and Agent Memory middleware—can be used independently with `createAgent` for more fine-grained control. Backend configuration is flexible, supporting in-memory ephemeral storage via StateBackend for development and testing, persistent cross-conversation storage via StoreBackend with LangGraph's Store infrastructure, direct filesystem access via FilesystemBackend for agents that need to interact with real files, sandbox environments via BaseSandbox for executing shell commands, and composite backends that combine multiple storage strategies. The middleware architecture allows for easy extension with custom tools and behaviors, while the subagent system enables hierarchical agent structures where specialized agents handle focused subtasks and return results to orchestrating parent agents. The Skills system provides progressive disclosure of capabilities through SKILL.md files, and the Agent Memory system enables long-term memory persistence through agent.md files at both user and project levels.
