import { useCallback, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { Button } from "@/components/ui/button";

type Props = {
  src: string;
  aspect: number; // ex: 1 (quadrado), 3 (banner 3:1)
  cropShape?: "rect" | "round";
  onCancel: () => void;
  onConfirm: (blob: Blob) => void | Promise<void>;
  saving?: boolean;
};

async function getCroppedBlob(src: string, area: Area): Promise<Blob> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(area.width);
  canvas.height = Math.round(area.height);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas context unavailable");
  ctx.drawImage(
    image,
    Math.round(area.x),
    Math.round(area.y),
    Math.round(area.width),
    Math.round(area.height),
    0,
    0,
    canvas.width,
    canvas.height,
  );
  return await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("blob failed"))),
      "image/jpeg",
      0.92,
    ),
  );
}

export function CropDialog({ src, aspect, cropShape = "rect", onCancel, onConfirm, saving }: Props) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [areaPx, setAreaPx] = useState<Area | null>(null);

  const onComplete = useCallback((_: Area, pixels: Area) => {
    setAreaPx(pixels);
  }, []);

  async function handleConfirm() {
    if (!areaPx) return;
    const blob = await getCroppedBlob(src, areaPx);
    await onConfirm(blob);
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="flex w-full max-w-2xl flex-col overflow-hidden rounded-lg border border-white/10 bg-[color:var(--surface-1)] shadow-xl">
        <div className="border-b border-white/10 px-4 py-3">
          <p className="font-display text-sm tracking-widest text-white">AJUSTAR IMAGEM</p>
          <p className="text-xs text-[color:var(--text-3)]">Arraste pra mover, use o zoom pra ajustar.</p>
        </div>
        <div className="relative h-[60vh] min-h-[280px] w-full bg-black">
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
        <div className="flex flex-col gap-3 border-t border-white/10 bg-black/40 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
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
