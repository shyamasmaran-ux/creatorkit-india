import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Grid,
  Upload,
  Download,
  RefreshCw,
  Columns,
  Sparkles,
  CheckCircle2,
  Image as ImageIcon,
} from 'lucide-react';

interface Props {
  onShowToast: (msg: string) => void;
}

type SplitMode = 'carousel' | 'grid';
type CarouselAspect = '4:5' | '1:1';
type FitMode = 'cover' | 'contain';

interface GeneratedTile {
  index: number;
  label: string;
  uploadOrderHint: string;
  dataUrl: string;
  width: number;
  height: number;
  filename: string;
}

export const InstagramGridSplitter: React.FC<Props> = ({ onShowToast }) => {
  const [splitMode, setSplitMode] = useState<SplitMode>('carousel');
  const [carouselSlides, setCarouselSlides] = useState<number>(3);
  const [carouselAspect, setCarouselAspect] = useState<CarouselAspect>('4:5');
  const [gridRows, setGridRows] = useState<number>(3); // 3x1, 3x2, or 3x3
  const [fitMode, setFitMode] = useState<FitMode>('cover');
  const [bgColor, setBgColor] = useState<string>('#0f172a');

  const [sourceImageUrl, setSourceImageUrl] = useState<string | null>(null);
  const [sourceImageName, setSourceImageName] = useState<string>('sample-panorama');
  const [tiles, setTiles] = useState<GeneratedTile[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Generate a built-in high-resolution sample panorama so users can test immediately
  const loadDemoPanorama = useCallback(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 3240;
    canvas.height = 1350;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Rich gradient background
    const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    grad.addColorStop(0, '#311042');
    grad.addColorStop(0.5, '#4f46e5');
    grad.addColorStop(1, '#0f172a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Decorative geometric circles across slide boundaries
    ctx.fillStyle = 'rgba(244, 114, 182, 0.18)';
    ctx.beginPath();
    ctx.arc(1080, 675, 460, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(56, 189, 248, 0.18)';
    ctx.beginPath();
    ctx.arc(2160, 675, 460, 0, Math.PI * 2);
    ctx.fill();

    // Connecting wave line across all slides
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(120, 950);
    ctx.bezierCurveTo(1080, 350, 2160, 1150, 3120, 520);
    ctx.stroke();

    // Text across the panorama
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.font = 'bold 92px sans-serif';
    ctx.fillText('SWIPE SEAMLESS CAROUSEL STUDIO', canvas.width / 2, 620);

    ctx.fillStyle = '#e2e8f0';
    ctx.font = '600 44px sans-serif';
    ctx.fillText(
      'Upload your own photo above or download these test slides below →',
      canvas.width / 2,
      730
    );

    const url = canvas.toDataURL('image/png');
    setSourceImageUrl(url);
    setSourceImageName('creatorkit-panorama');
  }, []);

  // Load demo on initial mount
  useEffect(() => {
    loadDemoPanorama();
  }, [loadDemoPanorama]);

  // Slice image whenever source or settings change
  useEffect(() => {
    if (!sourceImageUrl) {
      setTiles([]);
      return;
    }

    let cancelled = false;
    setIsProcessing(true);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      if (cancelled) return;

      const cols = splitMode === 'carousel' ? carouselSlides : 3;
      const rows = splitMode === 'carousel' ? 1 : gridRows;

      const tileWidth = 1080;
      const tileHeight =
        splitMode === 'carousel' && carouselAspect === '4:5' ? 1350 : 1080;

      const totalCanvasWidth = cols * tileWidth;
      const totalCanvasHeight = rows * tileHeight;

      // Master composite canvas
      const masterCanvas = document.createElement('canvas');
      masterCanvas.width = totalCanvasWidth;
      masterCanvas.height = totalCanvasHeight;
      const mCtx = masterCanvas.getContext('2d');
      if (!mCtx) {
        setIsProcessing(false);
        return;
      }

      // Fill background
      mCtx.fillStyle = bgColor;
      mCtx.fillRect(0, 0, totalCanvasWidth, totalCanvasHeight);

      // Compute Cover or Contain placement
      const imgRatio = img.width / img.height;
      const targetRatio = totalCanvasWidth / totalCanvasHeight;

      let drawWidth = totalCanvasWidth;
      let drawHeight = totalCanvasHeight;

      if (fitMode === 'cover') {
        if (imgRatio > targetRatio) {
          drawHeight = totalCanvasHeight;
          drawWidth = totalCanvasHeight * imgRatio;
        } else {
          drawWidth = totalCanvasWidth;
          drawHeight = totalCanvasWidth / imgRatio;
        }
      } else {
        if (imgRatio > targetRatio) {
          drawWidth = totalCanvasWidth;
          drawHeight = totalCanvasWidth / imgRatio;
        } else {
          drawHeight = totalCanvasHeight;
          drawWidth = totalCanvasHeight * imgRatio;
        }
      }

      const offsetX = (totalCanvasWidth - drawWidth) / 2;
      const offsetY = (totalCanvasHeight - drawHeight) / 2;

      mCtx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);

      // Slice into individual high-resolution tiles
      const generated: GeneratedTile[] = [];
      const totalCount = rows * cols;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const tileCanvas = document.createElement('canvas');
          tileCanvas.width = tileWidth;
          tileCanvas.height = tileHeight;
          const tCtx = tileCanvas.getContext('2d');
          if (!tCtx) continue;

          tCtx.drawImage(
            masterCanvas,
            c * tileWidth,
            r * tileHeight,
            tileWidth,
            tileHeight,
            0,
            0,
            tileWidth,
            tileHeight
          );

          const linearIndex = r * cols + c + 1;
          // For Instagram profile grids, you upload the bottom-right tile first so top-left ends up first on profile
          const reverseUploadNumber = totalCount - linearIndex + 1;

          const label =
            splitMode === 'carousel'
              ? `Slide ${linearIndex} of ${totalCount}`
              : `Grid Tile ${linearIndex}`;

          const uploadOrderHint =
            splitMode === 'carousel'
              ? `Carousel Order #${linearIndex}`
              : `Post #${reverseUploadNumber} on IG`;

          const filename =
            splitMode === 'carousel'
              ? `${sourceImageName}-slide-${linearIndex}.png`
              : `${sourceImageName}-grid-post-${reverseUploadNumber}-tile-${linearIndex}.png`;

          generated.push({
            index: linearIndex,
            label,
            uploadOrderHint,
            dataUrl: tileCanvas.toDataURL('image/png'),
            width: tileWidth,
            height: tileHeight,
            filename,
          });
        }
      }

      if (!cancelled) {
        setTiles(generated);
        setIsProcessing(false);
      }
    };

    img.onerror = () => {
      if (!cancelled) {
        setIsProcessing(false);
        onShowToast('Could not read the selected image file.');
      }
    };

    img.src = sourceImageUrl;

    return () => {
      cancelled = true;
    };
  }, [
    sourceImageUrl,
    sourceImageName,
    splitMode,
    carouselSlides,
    carouselAspect,
    gridRows,
    fitMode,
    bgColor,
    onShowToast,
  ]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      onShowToast('Please select a valid JPG, PNG, or WebP image.');
      return;
    }

    const baseName =
      file.name
        .replace(/\.[^/.]+$/, '')
        .toLowerCase()
        .replace(/[^a-z0-9-_]+/g, '-') || 'instagram-split';

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setSourceImageName(baseName);
        setSourceImageUrl(reader.result);
        onShowToast('Image loaded and split in high resolution!');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDownloadSingle = (tile: GeneratedTile) => {
    const link = document.createElement('a');
    link.href = tile.dataUrl;
    link.download = tile.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onShowToast(`Downloaded ${tile.label} (${tile.width}×${tile.height} PNG)`);
  };

  const handleDownloadAll = () => {
    if (tiles.length === 0) return;
    tiles.forEach((tile, idx) => {
      setTimeout(() => {
        const link = document.createElement('a');
        link.href = tile.dataUrl;
        link.download = tile.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }, idx * 220);
    });
    onShowToast(`Downloading all ${tiles.length} high-res PNG slides...`);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Controls & Upload (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-pink-50 dark:bg-pink-950/80 text-pink-600 dark:text-pink-400 flex items-center justify-center shrink-0">
              <Grid className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                Instagram Carousel &amp; Grid Splitter
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Slice wide photos into seamless swipeable carousels or 3×3 profile grids locally.
              </p>
            </div>
          </div>

          {/* Upload Box */}
          <div className="p-4 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/40 text-center space-y-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleFileUpload}
              className="hidden"
            />
            <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-300 flex items-center justify-center mx-auto">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100">
                Upload Panorama or High-Res Photo
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Supports JPG, PNG &amp; WebP — processed 100% inside your browser
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer min-h-[40px]"
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Choose Image</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  loadDemoPanorama();
                  onShowToast('Loaded sample panorama canvas!');
                }}
                className="inline-flex items-center gap-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer min-h-[40px]"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset Demo</span>
              </button>
            </div>
          </div>

          {/* Mode Switcher: Seamless Carousel vs Profile Grid */}
          <div>
            <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              1. Split Mode
            </span>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
              <button
                type="button"
                onClick={() => setSplitMode('carousel')}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                  splitMode === 'carousel'
                    ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Columns className="w-3.5 h-3.5" />
                <span>Swipe Carousel</span>
              </button>
              <button
                type="button"
                onClick={() => setSplitMode('grid')}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                  splitMode === 'grid'
                    ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Grid className="w-3.5 h-3.5" />
                <span>3×N Profile Grid</span>
              </button>
            </div>
          </div>

          {/* Conditional Options for Carousel vs Grid */}
          {splitMode === 'carousel' ? (
            <div className="space-y-4">
              <div>
                <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  2. Number of Carousel Slides
                </span>
                <div className="grid grid-cols-4 gap-2">
                  {[2, 3, 4, 5].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setCarouselSlides(num)}
                      className={`py-2 rounded-xl text-xs font-bold font-mono tabular-nums border transition-colors cursor-pointer ${
                        carouselSlides === num
                          ? 'bg-purple-600 text-white border-purple-600'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {num} Slides
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  3. Slide Aspect Ratio
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCarouselAspect('4:5')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                      carouselAspect === '4:5'
                        ? 'bg-purple-600 text-white border-purple-600'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    Portrait 4:5 (1080×1350)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCarouselAspect('1:1')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                      carouselAspect === '1:1'
                        ? 'bg-purple-600 text-white border-purple-600'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    Square 1:1 (1080×1080)
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                2. Profile Grid Layout (1080×1080 per tile)
              </span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { rows: 1, label: '3×1 (3 Tiles)' },
                  { rows: 2, label: '3×2 (6 Tiles)' },
                  { rows: 3, label: '3×3 (9 Tiles)' },
                ].map((opt) => (
                  <button
                    key={opt.rows}
                    type="button"
                    onClick={() => setGridRows(opt.rows)}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold font-mono tabular-nums border transition-colors cursor-pointer ${
                      gridRows === opt.rows
                        ? 'bg-purple-600 text-white border-purple-600'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Image Fit Mode */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Image Fit Mode
              </span>
              {fitMode === 'contain' && (
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-slate-500">Pad Color:</span>
                  <input
                    type="color"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    aria-label="Padding background color"
                    className="w-6 h-6 rounded cursor-pointer border border-slate-300"
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFitMode('cover')}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                  fitMode === 'cover'
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
              >
                Auto-Fill (Edge-to-Edge)
              </button>
              <button
                type="button"
                onClick={() => setFitMode('contain')}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                  fitMode === 'contain'
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
              >
                Fit Full Image (With Pad)
              </button>
            </div>
          </div>

          {/* Primary Download All CTA */}
          <button
            type="button"
            onClick={handleDownloadAll}
            disabled={tiles.length === 0 || isProcessing}
            className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-xl text-sm font-bold shadow-xs transition-all cursor-pointer disabled:opacity-50 min-h-[48px]"
          >
            <Download className="w-4 h-4" />
            <span>
              Download All {tiles.length} High-Res PNG Slides
            </span>
          </button>
        </div>

        {/* Right Column: Live Split Preview & Individual Slide Downloads (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Live Split Preview &amp; Individual Tiles ({tiles.length})
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {splitMode === 'carousel'
                  ? 'Select slides in order (1 → N) when creating an Instagram Carousel post.'
                  : 'For a 3×3 profile grid, upload starting from Post #1 up to the last tile so your profile grid aligns.'}
              </p>
            </div>
            <span className="inline-flex items-center gap-1 text-xs font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>1080p Studio PNG</span>
            </span>
          </div>

          {/* Visual Seamless Cut Preview */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 overflow-x-auto">
            {splitMode === 'carousel' ? (
              <div className="flex items-center gap-1.5 min-w-max mx-auto justify-center">
                {tiles.map((tile) => (
                  <div
                    key={tile.index}
                    className="relative group rounded-lg overflow-hidden border border-slate-700 bg-slate-900 shrink-0"
                    style={{
                      width: carouselSlides >= 4 ? '140px' : '175px',
                    }}
                  >
                    <img
                      src={tile.dataUrl}
                      alt={tile.label}
                      className="w-full h-auto block"
                    />
                    <div className="absolute top-2 left-2 bg-black/75 text-white text-[10px] font-mono tabular-nums font-bold px-2 py-0.5 rounded">
                      #{tile.index}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-1.5 max-w-md mx-auto">
                {tiles.map((tile) => (
                  <div
                    key={tile.index}
                    className="relative rounded-md overflow-hidden border border-slate-700 bg-slate-900 aspect-square"
                  >
                    <img
                      src={tile.dataUrl}
                      alt={tile.label}
                      className="w-full h-full object-cover block"
                    />
                    <div className="absolute bottom-1.5 right-1.5 bg-black/80 text-white text-[10px] font-mono tabular-nums font-bold px-1.5 py-0.5 rounded">
                      {tile.uploadOrderHint}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Individual Slide Download List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {tiles.map((tile) => (
              <div
                key={tile.index}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <img
                    src={tile.dataUrl}
                    alt={tile.label}
                    className="w-11 h-11 rounded-lg object-cover border border-slate-300 dark:border-slate-600 shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                      {tile.label}
                    </p>
                    <p className="text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400">
                      {tile.uploadOrderHint}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleDownloadSingle(tile)}
                  className="p-2 rounded-lg bg-white dark:bg-slate-900 hover:bg-purple-600 hover:text-white text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer shrink-0"
                  title={`Download ${tile.label}`}
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
