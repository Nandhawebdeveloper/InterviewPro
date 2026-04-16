import { useState, useRef } from "react";
import Editor from "@monaco-editor/react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import endpoints from "../services/endpoints";
import UpgradeModal from "../components/UpgradeModal";

const LANGUAGES = [
  { value: "python", label: "Python", defaultCode: '# Write your Python code here\nprint("Hello, World!")' },
  {
    value: "javascript",
    label: "JavaScript",
    defaultCode: '// Write your JavaScript code here\nconsole.log("Hello, World!");',
  },
];

const CodeEditor = () => {
  const { theme } = useTheme();
  const { features, paymentEnabled } = useAuth();
  const [language, setLanguage] = useState("python");
  const [code, setCode] = useState(LANGUAGES[0].defaultCode);
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [running, setRunning] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const editorRef = useRef(null);

  const isLocked = paymentEnabled && features && !features.coding;

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    const langDef = LANGUAGES.find((l) => l.value === lang);
    setCode(langDef?.defaultCode || "");
    setOutput("");
    setError("");
  };

  const handleRun = async () => {
    setRunning(true);
    setOutput("");
    setError("");

    const res = await endpoints.runCode(language, code);
    if (res.success) {
      setOutput(res.data.output || "");
      if (res.data.error) setError(res.data.error);
    } else {
      setError(res.message || "Execution failed");
    }
    setRunning(false);
  };

  const handleClear = () => {
    setOutput("");
    setError("");
  };

  const handleReset = () => {
    const langDef = LANGUAGES.find((l) => l.value === language);
    setCode(langDef?.defaultCode || "");
    setOutput("");
    setError("");
  };

  return (
    <div className="code-editor-page">
      <UpgradeModal isOpen={showUpgrade} onClose={() => setShowUpgrade(false)} feature="Code Editor" />
      {isLocked && (
        <div className="feature-locked-banner">
          <span>🔒 Code Editor is a Pro feature.</span>
          <button className="btn btn-primary btn-sm" onClick={() => setShowUpgrade(true)}>
            Upgrade to Pro
          </button>
        </div>
      )}
      <div className="page-header">
        <h1>💻 Code Editor</h1>
        <p className="text-secondary">Write and run code directly in your browser</p>
      </div>

      <div className="code-editor-layout">
        {/* Toolbar */}
        <div className="code-toolbar">
          <div className="code-toolbar-left">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.value}
                className={`btn btn-sm ${language === lang.value ? "btn-primary" : "btn-outline"}`}
                onClick={() => handleLanguageChange(lang.value)}
              >
                {lang.label}
              </button>
            ))}
          </div>
          <div className="code-toolbar-right">
            <button className="btn btn-sm btn-outline" onClick={handleReset}>
              ↺ Reset
            </button>
            <button className="btn btn-sm btn-outline" onClick={handleClear}>
              🗑️ Clear Output
            </button>
            <button
              className="btn btn-sm btn-primary"
              onClick={handleRun}
              disabled={running || !code.trim() || isLocked}
            >
              {running ? "⏳ Running..." : isLocked ? "🔒 Pro Only" : "▶ Run Code"}
            </button>
          </div>
        </div>

        {/* Editor */}
        <div className="code-editor-container">
          <Editor
            height="400px"
            language={language}
            value={code}
            theme={theme === "dark" ? "vs-dark" : "light"}
            onChange={(val) => setCode(val || "")}
            onMount={(editor) => {
              editorRef.current = editor;
            }}
            options={{
              fontSize: 14,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              wordWrap: "on",
              automaticLayout: true,
              tabSize: 2,
              padding: { top: 12 },
            }}
          />
        </div>

        {/* Output panel */}
        <div className="code-output-panel">
          <div className="code-output-header">
            <span>📋 Output</span>
            {output && <span className="badge badge-success">Success</span>}
            {error && <span className="badge badge-danger">Error</span>}
          </div>
          <pre className="code-output-content">
            {running && "Running..."}
            {!running && !output && !error && "Run your code to see output here."}
            {output && <span className="output-text">{output}</span>}
            {error && <span className="output-error">{error}</span>}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default CodeEditor;
