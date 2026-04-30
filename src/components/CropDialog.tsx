import { useCallback, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { Button } from "@/components/ui/button";

type Props = {
  src: string;
  aspect: number; // ex: 1 (quadrado), 3 (banner 3:1)
  cropShape?: "rect" | "round";
  /** lado mais longo máximo do export (px). Default 1600. */
  maxOutput?: number;
  onCancel: () => void;
  onConfirm: (blob: Blob) => void | Promise<void>;
  saving?: boolean;
};

async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function getCroppedBlob(src: string, area: Area, maxOutput: number): Promise<Blob> {
  const image = await loadImage(src);

  // Garante que cortamos em pixels REAIS da imagem (não apenas do contêiner)
  const sx = Math.max(0, Math.round(area.x));
  const sy = Math.max(0, Math.round(area.y));
  const sw = Math.max(1, Math.round(area.width));
  const sh = Math.max(1, Math.round(area.height));

  // Limita o lado maior pra evitar arquivos enormes mas mantém alta qualidade
  const longest = Math.max(sw, sh);
  const scale = longest > maxOutput ? maxOutput / longest : 1;
  const dw = Math.round(sw * scale);
  const dh = Math.round(sh * scale);

  const canvas = document.createElement("canvas");
  canvas.width = dw;
  canvas.height = dh;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas context unavailable");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(image, sx, sy, sw, sh, 0, 0, dw, dh);

  return await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("blob failed"))),
      "image/jpeg",
      0.95,
    ),
  );
}

export function CropDialog({ src, aspect, cropShape = "rect", maxOutput = 1600, onCancel, onConfirm, saving }: Props) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [areaPx, setAreaPx] = useState<Area | null>(null);

  const onComplete = useCallback((_: Area, pixels: Area) => {
    setAreaPx(pixels);
  }, []);

  async function handleConfirm() {
    if (!areaPx) return;
    const blob = await getCroppedBlob(src, areaPx, maxOutput);
    await onConfirm(blob);
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-stretch justify-center bg-black/85 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="flex w-full max-w-2xl flex-col overflow-hidden bg-[color:var(--surface-1)] shadow-xl sm:max-h-[92vh] sm:rounded-lg sm:border sm:border-white/10">
        <div className="shrink-0 border-b border-white/10 px-4 py-3">
          <p className="font-display text-sm tracking-widest text-white">AJUSTAR IMAGEM</p>
          <p className="text-xs text-[color:var(--text-3)]">Arraste pra mover · pinça/scroll pra dar zoom.</p>
        </div>
        <div className="relative flex-1 bg-black sm:h-[60vh] sm:min-h-[320px] sm:flex-none">
          <Cropper
            image={src}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            cropShape={cropShape}
            showGrid
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onComplete}
            objectFit="contain"
          />
        </div>
        <div
          className="shrink-0 flex flex-col gap-3 border-t border-white/10 bg-black/40 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
          style={{ paddingBottom: "max(env(safe-area-inset-bottom), 0.75rem)" }}
        >
          <label className="flex flex-1 items-center gap-3 text-xs text-white/70">
            Zoom
            <input
              type="range"
              min={1}
              max={4}
              step={0.05}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1 accent-[color:var(--ruby)]"
            />
          </label>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={onCancel} disabled={saving}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={handleConfirm} loading={saving} disabled={!areaPx}>
              Salvar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
