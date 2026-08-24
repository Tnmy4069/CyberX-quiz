'use client';

import { useState } from 'react';
import { Eye, EyeOff, Copy, Check, AlertCircle } from 'lucide-react';

export type EnvVarRow = {
  key: string;
  value: string | null;
  required: boolean;
};

function maskValue(value: string) {
  if (value.length <= 8) return '•'.repeat(Math.max(value.length, 6));
  return `${value.slice(0, 4)}${'•'.repeat(8)}${value.slice(-4)}`;
}

export function EnvVarsPanel({ vars }: { vars: EnvVarRow[] }) {
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState<string | null>(null);

  const copy = async (key: string, value: string) => {
    await navigator.clipboard.writeText(value);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <div className="bg-card text-card-foreground border border-border rounded-2xl shadow-sm p-6 space-y-4">
      <div>
        <h3 className="text-base font-bold tracking-tight text-foreground">Environment Variables</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Server-side values as seen by this deployment. Secrets stay masked until you reveal them.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-secondary/40 border-b border-border text-xs font-semibold text-muted-foreground uppercase">
              <th className="px-4 py-3">Key</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Value</th>
              <th className="px-4 py-3 w-28">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {vars.map((row) => {
              const isSet = Boolean(row.value);
              const show = revealed[row.key];
              return (
                <tr key={row.key} className="hover:bg-secondary/20 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs font-semibold text-foreground">{row.key}</td>
                  <td className="px-4 py-3">
                    {isSet ? (
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                        Set
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-destructive">
                        <AlertCircle className="h-3 w-3" />
                        {row.required ? 'Missing' : 'Not set'}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground break-all max-w-xl">
                    {!isSet ? '—' : show ? row.value : maskValue(row.value as string)}
                  </td>
                  <td className="px-4 py-3">
                    {isSet && (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() =>
                            setRevealed((prev) => ({ ...prev, [row.key]: !prev[row.key] }))
                          }
                          className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground cursor-pointer"
                          title={show ? 'Hide' : 'Reveal'}
                        >
                          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => copy(row.key, row.value as string)}
                          className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground cursor-pointer"
                          title="Copy"
                        >
                          {copied === row.key ? (
                            <Check className="h-4 w-4 text-emerald-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
