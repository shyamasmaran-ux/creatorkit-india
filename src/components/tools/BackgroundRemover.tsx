import React, { useState, useRef, useEffect } from 'react';
import { 
  Scissors, Upload, Download, RefreshCw, AlertCircle, 
  Pipette, Sliders, Eraser, Paintbrush, Info, Check, Eye,
  Sparkles, Layers, ShieldCheck, ArrowRight, HelpCircle
} from 'lucide-react';

interface Props {
  onShowToast: (msg: string) => void;
}

export const BackgroundRemover: React.FC<Props> = ({ onShowToast }) => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('transparent-image');
  const [fileType, setFileType] = useState<string>('');
  const [fileSize, setFileSize] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  // View Mode: 'after' | 'before' | 'split'
  const [viewMode, setViewMode] = useState<'after' | 'before' | 'split'>('after');

  // Chroma / Color key parameters
  const [targetColor, setTargetColor] = useState<{ r: number; g: number; b: number }>({ r: 255, g: 255, b: 255 });
  const [colorHex, setColorHex] = useState<string>('#ffffff');
  const [tolerance, setTolerance] = useState<number>(30);
  const [feather, setFeather] = useState<number>(10);
  
  // Brush Tools
  const [brushMode, setBrushMode] = useState<'pick' | 'erase' | 'restore'>('pick');
  const [brushSize, setBrushSize] = useState<number>(25);
  const [imageVersion, setImageVersion] = useState<number>(0);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const originalImageDataRef = useRef<ImageData | null>(null);
  const originalImageRef = useRef<HTMLImageElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const isDrawingRef = useRef<boolean>(false);

  // Upload handler with validation
  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate format
    const validMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validMimes.includes(file.type)) {
      setError('Please upload a supported image: JPG, PNG, or WebP.');
      return;
    }

    // Validate size (max 25MB)
    if (file.size > 25 * 1024 * 1024) {
      setError('File size exceeds 25MB. Please choose a smaller image.');
      return;
    }

    setError(null);
    setFileName(file.name.replace(/\.[^/.]+$/, ''));
    setFileType(file.type);
    setFileSize(file.size);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const src = evt.target?.result as string;
      const img = new Image();
      img.onload = () => {
        originalImageRef.current = img;
        setImageSrc(src);
        setImageVersion((v) => v + 1);
        onShowToast('Photo loaded! Sample any background color to erase.');
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  };

  // Initialize Canvas once both image and canvas DOM element are ready
  const initCanvas = (img: HTMLImageElement) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);

    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    originalImageDataRef.current = imgData;

    // Auto-sample top-left corner
    const r = imgData.data[0];
    const g = imgData.data[1];
    const b = imgData.data[2];
    const sampledColor = { r, g, b };
    setTargetColor(sampledColor);
    setColorHex(rgbToHex(r, g, b));
    applyRemoval(imgData, sampledColor, tolerance, feather);
  };

  // Real-time Chroma / Color-Keying Algorithm (optimized squared distance math)
  const applyRemoval = (
    baseData: ImageData,
    color: { r: number; g: number; b: number },
    tol: number,
    sm: number
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const output = ctx.createImageData(baseData.width, baseData.height);
    output.data.set(baseData.data);
    const data = output.data;

    const maxDist = (tol / 100) * 441.67;
    const featherDist = (sm / 100) * 80;
    const maxDistSq = maxDist * maxDist;
    const outerDist = maxDist + featherDist;
    const outerDistSq = outerDist * outerDist;
    const targetR = color.r;
    const targetG = color.g;
    const targetB = color.b;

    for (let i = 0, len = data.length; i < len; i += 4) {
      const dr = data[i] - targetR;
      const dg = data[i + 1] - targetG;
      const db = data[i + 2] - targetB;
      const distSq = dr * dr + dg * dg + db * db;

      if (distSq <= maxDistSq) {
        data[i + 3] = 0; // Pure transparent
      } else if (featherDist > 0 && distSq < outerDistSq) {
        // Smooth falloff to preserve hair and clothing edges
        const dist = Math.sqrt(distSq);
        const factor = (dist - maxDist) / featherDist;
        data[i + 3] = (factor * 255 + 0.5) | 0;
      }
    }

    ctx.putImageData(output, 0, 0);
  };

  // Run initCanvas after imageSrc renders and mounts <canvas ref={canvasRef}>
  useEffect(() => {
    if (!imageSrc || !originalImageRef.current || !canvasRef.current) return;
    initCanvas(originalImageRef.current);
  }, [imageSrc, imageVersion]);

  useEffect(() => {
    if (!originalImageDataRef.current) return;
    const rafId = requestAnimationFrame(() => {
      if (originalImageDataRef.current) {
        applyRemoval(originalImageDataRef.current, targetColor, tolerance, feather);
      }
    });
    return () => cancelAnimationFrame(rafId);
  }, [tolerance, feather, targetColor]);

  // Canvas Mouse Actions
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = Math.floor((e.clientX - rect.left) * scaleX);
    const y = Math.floor((e.clientY - rect.top) * scaleY);

    if (brushMode === 'pick' && originalImageDataRef.current) {
      const idx = (y * canvas.width + x) * 4;
      const data = originalImageDataRef.current.data;
      if (idx >= 0 && idx < data.length) {
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        setTargetColor({ r, g, b });
        setColorHex(rgbToHex(r, g, b));
        onShowToast(`Sampled color: ${rgbToHex(r, g, b)}`);
      }
    } else {
      isDrawingRef.current = true;
      applyBrush(x, y);
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || brushMode === 'pick') return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = Math.floor((e.clientX - rect.left) * scaleX);
    const y = Math.floor((e.clientY - rect.top) * scaleY);
    applyBrush(x, y);
  };

  const handleCanvasMouseUp = () => {
    isDrawingRef.current = false;
  };

  // Touch Handlers for Mobile Browsers
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!e.touches[0]) return;
    const touch = e.touches[0];
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = Math.floor((touch.clientX - rect.left) * scaleX);
    const y = Math.floor((touch.clientY - rect.top) * scaleY);

    if (brushMode === 'pick' && originalImageDataRef.current) {
      const idx = (y * canvas.width + x) * 4;
      const data = originalImageDataRef.current.data;
      if (idx >= 0 && idx < data.length) {
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        setTargetColor({ r, g, b });
        setColorHex(rgbToHex(r, g, b));
        onShowToast(`Sampled color: ${rgbToHex(r, g, b)}`);
      }
    } else {
      isDrawingRef.current = true;
      applyBrush(x, y);
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || brushMode === 'pick' || !e.touches[0]) return;
    const touch = e.touches[0];
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = Math.floor((touch.clientX - rect.left) * scaleX);
    const y = Math.floor((touch.clientY - rect.top) * scaleY);
    applyBrush(x, y);
  };

  const handleTouchEnd = () => {
    isDrawingRef.current = false;
  };

  const applyBrush = (cx: number, cy: number) => {
    const canvas = canvasRef.current;
    if (!canvas || !originalImageDataRef.current) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const radius = Math.round(brushSize);
    const startX = Math.max(0, Math.floor(cx - radius));
    const endX = Math.min(canvas.width, Math.ceil(cx + radius));
    const startY = Math.max(0, Math.floor(cy - radius));
    const endY = Math.min(canvas.height, Math.ceil(cy + radius));

    const regionWidth = endX - startX;
    const regionHeight = endY - startY;
    if (regionWidth <= 0 || regionHeight <= 0) return;

    const regionData = ctx.getImageData(startX, startY, regionWidth, regionHeight);
    const regPixels = regionData.data;
    const origData = originalImageDataRef.current.data;
    const fullWidth = canvas.width;
    const radiusSq = radius * radius;

    for (let y = startY; y < endY; y++) {
      const dy = y - cy;
      const dySq = dy * dy;
      const localY = y - startY;
      for (let x = startX; x < endX; x++) {
        const dx = x - cx;
        if (dx * dx + dySq <= radiusSq) {
          const regIdx = (localY * regionWidth + (x - startX)) * 4;
          if (brushMode === 'erase') {
            regPixels[regIdx + 3] = 0; // Erase
          } else if (brushMode === 'restore') {
            // Restore from original
            const origIdx = (y * fullWidth + x) * 4;
            regPixels[regIdx] = origData[origIdx];
            regPixels[regIdx + 1] = origData[origIdx + 1];
            regPixels[regIdx + 2] = origData[origIdx + 2];
            regPixels[regIdx + 3] = origData[origIdx + 3];
          }
        }
      }
    }
    ctx.putImageData(regionData, startX, startY);
  };

  // Download Transparent PNG
  const handleDownload = () => {
    if (!canvasRef.current) return;
    const url = canvasRef.current.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = url;
    link.download = `${fileName}-transparent.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onShowToast('Downloaded transparent PNG!');
  };

  const handleReset = () => {
    if (originalImageRef.current) {
      initCanvas(originalImageRef.current);
      setTolerance(30);
      setFeather(10);
      setError(null);
      onShowToast('Reset to original photo.');
    }
  };

  const rgbToHex = (r: number, g: number, b: number) => {
    return '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('');
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 md:p-8 shadow-xs border border-slate-200 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Scissors className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">Image Background Remover</h1>
                <span className="text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                  100% In-Browser
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Remove backgrounds with edge smoothing and precision eyedropper. 100% private with zero data sent to external servers.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleUpload}
              className="hidden"
              id="bg-remover-upload"
            />
            <label
              htmlFor="bg-remover-upload"
              className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm cursor-pointer shadow-xs transition-colors"
            >
              <Upload className="w-4 h-4" />
              <span>{imageSrc ? 'Upload Different Photo' : 'Select Photo (JPG/PNG/WebP)'}</span>
            </label>
          </div>
        </div>

        {error && (
          <div className="mt-4 flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200 text-xs sm:text-sm">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
            <div className="flex-1">
              <p className="font-medium">{error}</p>
            </div>
          </div>
        )}
      </div>

      {!imageSrc ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 md:p-14 border-2 border-dashed border-slate-300 dark:border-slate-700 text-center space-y-4 hover:border-emerald-400 dark:hover:border-emerald-600 transition-colors">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
            <Scissors className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Upload a photo to remove its background</h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Supports product photography, portraits, logos, and graphics. Preserves foreground edges into an exported transparent PNG.
            </p>
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-semibold text-sm shadow-sm transition-colors cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>Choose Image File (JPG, PNG, WebP)</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Canvas Preview Area */}
          <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-2xl p-4 md:p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                Mode: {brushMode === 'pick' ? 'Click on image to sample background color' : brushMode === 'erase' ? 'Eraser Brush' : 'Restore Brush'}
              </span>
              <div className="flex items-center gap-2">
                <span>{fileName}</span>
                <span>•</span>
                <span>{formatFileSize(fileSize)}</span>
                <button
                  type="button"
                  onClick={handleReset}
                  className="ml-2 text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
              </div>
            </div>

            {/* Checkerboard Viewport */}
            <div 
              className="rounded-xl p-3 flex items-center justify-center min-h-[360px] max-h-[560px] overflow-auto border border-slate-300 dark:border-slate-700"
              style={{
                backgroundImage: 'repeating-conic-gradient(#cbd5e1 0% 25%, #f1f5f9 0% 50%)',
                backgroundSize: '24px 24px'
              }}
            >
              <canvas
                ref={canvasRef}
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                className="max-w-full max-h-[500px] object-contain rounded-lg shadow-md cursor-crosshair touch-none"
              />
            </div>

            {/* Tool Selection Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setBrushMode('pick')}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    brushMode === 'pick'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
                  }`}
                >
                  <Pipette className="w-3.5 h-3.5" />
                  <span>Color Eyedropper</span>
                </button>

                <button
                  type="button"
                  onClick={() => setBrushMode('erase')}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    brushMode === 'erase'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
                  }`}
                >
                  <Eraser className="w-3.5 h-3.5" />
                  <span>Eraser Brush</span>
                </button>

                <button
                  type="button"
                  onClick={() => setBrushMode('restore')}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    brushMode === 'restore'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
                  }`}
                >
                  <Paintbrush className="w-3.5 h-3.5" />
                  <span>Restore Brush</span>
                </button>
              </div>

              {brushMode !== 'pick' && (
                <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                  <span>Brush Size: {brushSize}px</span>
                  <input
                    type="range"
                    min="5"
                    max="80"
                    value={brushSize}
                    onChange={(e) => setBrushSize(Number(e.target.value))}
                    className="accent-emerald-600 w-24"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Right Parameters Panel */}
          <div className="lg:col-span-4 space-y-5">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Removal Sensitivity
              </h2>

              {/* Sampled Color */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Sampled Backdrop Color
                </label>
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl border border-slate-300 dark:border-slate-600 shadow-xs"
                    style={{ backgroundColor: colorHex }}
                  />
                  <div>
                    <span className="block font-mono text-xs font-bold text-slate-800 dark:text-slate-100">{colorHex}</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      RGB: {targetColor.r}, {targetColor.g}, {targetColor.b}
                    </span>
                  </div>
                </div>
              </div>

              {/* Tolerance slider */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <span>Color Tolerance</span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400">{tolerance}%</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="80"
                  value={tolerance}
                  onChange={(e) => setTolerance(Number(e.target.value))}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
                <span className="text-[11px] text-slate-400 dark:text-slate-500 block">
                  Increase tolerance to erase lighting gradients and shadows.
                </span>
              </div>

              {/* Edge Feathering */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <span>Edge Feathering (Smoothness)</span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400">{feather}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="40"
                  value={feather}
                  onChange={(e) => setFeather(Number(e.target.value))}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
                <span className="text-[11px] text-slate-400 dark:text-slate-500 block">
                  Prevents harsh pixelated edges along hair and contours.
                </span>
              </div>

              {/* Quick backdrop swatches */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                  Or pick common backdrop hue:
                </label>
                <div className="flex gap-2">
                  {[
                    { name: 'Pure White', hex: '#ffffff', rgb: { r: 255, g: 255, b: 255 } },
                    { name: 'Green Screen', hex: '#00ff00', rgb: { r: 0, g: 255, b: 0 } },
                    { name: 'Deep Black', hex: '#000000', rgb: { r: 0, g: 0, b: 0 } },
                    { name: 'Studio Grey', hex: '#e2e8f0', rgb: { r: 226, g: 232, b: 240 } },
                  ].map((c) => (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => {
                        setTargetColor(c.rgb);
                        setColorHex(c.hex);
                      }}
                      className="w-7 h-7 rounded-lg border border-slate-300 dark:border-slate-600 shadow-xs cursor-pointer hover:scale-105 transition-transform"
                      style={{ backgroundColor: c.hex }}
                      title={c.name}
                    />
                  ))}
                </div>
              </div>

              {/* Download transparent PNG */}
              <button
                type="button"
                onClick={handleDownload}
                className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white py-3.5 px-4 rounded-xl font-bold text-sm shadow-md transition-all cursor-pointer min-h-[48px]"
              >
                <Download className="w-4 h-4" />
                <span>Download Transparent PNG</span>
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Zero Server Uploads</span>
              </div>
              <p>
                All pixel processing happens locally in your browser memory. Your private photos never leave your device.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
