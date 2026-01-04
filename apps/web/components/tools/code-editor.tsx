"use client";

import Editor from "react-simple-code-editor";
import { Highlight, themes } from "prism-react-renderer";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";

interface TypeScriptEditorProps {
  code: string;
  onChange: (code: string) => void;
  className?: string;
}

export function TypeScriptEditor({
  code,
  onChange,
  className,
}: TypeScriptEditorProps) {
  const { theme } = useTheme();
  const highlightCode = (code: string) => (
    <Highlight
      theme={theme == "dark" ? themes.vsDark : themes.vsLight}
      code={code}
      language="typescript"
    >
      {({ tokens, getLineProps, getTokenProps }) => (
        <>
          {tokens.map((line, i) => (
            <div key={i} {...getLineProps({ line })}>
              {line.map((token, key) => (
                <span key={key} {...getTokenProps({ token })} />
              ))}
            </div>
          ))}
        </>
      )}
    </Highlight>
  );

  return (
    <div
      className={cn(
        "w-full dark:focus:bg-gaia-900! overflow-auto! h-full! rounded-lg border border-gaia-400 dark:border-zinc-700 bg-[#1e1e1e]",
        className
      )}
    >
      <Editor
        value={code}
        onValueChange={onChange}
        highlight={highlightCode}
        padding={16}
        style={{
          fontFamily: '"Fira Code", "Fira Mono", Consolas, monospace',
          fontSize: 14,
          lineHeight: 1.6,
          minHeight: "100%",
          width: "100%",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          overflowWrap: "break-word",
        }}
        textareaClassName="focus:outline-none w-full "
        className="w-full h-full overflow-auto! dark:focus:bg-gaia-900!"
      />
    </div>
  );
}
