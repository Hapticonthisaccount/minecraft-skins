import { useState, useRef, useEffect, useCallback } from "react";

const SKIN_PARTS = {
  face:     { x: 8,  y: 8,  w: 8,  h: 8  },
  headTop:  { x: 8,  y: 0,  w: 8,  h: 8  },
  headBack: { x: 24, y: 8,  w: 8,  h: 8  },
  body:     { x: 20, y: 20, w: 8,  h: 12 },
  bodyBack: { x: 32, y: 20, w: 8,  h: 12 },
  rightArm: { x: 44, y: 20, w: 4,  h: 12 },
  leftArm:  { x: 36, y: 52, w: 4,  h: 12 },
  rightLeg: { x: 4,  y: 20, w: 4,  h: 12 },
  leftLeg:  { x: 20, y: 52, w: 4,  h: 12 },
};

const PART_LABELS = {
  face: "Face", headTop: "Head Top", headBack: "Head Back",
  body: "Body Front", bodyBack: "Body Back",
  rightArm: "Right Arm", leftArm: "Left Arm",
  rightLeg: "Right Leg", leftLeg: "Left Leg",
};

export default function App() {
  const [img, setImg] = useState(null);
  const [parts, setParts] = useState({ face: true, headTop: true, headBack: true, body: true, bodyBack: true, rightArm: true, leftArm: true, rightLeg: true, leftLeg: true });
  const [detail, setDetail] = useState(4);
  const [panX, setPanX] = useState(50);
  const [panY, setPanY] = useState(50);
  const [zoom, setZoom] = useState(100);
  const previewRef = useRef();
  const fileRef = useRef();

  const buildSkin = useCallback(() => {
    if (!img) return null;
    const canvas = document.createElement("canvas");
    canvas.width = 64; canvas.height = 64;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, 64, 64);

    const src = document.createElement("canvas");
    src.width = img.naturalWidth; src.height = img.naturalHeight;
    src.getContext("2d").drawImage(img, 0, 0);

    Object.entries(parts).filter(([, v]) => v).forEach(([key]) => {
      const p = SKIN_PARTS[key];
      const zf = zoom / 100;
      const cw = img.naturalWidth / zf;
      const ch = img.naturalHeight / zf;
      const ox = (panX / 100) * (img.naturalWidth - cw);
      const oy = (panY / 100) * (img.naturalHeight - ch);

      const pw = Math.max(1, Math.round(p.w / detail));
      const ph = Math.max(1, Math.round(p.h / detail));
      const tiny = document.createElement("canvas");
      tiny.width = pw; tiny.height = ph;
      const tinyCtx = tiny.getContext("2d");
      tinyCtx.imageSmoothingEnabled = false;
      tinyCtx.drawImage(src, ox, oy, cw, ch, 0, 0, pw, ph);

      const tmp = document.createElement("canvas");
      tmp.width = p.w; tmp.height = p.h;
      const tc = tmp.getContext("2d");
      tc.imageSmoothingEnabled = false;
      tc.drawImage(tiny, 0, 0, p.w, p.h);

      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(tmp, p.x, p.y, p.w, p.h);
    });
    return canvas;
  }, [img, parts, detail, panX, panY, zoom]);

  useEffect(() => {
    if (!previewRef.current) return;
    const skin = buildSkin();
    const ctx = previewRef.current.getContext("2d");
    ctx.clearRect(0, 0, 448, 448);
    if (!skin) return;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(skin, 0, 0, 448, 448);
  }, [buildSkin]);

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const i = new Image();
    i.onload = () => setImg(i);
    i.src = url;
  };

  const download = () => {
    const skin = buildSkin();
    if (!skin) return;
    const a = document.createElement("a");
    a.download = "skin.png";
    a.href = skin.toDataURL("image/png");
    a.click();
  };

  return (
    <div style={{ fontFamily: "sans-serif", padding: 24, maxWidth: 700, margin: "0 auto", background: "#fff", minHeight: "100vh" }}>
      <h2 style={{ margin: "0 0 20px" }}>Minecraft Skin Maker</h2>

      <div style={{ marginBottom: 20 }}>
        <label style={{ display: "block", marginBottom: 6, fontWeight: "bold" }}>Image</label>
        <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} />
      </div>

      {img && <>
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", marginBottom: 6, fontWeight: "bold" }}>Apply to</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {Object.keys(SKIN_PARTS).map(k => (
              <label key={k} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 14 }}>
                <input type="checkbox" checked={!!parts[k]} onChange={() => setParts(p => ({ ...p, [k]: !p[k] }))} />
                {PART_LABELS[k]}
              </label>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 20, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 24px" }}>
          <Slider label={`Pixel size: ${detail}`} min={1} max={8} value={detail} onChange={setDetail} />
          <Slider label={`Zoom: ${zoom}%`} min={100} max={400} step={5} value={zoom} onChange={setZoom} />
          <Slider label={`Pan X: ${panX}%`} min={0} max={100} value={panX} onChange={setPanX} />
          <Slider label={`Pan Y: ${panY}%`} min={0} max={100} value={panY} onChange={setPanY} />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", marginBottom: 6, fontWeight: "bold" }}>Preview (64×64 scaled up)</label>
          <canvas ref={previewRef} width={448} height={448} style={{ border: "1px solid #ccc", imageRendering: "pixelated", display: "block" }} />
        </div>

        <button onClick={download} style={{ padding: "8px 20px", fontSize: 15, cursor: "pointer" }}>
          Download skin.png
        </button>
      </>}
    </div>
  );
}

function Slider({ label, min, max, step = 1, value, onChange }) {
  return (
    <div>
      <label style={{ display: "block", marginBottom: 4, fontSize: 14 }}>{label}</label>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))} style={{ width: "100%" }} />
    </div>
  );
}
