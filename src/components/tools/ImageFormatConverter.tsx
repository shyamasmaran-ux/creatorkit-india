import React, { useState, useRef } from 'react';
import { 
  Repeat, Upload, Download, RefreshCw, AlertCircle, 
  Check, FileImage, Sparkles, ArrowRight, Zap, ShieldCheck
} from 'lucide-react';

interface Props {
  onShowToast: (msg: string) => void;
}

type TargetFormat = 'image/png' | 'image/jpeg' | 'image/webp';

export const ImageFormatConverter: React.FC<Props> = ({ onShowToast }) => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('converted-image');
  const [originalFormat, setOriginalFormat] = useState<string>('');
  const [originalSize, setOriginalSize] = useState<number>(0);
  const [targetFormat, setTargetFormat] = useState<TargetFormat>('image/webp');
  const [quality, setQuality] = useState<number>(90);
  const [convertedBlob, setConvertedBlob] = useState<Blob | null>(null);
  const [convertedSize, setConvertedSize] = useState<number>(0);
  const [isConverting, setIsConverting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const imageElementRef = useRef<HTMLImageElement | null>(null);
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const conversionRafRef = useRef<number | null>(null);

  // File Upload with validation
  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      setError('Please upload a supported image: PNG, JPG/JPEG, or WebP.');
      return;
    }

    if (file.size > 30 * 1024 * 1024) {
      setError('File size exceeds 30MB limit.');
      return;
    }

    setError(null);
    setOriginalSize(file.size);
    setOriginalFormat(file.type);
    setFileName(file.name.replace(/\.[^/.]+$/, ''));

    // Automatically set target format different from source
    const initialFormat: TargetFormat = file.type === 'image/webp' ? 'image/png' : 'image/webp';
    setTargetFormat(initialFormat);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const src = evt.target?.result as string;
      const img = new Image();
      img.onload = () => {
        imageElementRef.current = img;
        setImageSrc(src);
        // Run conversion immediately without artificial delay
        runConversion(img, initialFormat, quality, true);
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  };

  // Convert via HTML5 Canvas locally in browser without blocking UI
  const runConversion = (
    img: HTMLImageElement,
    format: TargetFormat,
    q: number,
    notifyToast = false
  ) => {
    if (conversionRafRef.current !== null) {
      cancelAnimationFrame(conversionRafRef.current);
    }
    setIsConverting(true);

    conversionRafRef.current = requestAnimationFrame(() => {
      conversionRafRef.current = null;
      try {
        if (!offscreenCanvasRef.current) {
          offscreenCanvasRef.current = document.createElement('canvas');
        }
        const canvas = offscreenCanvasRef.current;
        if (canvas.width !== img.naturalWidth || canvas.height !== img.naturalHeight) {
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
        }
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Canvas rendering error');

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // If converting to JPEG, paint white background so transparent PNGs don't become black
        if (format === 'image/jpeg') {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        ctx.drawImage(img, 0, 0);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              setError('Failed to convert image format.');
              setIsConverting(false);
              return;
            }
            setConvertedBlob(blob);
            setConvertedSize(blob.size);
            setIsConverting(false);
            if (notifyToast) {
              onShowToast(`Converted to ${getFormatLabel(format)}!`);
            }
          },
          format,
          q / 100
        );
      } catch (err: any) {
        setError(err.message || 'Error converting image.');
        setIsConverting(false);
      }
    });
  };

  const handleFormatChange = (newFmt: TargetFormat) => {
    setTargetFormat(newFmt);
    if (imageElementRef.current) {
      runConversion(imageElementRef.current, newFmt, quality, true);
    }
  };

  const handleQualityChange = (newQ: number) => {
    setQuality(newQ);
    if (imageElementRef.current) {
      runConversion(imageElementRef.current, targetFormat, newQ, false);
    }
  };

  const handleDownload = () => {
    if (!convertedBlob) return;
    const ext = targetFormat === 'image/png' ? 'png' : targetFormat === 'image/webp' ? 'webp' : 'jpg';
    const url = URL.createObjectURL(convertedBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${fileName}-converted.${ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    onShowToast(`Downloaded ${link.download}!`);
  };

  const handleReset = () => {
    setImageSrc(null);
    setConvertedBlob(null);
    setOriginalSize(0);
    setConvertedSize(0);
    setError(null);
    onShowToast('Converter cleared.');
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  const getFormatLabel = (mime: string) => {
    switch (mime) {
      case 'image/png':
        return 'PNG';
      case 'image/jpeg':
        return 'JPEG';
      case 'image/webp':
        return 'WebP';
      default:
        return 'Image';
    }
  };

  const sizeDiff = originalSize > 0 ? ((convertedSize - originalSize) / originalSize) * 100 : 0;
  const isReduced = sizeDiff < 0;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 md:p-8 shadow-xs border border-slate-200 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Repeat className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">Image Format Converter</h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Convert between PNG, JPEG, and WebP instantly in browser without server uploads or size limits.
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
              id="converter-file-upload"
            />
            <label
              htmlFor="converter-file-upload"
              className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm cursor-pointer shadow-xs transition-colors"
            >
              <Upload className="w-4 h-4" />
              <span>{imageSrc ? 'Upload Different Image' : 'Select Image File'}</span>
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
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 md:p-14 border-2 border-dashed border-slate-300 dark:border-slate-700 text-center space-y-4 hover:border-blue-400 dark:hover:border-blue-600 transition-colors">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
            <Repeat className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Convert PNG, JPEG, or WebP</h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Supports conversion between any combination: PNG to WebP, WebP to JPG, JPG to PNG. 100% processed locally on your phone or computer.
            </p>
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold text-sm shadow-sm transition-colors cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>Choose Image to Convert</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          {/* Left Preview Box */}
          <div className="md:col-span-7 bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
              <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-xs">{fileName}</span>
              <button
                type="button"
                onClick={handleReset}
                className="text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            </div>

            <div className="bg-slate-50 dark:bg-slate-950/70 rounded-xl p-3 flex items-center justify-center max-h-[420px] overflow-hidden border border-slate-200/60 dark:border-slate-800">
              <img
                src={imageSrc}
                alt="Uploaded source"
                className="max-h-[360px] max-w-full object-contain rounded-lg shadow-sm"
              />
            </div>

            {/* Before vs After Size Badge */}
            <div className="grid grid-cols-3 gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700 text-center">
              <div>
                <span className="block text-xs text-slate-500 dark:text-slate-400">Original ({getFormatLabel(originalFormat)})</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white font-mono">{formatBytes(originalSize)}</span>
              </div>
              <div className="flex items-center justify-center">
                <ArrowRight className="w-4 h-4 text-slate-400 dark:text-slate-500" />
              </div>
              <div>
                <span className="block text-xs text-slate-500 dark:text-slate-400">Converted ({getFormatLabel(targetFormat)})</span>
                <span className="text-sm font-bold text-blue-600 dark:text-blue-400 font-mono">{formatBytes(convertedSize)}</span>
              </div>
            </div>

            {isReduced ? (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Saved {Math.abs(Math.round(sizeDiff))}% in file size! Ideal for faster web loading & WhatsApp.</span>
              </div>
            ) : null}
          </div>

          {/* Right Conversion Controls */}
          <div className="md:col-span-5 space-y-5">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide mb-2">
                  Select Target Format
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'image/webp', label: 'WebP (Recommended)', desc: 'Best compression' },
                    { id: 'image/png', label: 'PNG', desc: 'Lossless & transparent' },
                    { id: 'image/jpeg', label: 'JPEG', desc: 'Universal' },
                  ].map((fmt) => (
                    <button
                      key={fmt.id}
                      type="button"
                      onClick={() => handleFormatChange(fmt.id as TargetFormat)}
                      className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                        targetFormat === fmt.id
                          ? 'bg-blue-50 dark:bg-blue-950/70 border-blue-600 dark:border-blue-500 text-blue-700 dark:text-blue-300 font-bold ring-2 ring-blue-600/20'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700'
                      }`}
                    >
                      <span className="block text-xs">{getFormatLabel(fmt.id)}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Quality slider for WebP & JPEG */}
              {targetFormat !== 'image/png' && (
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <span>Compression Quality</span>
                    <span className="font-mono text-blue-600 dark:text-blue-400">{quality}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={quality}
                    onChange={(e) => handleQualityChange(Number(e.target.value))}
                    className="w-full accent-blue-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[11px] text-slate-400 dark:text-slate-500">
                    <span>Smaller Size (50%)</span>
                    <span>High Fidelity (95%)</span>
                  </div>
                </div>
              )}

              {/* Download Action */}
              <button
                type="button"
                onClick={handleDownload}
                disabled={isConverting || !convertedBlob}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white py-3.5 px-4 rounded-xl font-bold text-sm shadow-md transition-all cursor-pointer disabled:opacity-60 min-h-[48px]"
              >
                <Download className="w-4 h-4" />
                <span>
                  {isConverting
                    ? 'Converting...'
                    : `Download as ${getFormatLabel(targetFormat)}`}
                </span>
              </button>
            </div>

            {/* Privacy note */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Zero Cloud Uploads</span>
              </div>
              <p>
                Unlike generic online converter sites that upload your private photos to remote servers, CreatorKit India converts files entirely inside your device's browser memory.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
