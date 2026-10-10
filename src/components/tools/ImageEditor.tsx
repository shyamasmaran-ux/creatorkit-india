import React, { useState, useRef, useEffect } from 'react';
import { 
  Upload, RotateCw, RotateCcw, FlipHorizontal, FlipVertical, 
  Sun, Contrast, Droplets, Download, RefreshCw, AlertCircle, 
  Sliders, Crop, Check, Image as ImageIcon, Sparkles, ZoomIn, ZoomOut
} from 'lucide-react';

interface Props {
  onShowToast: (msg: string) => void;
}

type FilterType = 'normal' | 'grayscale' | 'sepia' | 'invert' | 'vintage' | 'warm' | 'cool' | 'noir';
type AspectPreset = 'free' | '1:1' | '16:9' | '9:16' | '4:3';

export const ImageEditor: React.FC<Props> = ({ onShowToast }) => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('edited-image');
  const [fileSize, setFileSize] = useState<number>(0);
  const [originalDimensions, setOriginalDimensions] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [error, setError] = useState<string | null>(null);

  // Transformations
  const [rotation, setRotation] = useState<number>(0);
  const [flipH, setFlipH] = useState<boolean>(false);
  const [flipV, setFlipV] = useState<boolean>(false);

  // Resize
  const [targetWidth, setTargetWidth] = useState<number>(0);
  const [targetHeight, setTargetHeight] = useState<number>(0);
  const [widthInput, setWidthInput] = useState<string>('');
  const [heightInput, setHeightInput] = useState<string>('');
  const [lockAspect, setLockAspect] = useState<boolean>(true);

  // Color adjustments
  const [brightness, setBrightness] = useState<number>(100);
  const [contrast, setContrast] = useState<number>(100);
  const [saturation, setSaturation] = useState<number>(100);
  const [blur, setBlur] = useState<number>(0);

  // Filter
  const [activeFilter, setActiveFilter] = useState<FilterType>('normal');

  // Export settings
  const [exportFormat, setExportFormat] = useState<'image/png' | 'image/jpeg' | 'image/webp'>('image/png');
  const [exportQuality, setExportQuality] = useState<number>(92);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const originalImageRef = useRef<HTMLImageElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Handle file upload with validation
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Type validation
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      setError('Please upload a supported image format: JPG, PNG, or WebP.');
      return;
    }

    // Size validation (Max 25MB)
    const maxSizeBytes = 25 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setError('File size exceeds 25MB limit. Please upload a smaller image.');
      return;
    }

    setError(null);
    setFileSize(file.size);
    setFileName(file.name.replace(/\.[^/.]+$/, ''));

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        originalImageRef.current = img;
        setImageSrc(img.src);
        setOriginalDimensions({ width: img.naturalWidth, height: img.naturalHeight });
        setTargetWidth(img.naturalWidth);
        setTargetHeight(img.naturalHeight);
        setWidthInput(String(img.naturalWidth));
        setHeightInput(String(img.naturalHeight));
        resetAdjustments();
        onShowToast(`Image loaded: ${img.naturalWidth}x${img.naturalHeight}px`);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const resetAdjustments = () => {
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setBlur(0);
    setActiveFilter('normal');
  };

  const handleFullReset = () => {
    if (!originalImageRef.current) return;
    const origW = originalImageRef.current.naturalWidth;
    const origH = originalImageRef.current.naturalHeight;
    setTargetWidth(origW);
    setTargetHeight(origH);
    setWidthInput(String(origW));
    setHeightInput(String(origH));
    resetAdjustments();
    onShowToast('All editor adjustments reset to original.');
  };

  // Allow free editing while typing; sync valid dimensions immediately and clamp on blur
  const handleWidthInputChange = (rawVal: string) => {
    setWidthInput(rawVal);
    const parsed = parseInt(rawVal, 10);
    if (!Number.isNaN(parsed) && parsed >= 10) {
      const clampedW = Math.min(6000, parsed);
      setTargetWidth(clampedW);
      if (lockAspect && originalDimensions.width > 0) {
        const ratio = originalDimensions.height / originalDimensions.width;
        const nextH = Math.max(10, Math.min(6000, Math.round(clampedW * ratio)));
        setTargetHeight(nextH);
        setHeightInput(String(nextH));
      }
    }
  };

  const handleWidthBlur = () => {
    const parsed = parseInt(widthInput, 10);
    const validW = Number.isNaN(parsed)
      ? targetWidth || originalDimensions.width || 10
      : Math.max(10, Math.min(6000, parsed));
    setTargetWidth(validW);
    setWidthInput(String(validW));
    if (lockAspect && originalDimensions.width > 0) {
      const ratio = originalDimensions.height / originalDimensions.width;
      const validH = Math.max(10, Math.min(6000, Math.round(validW * ratio)));
      setTargetHeight(validH);
      setHeightInput(String(validH));
    }
  };

  const handleHeightInputChange = (rawVal: string) => {
    setHeightInput(rawVal);
    const parsed = parseInt(rawVal, 10);
    if (!Number.isNaN(parsed) && parsed >= 10) {
      const clampedH = Math.min(6000, parsed);
      setTargetHeight(clampedH);
      if (lockAspect && originalDimensions.height > 0) {
        const ratio = originalDimensions.width / originalDimensions.height;
        const nextW = Math.max(10, Math.min(6000, Math.round(clampedH * ratio)));
        setTargetWidth(nextW);
        setWidthInput(String(nextW));
      }
    }
  };

  const handleHeightBlur = () => {
    const parsed = parseInt(heightInput, 10);
    const validH = Number.isNaN(parsed)
      ? targetHeight || originalDimensions.height || 10
      : Math.max(10, Math.min(6000, parsed));
    setTargetHeight(validH);
    setHeightInput(String(validH));
    if (lockAspect && originalDimensions.height > 0) {
      const ratio = originalDimensions.width / originalDimensions.height;
      const validW = Math.max(10, Math.min(6000, Math.round(validH * ratio)));
      setTargetWidth(validW);
      setWidthInput(String(validW));
    }
  };

  // Render to canvas (coalesced via requestAnimationFrame for non-blocking slider updates)
  useEffect(() => {
    if (!originalImageRef.current || !canvasRef.current || targetWidth <= 0 || targetHeight <= 0) return;

    const rafId = requestAnimationFrame(() => {
      if (!originalImageRef.current || !canvasRef.current || targetWidth <= 0 || targetHeight <= 0) return;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const isRotated90or270 = Math.abs(rotation) % 180 !== 0;
      const canvasWidth = isRotated90or270 ? targetHeight : targetWidth;
      const canvasHeight = isRotated90or270 ? targetWidth : targetHeight;

      if (canvas.width !== canvasWidth || canvas.height !== canvasHeight) {
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
      } else {
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);
      }

      // Fill background with white when exporting as JPEG so transparent regions do not turn black
      if (exportFormat === 'image/jpeg') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
      }

      ctx.save();

      // Move to center for rotation and flips
      ctx.translate(canvasWidth / 2, canvasHeight / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);

      // Filter CSS string
      let filterString = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
      if (blur > 0) filterString += ` blur(${blur}px)`;

      switch (activeFilter) {
        case 'grayscale':
          filterString += ' grayscale(100%)';
          break;
        case 'sepia':
          filterString += ' sepia(100%)';
          break;
        case 'invert':
          filterString += ' invert(100%)';
          break;
        case 'vintage':
          filterString += ' sepia(50%) contrast(120%) brightness(90%)';
          break;
        case 'warm':
          filterString += ' sepia(30%) saturate(140%)';
          break;
        case 'cool':
          filterString += ' hue-rotate(180deg) saturate(90%)';
          break;
        case 'noir':
          filterString += ' grayscale(100%) contrast(160%) brightness(85%)';
          break;
        default:
          break;
      }

      ctx.filter = filterString;

      // Draw the image centered
      ctx.drawImage(
        originalImageRef.current,
        -targetWidth / 2,
        -targetHeight / 2,
        targetWidth,
        targetHeight
      );

      ctx.restore();
    });

    return () => cancelAnimationFrame(rafId);
  }, [
    imageSrc,
    rotation,
    flipH,
    flipV,
    targetWidth,
    targetHeight,
    brightness,
    contrast,
    saturation,
    blur,
    activeFilter,
    exportFormat
  ]);

  // Download Handler
  const handleDownload = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const mime = exportFormat;
    const quality = exportQuality / 100;
    const ext = exportFormat === 'image/png' ? 'png' : exportFormat === 'image/webp' ? 'webp' : 'jpg';

    canvas.toBlob((blob) => {
      if (!blob) {
        setError('Failed to generate image download.');
        return;
      }
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${fileName}-edited.${ext}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      onShowToast(`Downloaded ${link.download}!`);
    }, mime, quality);
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
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/70 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">Image Editor & Adjuster</h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Rotate, resize, flip, adjust brightness, contrast, saturation, and apply filters locally in your browser.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileUpload}
              className="hidden"
              id="editor-file-upload"
            />
            <label
              htmlFor="editor-file-upload"
              className="inline-flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 active:scale-[0.98] text-white px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm cursor-pointer shadow-xs transition-colors"
            >
              <Upload className="w-4 h-4" />
              <span>{imageSrc ? 'Upload New Image' : 'Select Image (JPG/PNG/WebP)'}</span>
            </label>
          </div>
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs sm:text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {!imageSrc ? (
        /* Empty State / Upload Dropzone */
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 md:p-14 border-2 border-dashed border-slate-300 dark:border-slate-700 text-center space-y-4 hover:border-purple-400 dark:hover:border-purple-600 transition-colors">
          <div className="w-16 h-16 rounded-2xl bg-purple-50 dark:bg-purple-950/70 text-purple-600 dark:text-purple-400 flex items-center justify-center mx-auto">
            <Upload className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Upload your image to begin editing</h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Supports JPG, PNG, and WebP up to 25MB. All processing occurs locally on your device for complete privacy and maximum speed.
            </p>
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl font-semibold text-sm shadow-sm transition-colors cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>Choose Image File</span>
          </button>
        </div>
      ) : (
        /* Active Workspace */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Canvas Preview Area */}
          <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-2xl p-4 md:p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
              <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-xs">{fileName}</span>
              <div className="flex items-center gap-3">
                <span>Original: {originalDimensions.width}×{originalDimensions.height}</span>
                <span>•</span>
                <span>Output: {targetWidth}×{targetHeight}</span>
                <span>•</span>
                <span>Size: {formatFileSize(fileSize)}</span>
              </div>
            </div>

            {/* Canvas Viewport */}
            <div className="bg-slate-900/5 dark:bg-slate-950/70 rounded-xl p-3 flex items-center justify-center min-h-[340px] max-h-[560px] overflow-auto border border-slate-200/60 dark:border-slate-800">
              <canvas
                ref={canvasRef}
                className="max-w-full max-h-[500px] object-contain rounded-lg shadow-md bg-white"
              />
            </div>

            {/* Quick Action Bar under Canvas */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setRotation((prev) => (prev - 90) % 360)}
                  className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-purple-50 dark:hover:bg-purple-950/60 hover:text-purple-700 dark:hover:text-purple-300 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Rotate Counter-Clockwise 90°"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Rotate -90°</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRotation((prev) => (prev + 90) % 360)}
                  className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-purple-50 dark:hover:bg-purple-950/60 hover:text-purple-700 dark:hover:text-purple-300 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Rotate Clockwise 90°"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>Rotate +90°</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFlipH((prev) => !prev)}
                  className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    flipH
                      ? 'bg-purple-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
                  }`}
                  title="Flip Horizontally"
                >
                  <FlipHorizontal className="w-3.5 h-3.5" />
                  <span>Flip H</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFlipV((prev) => !prev)}
                  className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    flipV
                      ? 'bg-purple-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
                  }`}
                  title="Flip Vertically"
                >
                  <FlipVertical className="w-3.5 h-3.5" />
                  <span>Flip V</span>
                </button>
              </div>

              <button
                type="button"
                onClick={handleFullReset}
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset All Adjustments</span>
              </button>
            </div>
          </div>

          {/* Right Controls Panel */}
          <div className="lg:col-span-4 space-y-5">
            {/* Adjustments Card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                Color & Light Adjustments
              </h2>

              {/* Brightness */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-medium text-slate-700 dark:text-slate-300">
                  <span className="flex items-center gap-1">
                    <Sun className="w-3.5 h-3.5 text-amber-500" /> Brightness
                  </span>
                  <span>{brightness}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={brightness}
                  onChange={(e) => setBrightness(Number(e.target.value))}
                  className="w-full accent-purple-600 cursor-pointer"
                />
              </div>

              {/* Contrast */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-medium text-slate-700 dark:text-slate-300">
                  <span className="flex items-center gap-1">
                    <Contrast className="w-3.5 h-3.5 text-indigo-500" /> Contrast
                  </span>
                  <span>{contrast}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={contrast}
                  onChange={(e) => setContrast(Number(e.target.value))}
                  className="w-full accent-purple-600 cursor-pointer"
                />
              </div>

              {/* Saturation */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-medium text-slate-700 dark:text-slate-300">
                  <span className="flex items-center gap-1">
                    <Droplets className="w-3.5 h-3.5 text-pink-500" /> Saturation
                  </span>
                  <span>{saturation}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={saturation}
                  onChange={(e) => setSaturation(Number(e.target.value))}
                  className="w-full accent-purple-600 cursor-pointer"
                />
              </div>

              {/* Blur */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-medium text-slate-700 dark:text-slate-300">
                  <span>Soft Blur</span>
                  <span>{blur}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="20"
                  value={blur}
                  onChange={(e) => setBlur(Number(e.target.value))}
                  className="w-full accent-purple-600 cursor-pointer"
                />
              </div>
            </div>

            {/* Filters Card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                Color Presets & Filters
              </h2>
              <div className="grid grid-cols-4 gap-1.5">
                {(['normal', 'vintage', 'warm', 'cool', 'grayscale', 'sepia', 'invert', 'noir'] as FilterType[]).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setActiveFilter(f)}
                    className={`py-2 px-1 text-[11px] font-semibold rounded-lg capitalize transition-colors cursor-pointer ${
                      activeFilter === f
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Resize Card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center justify-between">
                <span>Resize Dimensions (Pixels)</span>
                <label className="text-[11px] text-slate-500 dark:text-slate-400 font-normal flex items-center gap-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={lockAspect}
                    onChange={(e) => setLockAspect(e.target.checked)}
                    className="rounded-sm text-purple-600"
                  />
                  <span>Lock Ratio</span>
                </label>
              </h2>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Width (px)</label>
                  <input
                    type="number"
                    min="10"
                    max="6000"
                    value={widthInput}
                    onChange={(e) => handleWidthInputChange(e.target.value)}
                    onBlur={handleWidthBlur}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Height (px)</label>
                  <input
                    type="number"
                    min="10"
                    max="6000"
                    value={heightInput}
                    onChange={(e) => handleHeightInputChange(e.target.value)}
                    onBlur={handleHeightBlur}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>
            </div>

            {/* Download & Export Card */}
            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/40 dark:to-indigo-950/40 rounded-2xl p-5 border border-purple-200 dark:border-purple-800 shadow-xs space-y-4">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Download className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                Export & Download
              </h2>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'PNG (Lossless)', val: 'image/png' },
                  { label: 'JPEG', val: 'image/jpeg' },
                  { label: 'WebP (Modern)', val: 'image/webp' },
                ].map((fmt) => (
                  <button
                    key={fmt.val}
                    type="button"
                    onClick={() => setExportFormat(fmt.val as any)}
                    className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      exportFormat === fmt.val
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    {fmt.label}
                  </button>
                ))}
              </div>

              {exportFormat !== 'image/png' && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-slate-700 dark:text-slate-300">
                    <span>Quality</span>
                    <span>{exportQuality}%</span>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="100"
                    value={exportQuality}
                    onChange={(e) => setExportQuality(Number(e.target.value))}
                    className="w-full accent-purple-600 cursor-pointer"
                  />
                </div>
              )}

              <button
                type="button"
                onClick={handleDownload}
                className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white py-3 px-4 rounded-xl font-bold text-sm shadow-md transition-colors cursor-pointer min-h-[44px]"
              >
                <Download className="w-4 h-4" />
                <span>Download Edited Image</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
