import { CopilotKit, useCopilotChat, useCopilotReadable } from "@copilotkit/react-core";
import { TextMessage, Role } from "@copilotkit/runtime-client-gql";
import { CopilotPopup } from "@copilotkit/react-ui";
import { Dashboard } from "./components/Dashboard";
import { PromptInput } from "./components/PromptInput";
import { QueryChips } from "./components/QueryChips";
import { SYSTEM_PROMPT } from "./prompt/system-prompt";
import { useShowFuelBreakdown } from "./tools/useShowFuelBreakdown";
import { useShowTrend } from "./tools/useShowTrend";
import { useShowTopMakes } from "./tools/useShowTopMakes";

const RUNTIME_URL =
  import.meta.env.VITE_COPILOT_RUNTIME_URL ?? "http://localhost:4001/api/copilotkit";

function Shell() {
  useCopilotReadable({ description: "system instructions", value: SYSTEM_PROMPT });
  useShowFuelBreakdown();
  useShowTrend();
  useShowTopMakes();

  const { appendMessage } = useCopilotChat();

  const ask = (text: string) => {
    void appendMessage(new TextMessage({ content: text, role: Role.User }));
  };

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header>
          <h1 className="text-2xl font-bold text-slate-900">
            UK Vehicle Registrations — Demo B
          </h1>
          <p className="text-sm text-slate-600">
            CopilotKit Static AG-UI · Generative dashboard powered by Claude
          </p>
        </header>
        <PromptInput onSubmit={ask} />
        <QueryChips onPick={ask} />
        <Dashboard />
      </div>
      <CopilotPopup
        defaultOpen={false}
        labels={{
          title: "Vehicles assistant",
          initial: "Ask about UK vehicle registrations…",
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <CopilotKit runtimeUrl={RUNTIME_URL} useSingleEndpoint={false}>
      <Shell />
    </CopilotKit>
  );
}
