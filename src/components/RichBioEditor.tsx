import { useRef } from "react";
import { Image as ImageIcon, Film, Link2, Sparkles } from "lucide-react";
import { RichBio } from "@/components/RichBio";

export function RichBioEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  function insert(snippet: string) {
    const el = ref.current;
    if (!el) { onChange((value || "") + snippet); return; }
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const next = value.slice(0, start) + snippet + value.slice(end);
    onChange(next);
    requestAnimationFrame(() => {
      el.focus();
      el.selectionStart = el.selectionEnd = start + snippet.length;
    });
  }

  function promptImage() {
    const url = prompt("URL da imagem ou GIF (Tenor, Imgur, etc.):");
    if (!url) return;
    insert(`\n<img src="${url}" alt="" style="max-width:100%;border-radius:8px;margin:8px 0;" />\n`);
  }

  function promptVideo() {
    const url = prompt("URL do YouTube, Tenor (link do gif) ou embed:");
    if (!url) return;
    let embed = url;
    const yt = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([\w-]{11})/);
    if (yt) embed = `https://www.youtube.com/embed/${yt[1]}`;
    insert(
      `\n<iframe src="${embed}" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen frameborder="0" style="width:100%;aspect-ratio:16/9;border-radius:8px;margin:8px 0;"></iframe>\n`
    );
  }

  function promptLink() {
    const url = prompt("URL do link:");
    if (!url) return;
    const text = prompt("Texto do link:") || url;
    insert(`<a href="${url}" target="_blank" rel="noopener noreferrer">${text}</a>`);
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <ToolBtn onClick={promptImage} icon={<ImageIcon className="h-3.5 w-3.5" />}>Imagem / GIF</ToolBtn>
        <ToolBtn onClick={promptVideo} icon={<Film className="h-3.5 w-3.5" />}>Vídeo</ToolBtn>
        <ToolBtn onClick={promptLink} icon={<Link2 className="h-3.5 w-3.5" />}>Link</ToolBtn>
        <ToolBtn onClick={() => insert("<strong></strong>")} icon={<Sparkles className="h-3.5 w-3.5" />}>Negrito</ToolBtn>
      </div>

      <textarea
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={10}
        placeholder="Sua ficha — pode usar HTML, imagens, GIFs e vídeos."
        className="w-full rounded-md border border-white/15 bg-black/50 px-3 py-2 font-mono text-xs text-white outline-none focus:border-[color:var(--ruby)]"
      />

      <div>
        <p className="mb-2 font-display text-[10px] tracking-widest text-white/50">PRÉVIA</p>
        <div className="rounded-md border border-white/10 bg-black/40 p-4">
          <RichBio html={value} fallback="Comece a escrever pra ver a prévia." />
        </div>
      </div>
    </div>
  );
}

function ToolBtn({ onClick, icon, children }: { onClick: () => void; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded border border-white/15 bg-black/40 px-2.5 py-1 font-display text-[10px] tracking-widest text-white/80 transition hover:border-[color:var(--ruby)] hover:text-white"
    >
      {icon}
      {children}
    </button>
  );
}
