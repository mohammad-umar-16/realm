import { Captions, AudioLines, MessagesSquare } from "lucide-react";

const FEATURES = [
  { icon: Captions, title: "Live translated captions", detail: "Read what's said, in your own language, as they speak." },
  { icon: AudioLines, title: "Real-time voice translation", detail: "Hear it spoken back to you, not just subtitled." },
  { icon: MessagesSquare, title: "Message across languages", detail: "Chat and call your contacts — everything translates both ways." },
];

export function BrandPanel() {
  return (
    <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-surface p-12 lg:flex">
      <div className="flex items-center gap-3">
        <img src="/logo-icon.png" alt="" className="h-9 w-9 rounded-lg" />
        <span className="font-display text-2xl text-ink">Realm</span>
      </div>

      <div className="max-w-md">
        <h1 className="mb-3 font-display text-4xl leading-tight text-ink">Talk beyond borders.</h1>
        <p className="mb-10 text-ink-muted">
          Video call anyone, in any language — Realm translates as you speak, live.
        </p>

        <div className="space-y-6">
          {FEATURES.map((f) => (
            <div key={f.title} className="flex gap-3 border-l-2 border-gold pl-4">
              <f.icon className="mt-0.5 h-5 w-5 flex-shrink-0 text-gold-light" strokeWidth={1.75} />
              <div>
                <p className="font-medium text-ink">{f.title}</p>
                <p className="text-sm text-ink-muted">{f.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <p className="text-xs text-ink-muted">Real-time translation across 7 languages</p>
    </div>
  );
}