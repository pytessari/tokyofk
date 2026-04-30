import { useRef, useState } from "react";
import {
  ImageIcon,
  VideoIcon,
  Link2Icon,
  FontBoldIcon,
  FontItalicIcon,
  UnderlineIcon,
  StrikethroughIcon,
  TextAlignCenterIcon,
  QuoteIcon,
  ListBulletIcon,
  HeadingIcon,
  CodeIcon,
  DividerHorizontalIcon,
  StarIcon,
  ColorWheelIcon,
} from "@radix-ui/react-icons";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { RichBio } from "@/components/RichBio";

const COLORS = [
  "#d90036", // ruby
  "#ff8ad9", // pink
  "#ff7a18", // orange
  "#ffd166", // yellow
  "#7af0a5", // mint
  "#5dc8ff", // sky
  "#b58cff", // violet
  "#ffffff", // white
];

export function RichBioEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [mode, setMode] = useState<"visual" | "html">("visual");

  function insert(snippet: string) {
    const el = ref.current;
    if (!el) {
      onChange((value || "") + snippet);
      return;
    }
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const next = value.slice(0, start) + snippet + value.slice(end);
    onChange(next);
    requestAnimationFrame(() => {
      el.focus();
      el.selectionStart = el.selectionEnd = start + snippet.length;
    });
  }

  function wrap(before: string, after: string, placeholder = "texto") {
    const el = ref.current;
    if (!el) {
      onChange((value || "") + `${before}${placeholder}${after}`);
      return;
    }
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = value.slice(start, end) || placeholder;
    const replacement = `${before}${selected}${after}`;
    const next = value.slice(0, start) + replacement + value.slice(end);
    onChange(next);
    requestAnimationFrame(() => {
      el.focus();
      el.selectionStart = start + before.length;
      el.selectionEnd = start + before.length + selected.length;
    });
  }

  function promptImage() {
    const url = prompt("URL da imagem ou GIF (Tenor, Imgur, etc.):");
    if (!url) return;
    insert(`\n<img src="${url}" alt="" style="max-width:100%;border-radius:8px;margin:8px 0;" />\n`);
  }

  function promptVideo() {
    const url = prompt("URL do YouTube, Tenor ou embed:");
    if (!url) return;
    let embed = url;
    const yt = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([\w-]{11})/);
    if (yt) embed = `https://www.youtube.com/embed/${yt[1]}`;
    insert(
      `\n<iframe src="${embed}" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen frameborder="0" style="width:100%;aspect-ratio:16/9;border-radius:8px;margin:8px 0;"></iframe>\n`,
    );
  }

  function promptSpotify() {
    const url = prompt("URL do Spotify (track, álbum, playlist):");
    if (!url) return;
    const m = url.match(/spotify\.com\/(track|album|playlist|episode|show)\/([a-zA-Z0-9]+)/);
    if (!m) {
      alert("Link inválido. Cole uma URL do Spotify.");
      return;
    }
    insert(
      `\n<iframe src="https://open.spotify.com/embed/${m[1]}/${m[2]}" style="width:100%;height:152px;border-radius:12px;margin:8px 0;" frameborder="0" allow="encrypted-media"></iframe>\n`,
    );
  }

  function promptLink() {
    const url = prompt("URL do link:");
    if (!url) return;
    const text = prompt("Texto do link:") || url;
    insert(`<a href="${url}" target="_blank" rel="noopener noreferrer">${text}</a>`);
  }

  function applyColor(color: string) {
    wrap(`<span style="color:${color}">`, `</span>`, "texto");
  }

  return (
    <div className="space-y-3">
      <Tabs value={mode} onValueChange={(v) => setMode(v as "visual" | "html")}>
        <TabsList className="bg-black/40">
          <TabsTrigger value="visual">Visual</TabsTrigger>
          <TabsTrigger value="html">HTML</TabsTrigger>
        </TabsList>

        <TabsContent value="visual" className="mt-3 space-y-3">
          {/* Texto */}
          <ToolbarGroup label="Texto">
            <ToolBtn aria-label="Negrito" onClick={() => wrap("<strong>", "</strong>")}>
              <FontBoldIcon className="h-3.5 w-3.5" />
            </ToolBtn>
            <ToolBtn aria-label="Itálico" onClick={() => wrap("<em>", "</em>")}>
              <FontItalicIcon className="h-3.5 w-3.5" />
            </ToolBtn>
            <ToolBtn aria-label="Sublinhado" onClick={() => wrap("<u>", "</u>")}>
              <UnderlineIcon className="h-3.5 w-3.5" />
            </ToolBtn>
            <ToolBtn aria-label="Riscado" onClick={() => wrap("<s>", "</s>")}>
              <StrikethroughIcon className="h-3.5 w-3.5" />
            </ToolBtn>
            <ToolBtn aria-label="Código" onClick={() => wrap("<code>", "</code>")}>
              <CodeIcon className="h-3.5 w-3.5" />
            </ToolBtn>
            <ToolBtn aria-label="Centralizar" onClick={() => wrap('<p style="text-align:center">', "</p>", "texto")}>
              <TextAlignCenterIcon className="h-3.5 w-3.5" />
            </ToolBtn>
          </ToolbarGroup>

          {/* Estrutura */}
          <ToolbarGroup label="Estrutura">
            <ToolBtn aria-label="Título grande" onClick={() => wrap("<h2>", "</h2>", "Título")}>
              <HeadingIcon className="h-3.5 w-3.5" />
              <span className="ml-1 text-[10px]">H2</span>
            </ToolBtn>
            <ToolBtn aria-label="Título médio" onClick={() => wrap("<h3>", "</h3>", "Subtítulo")}>
              <HeadingIcon className="h-3.5 w-3.5" />
              <span className="ml-1 text-[10px]">H3</span>
            </ToolBtn>
            <ToolBtn aria-label="Citação" onClick={() => wrap("<blockquote>", "</blockquote>", "citação")}>
              <QuoteIcon className="h-3.5 w-3.5" />
            </ToolBtn>
            <ToolBtn aria-label="Lista" onClick={() => insert("\n<ul>\n  <li>item</li>\n  <li>item</li>\n</ul>\n")}>
              <ListBulletIcon className="h-3.5 w-3.5" />
            </ToolBtn>
            <ToolBtn aria-label="Separador" onClick={() => insert("\n<hr />\n")}>
              <DividerHorizontalIcon className="h-3.5 w-3.5" />
            </ToolBtn>
          </ToolbarGroup>

          {/* Mídia */}
          <ToolbarGroup label="Mídia">
            <ToolBtn aria-label="Imagem ou GIF" onClick={promptImage}>
              <ImageIcon className="h-3.5 w-3.5" />
              <span className="ml-1 text-[10px]">IMG/GIF</span>
            </ToolBtn>
            <ToolBtn aria-label="Vídeo" onClick={promptVideo}>
              <VideoIcon className="h-3.5 w-3.5" />
              <span className="ml-1 text-[10px]">VÍDEO</span>
            </ToolBtn>
            <ToolBtn aria-label="Spotify" onClick={promptSpotify}>
              <StarIcon className="h-3.5 w-3.5" />
              <span className="ml-1 text-[10px]">SPOTIFY</span>
            </ToolBtn>
            <ToolBtn aria-label="Link" onClick={promptLink}>
              <Link2Icon className="h-3.5 w-3.5" />
              <span className="ml-1 text-[10px]">LINK</span>
            </ToolBtn>
          </ToolbarGroup>

          {/* Cores */}
          <ToolbarGroup label="Cor do texto">
            <ColorWheelIcon className="h-3.5 w-3.5 text-white/50" aria-hidden="true" />
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => applyColor(c)}
                aria-label={`Aplicar cor ${c}`}
                className="h-5 w-5 rounded-full border border-white/30 outline-none transition hover:scale-110 focus-visible:ring-2 focus-visible:ring-white"
                style={{ background: c }}
              />
            ))}
          </ToolbarGroup>

          <details className="rounded border border-amber-300/30 bg-amber-300/5 px-3 py-2 text-[11px] text-amber-200/80">
            <summary className="cursor-pointer font-display tracking-widest">EFEITO ORKUT (uso consciente)</summary>
            <div className="mt-2 flex flex-wrap gap-2">
              <ToolBtn
                aria-label="Texto rolando (marquee)"
                onClick={() => insert(`\n<marquee scrollamount="4">texto rolando ✦</marquee>\n`)}
              >
                <span className="text-[10px]">MARQUEE</span>
              </ToolBtn>
              <p className="text-[10px] text-amber-200/60">
                Movimento contínuo pode atrapalhar quem tem sensibilidade visual. Use com moderação.
              </p>
            </div>
          </details>

          <textarea
            ref={ref}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={10}
            aria-label="Conteúdo da ficha"
            placeholder="Sua ficha — selecione um trecho e clique nos botões acima."
            className="w-full rounded-md border border-white/15 bg-black/50 px-3 py-2 font-mono text-xs text-white outline-none focus:border-[color:var(--ruby)]"
          />
        </TabsContent>

        <TabsContent value="html" className="mt-3">
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={14}
            aria-label="HTML cru da ficha"
            placeholder="<h2>Sobre mim</h2><p>...</p>"
            className="w-full rounded-md border border-white/15 bg-black/50 px-3 py-2 font-mono text-xs text-white outline-none focus:border-[color:var(--ruby)]"
          />
          <p className="mt-1 text-[10px] text-white/50">
            HTML é sanitizado automaticamente — scripts e atributos perigosos são removidos.
          </p>
        </TabsContent>
      </Tabs>

      <div>
        <p className="mb-2 font-display text-[10px] tracking-widest text-white/60">PRÉVIA</p>
        <div className="rounded-md border border-white/10 bg-black/40 p-4">
          <RichBio html={value} fallback="Comece a escrever pra ver a prévia." />
        </div>
      </div>
    </div>
  );
}

function ToolbarGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded border border-white/10 bg-black/30 px-2 py-1.5">
      <span className="font-display text-[9px] tracking-widest text-white/40">{label.toUpperCase()}</span>
      {children}
    </div>
  );
}

function ToolBtn({
  onClick,
  children,
  ...rest
}: { onClick: () => void; children: React.ReactNode } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      onClick={onClick}
      {...rest}
      className="inline-flex items-center rounded border border-white/15 bg-black/40 px-2 py-1 font-display text-[10px] tracking-widest text-white/85 outline-none transition hover:border-[color:var(--ruby)] hover:text-white focus-visible:ring-2 focus-visible:ring-[color:var(--ruby)]"
    >
      {children}
    </button>
  );
}
