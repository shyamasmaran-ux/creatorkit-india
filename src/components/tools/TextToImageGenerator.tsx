import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Sparkles,
  Download,
  RefreshCw,
  AlertCircle,
  Copy,
  Image as ImageIcon,
  Check,
  Wand2,
  XCircle,
  Loader2,
  Upload,
  Type,
  Palette,
  Layers,
  Sliders,
} from 'lucide-react';
import { generateRealAiImage, GenerationResult } from '../../services/aiImageService';
import { ThumbnailConcept, ThumbnailVisualStyle } from '../../types';

interface Props {
  onShowToast: (msg: string) => void;
}

type AspectRatio = '16:9' | '1:1' | '9:16' | '4:3';

const VISUAL_STYLES: {
  id: ThumbnailVisualStyle;
  label: string;
  bgStart: string;
  bgEnd: string;
  accent: string;
  badgeDefault: string;
}[] = [
  {
    id: 'educational',
    label: '🎓 Educational',
    bgStart: '#0f172a',
    bgEnd: '#1e3a8a',
    accent: '#facc15',
    badgeDefault: 'COMPLETE GUIDE',
  },
  {
    id: 'technology',
    label: '📱 Technology',
    bgStart: '#090d16',
    bgEnd: '#311042',
    accent: '#38bdf8',
    badgeDefault: 'HONEST REVIEW',
  },
  {
    id: 'gaming',
    label: '🎮 Gaming',
    bgStart: '#180526',
    bgEnd: '#4c0519',
    accent: '#22c55e',
    badgeDefault: 'PRO GAMEPLAY',
  },
  {
    id: 'facts',
    label: '🔍 Facts & Mystery',
    bgStart: '#09090b',
    bgEnd: '#451a03',
    accent: '#f59e0b',
    badgeDefault: 'HIDDEN TRUTH',
  },
  {
    id: 'entertainment',
    label: '🔥 Entertainment',
    bgStart: '#1e1b4b',
    bgEnd: '#701a75',
    accent: '#fb7185',
    badgeDefault: 'MUST WATCH',
  },
  {
    id: 'business',
    label: '📈 Business & Finance',
    bgStart: '#022c22',
    bgEnd: '#0f172a',
    accent: '#34d399',
    badgeDefault: 'SMART STRATEGY',
  },
  {
    id: 'tutorials',
    label: '🛠️ Tutorials & How-To',
    bgStart: '#172554',
    bgEnd: '#3b0764',
    accent: '#fbbf24',
    badgeDefault: 'STEP BY STEP',
  },
];

const TOPIC_PRESETS = [
  { topic: 'iPhone 16 vs Samsung S24 Camera Test', style: 'technology' as ThumbnailVisualStyle, lang: 'hinglish' as const },
  { topic: 'Stock Market Investing for Beginners', style: 'business' as ThumbnailVisualStyle, lang: 'hinglish' as const },
  { topic: 'घर पर बनाएं हलवाई जैसा समोसा', style: 'tutorials' as ThumbnailVisualStyle, lang: 'hindi' as const },
  { topic: '5 Secret Study Hacks for Exams', style: 'educational' as ThumbnailVisualStyle, lang: 'english' as const },
  { topic: 'BGMI Ultimate Zero Recoil Sensitivity', style: 'gaming' as ThumbnailVisualStyle, lang: 'hinglish' as const },
];

/**
 * Generates 3 topic-specific, high-contrast thumbnail concepts locally when AI is busy or for instant preview.
 * Extracts meaningful words from the user's topic so headlines are never generic.
 */
function buildLocalTopicConcepts(
  topic: string,
  style: ThumbnailVisualStyle,
  language: 'hinglish' | 'hindi' | 'english'
): ThumbnailConcept[] {
  const clean = topic.trim() || 'Creator Video Topic';
  const stylePreset = VISUAL_STYLES.find((s) => s.id === style) || VISUAL_STYLES[0];

  // Extract key subject words (first 3-4 meaningful words)
  const words = clean.replace(/[?!.,:;]/g, '').split(/\s+/).filter(Boolean);
  const shortCore = words.slice(0, 3).join(' ').toUpperCase();
  const vsMatch = clean.match(/(.+?)\s+vs\.?\s+(.+)/i);

  if (language === 'hindi') {
    const hindiCore = words.slice(0, 3).join(' ');
    return [
      {
        id: `local-1-${Date.now()}`,
        style,
        angleLabel: 'मुख्य आकर्षण (Direct Impact)',
        headline: `${hindiCore}: पूरा सच!`,
        subbadge: 'ज़रूर देखें',
        bgStart: stylePreset.bgStart,
        bgEnd: stylePreset.bgEnd,
        accentColor: stylePreset.accent,
        textColor: '#ffffff',
        layoutType: 'left-focus',
        aiScenePrompt: `Dramatic studio photography representing ${clean}, high contrast rim lighting, shallow depth of field, vibrant colors, no text`,
      },
      {
        id: `local-2-${Date.now()}`,
        style,
        angleLabel: 'बड़ी गलती (Mistake Warning)',
        headline: `ये गलती मत करना!`,
        subbadge: hindiCore.slice(0, 18),
        bgStart: '#18181b',
        bgEnd: '#7f1d1d',
        accentColor: '#facc15',
        textColor: '#ffffff',
        layoutType: 'center-impact',
        aiScenePrompt: `Cinematic close-up scene of ${clean} with dramatic red and gold lighting, ultra detailed 4k studio backdrop, no text`,
      },
      {
        id: `local-3-${Date.now()}`,
        style,
        angleLabel: 'आसान गाइड (Step-by-Step)',
        headline: `100% सही तरीका`,
        subbadge: `${hindiCore.slice(0, 16)} गाइड`,
        bgStart: '#042f2e',
        bgEnd: '#1e1b4b',
        accentColor: '#34d399',
        textColor: '#ffffff',
        layoutType: 'top-banner',
        aiScenePrompt: `Clean modern workspace showing ${clean}, warm studio lighting, crisp commercial composition, no text`,
      },
    ];
  }

  if (language === 'english') {
    return [
      {
        id: `local-1-${Date.now()}`,
        style,
        angleLabel: 'High-Contrast Hook',
        headline: vsMatch
          ? `${vsMatch[1].trim().slice(0, 12).toUpperCase()} VS ${vsMatch[2].trim().slice(0, 12).toUpperCase()}`
          : `${shortCore}: THE TRUTH`,
        subbadge: stylePreset.badgeDefault,
        bgStart: stylePreset.bgStart,
        bgEnd: stylePreset.bgEnd,
        accentColor: stylePreset.accent,
        textColor: '#ffffff',
        layoutType: vsMatch ? 'split-vs' : 'left-focus',
        aiScenePrompt: `Professional YouTube studio scene of ${clean}, dramatic key lighting, crisp focal subject, 4k photorealistic, no text`,
      },
      {
        id: `local-2-${Date.now()}`,
        style,
        angleLabel: 'Mistake / Warning Angle',
        headline: `DON'T DO THIS!`,
        subbadge: shortCore.slice(0, 20),
        bgStart: '#09090b',
        bgEnd: '#7f1d1d',
        accentColor: '#facc15',
        textColor: '#ffffff',
        layoutType: 'center-impact',
        aiScenePrompt: `High-contrast dramatic spotlight on ${clean}, dark moody background with warm rim light, no text`,
      },
      {
        id: `local-3-${Date.now()}`,
        style,
        angleLabel: 'Complete Roadmap',
        headline: `${shortCore} IN 2025`,
        subbadge: 'FULL BREAKDOWN',
        bgStart: '#022c22',
        bgEnd: '#1e3a8a',
        accentColor: '#38bdf8',
        textColor: '#ffffff',
        layoutType: 'top-banner',
        aiScenePrompt: `Clean isometric or studio showcase of ${clean}, vibrant cyan and amber lighting, sharp focus, no text`,
      },
    ];
  }

  // Default: Hinglish
  return [
    {
      id: `local-1-${Date.now()}`,
      style,
      angleLabel: 'Desi Curiosity Hook',
      headline: vsMatch
        ? `${vsMatch[1].trim().slice(0, 12).toUpperCase()} VS ${vsMatch[2].trim().slice(0, 12).toUpperCase()}`
        : `${shortCore}: ASLI SACH!`,
      subbadge: stylePreset.badgeDefault,
      bgStart: stylePreset.bgStart,
      bgEnd: stylePreset.bgEnd,
      accentColor: stylePreset.accent,
      textColor: '#ffffff',
      layoutType: vsMatch ? 'split-vs' : 'left-focus',
      aiScenePrompt: `High-contrast YouTube thumbnail background for ${clean}, dramatic studio lighting, vibrant Indian creator aesthetic, 4k, no text`,
    },
    {
      id: `local-2-${Date.now()}`,
      style,
      angleLabel: 'Warning / Mistake Hook',
      headline: `YE GALTI MAT KARNA!`,
      subbadge: shortCore.slice(0, 20),
      bgStart: '#09090b',
      bgEnd: '#7f1d1d',
      accentColor: '#facc15',
      textColor: '#ffffff',
      layoutType: 'center-impact',
      aiScenePrompt: `Dramatic dark studio scene representing ${clean}, intense rim lighting, fiery orange and deep blue contrast, no text`,
    },
    {
      id: `local-3-${Date.now()}`,
      style,
      angleLabel: 'Practical Masterclass',
      headline: `${shortCore} FULL GUIDE`,
      subbadge: '100% WORKING',
      bgStart: '#064e3b',
      bgEnd: '#1e1b4b',
      accentColor: '#34d399',
      textColor: '#ffffff',
      layoutType: 'top-banner',
      aiScenePrompt: `Modern creator desk setup showcasing ${clean}, warm key light, clean background bokeh, 4k photography, no text`,
    },
  ];
}

export const TextToImageGenerator: React.FC<Props> = ({ onShowToast }) => {
  // 1. Thumbnail Concept & Style State
  const [topic, setTopic] = useState<string>('iPhone 16 vs Samsung S24 Camera Test');
  const [visualStyle, setVisualStyle] = useState<ThumbnailVisualStyle>('technology');
  const [textLanguage, setTextLanguage] = useState<'hinglish' | 'hindi' | 'english'>('hinglish');
  const [concepts, setConcepts] = useState<ThumbnailConcept[]>(() =>
    buildLocalTopicConcepts('iPhone 16 vs Samsung S24 Camera Test', 'technology', 'hinglish')
  );
  const [activeConceptId, setActiveConceptId] = useState<string>('');
  const [isLoadingConcepts, setIsLoadingConcepts] = useState<boolean>(false);
  const [isAiConcepts, setIsAiConcepts] = useState<boolean>(false);
  const [conceptError, setConceptError] = useState<string | null>(null);

  // 2. Manual Thumbnail Canvas Studio Controls
  const [headlineText, setHeadlineText] = useState<string>('IPHONE 16 VS S24: ASLI SACH!');
  const [subbadgeText, setSubbadgeText] = useState<string>('HONEST REVIEW');
  const [layoutType, setLayoutType] = useState<'left-focus' | 'center-impact' | 'split-vs' | 'top-banner'>('left-focus');
  const [fontSize, setFontSize] = useState<number>(78);
  const [textColor, setTextColor] = useState<string>('#ffffff');
  const [accentColor, setAccentColor] = useState<string>('#38bdf8');
  const [bgStartColor, setBgStartColor] = useState<string>('#090d16');
  const [bgEndColor, setBgEndColor] = useState<string>('#311042');
  const [textOffsetX, setTextOffsetX] = useState<number>(0);
  const [textOffsetY, setTextOffsetY] = useState<number>(0);
  const [showHeadlineBox, setShowHeadlineBox] = useState<boolean>(true);
  const [showArrowShape, setShowArrowShape] = useState<boolean>(true);
  const [showCornerFrame, setShowCornerFrame] = useState<boolean>(true);
  const [showGlowOrb, setShowGlowOrb] = useState<boolean>(true);
  const [scrimOpacity, setScrimOpacity] = useState<number>(45);

  // Custom or AI Background Image Layer
  const [bgImageElement, setBgImageElement] = useState<HTMLImageElement | null>(null);
  const [bgImageSourceLabel, setBgImageSourceLabel] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // 3. Free AI Image Background Generator State (AI Horde)
  const [prompt, setPrompt] = useState<string>(
    'High-contrast YouTube studio showcase of iPhone 16 and Samsung S24 smartphones on dark reflective desk, cyan and magenta rim lighting, 4k photography'
  );
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [progressStatus, setProgressStatus] = useState<string>('');
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [generationResult, setGenerationResult] = useState<GenerationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedPrompt, setCopiedPrompt] = useState<boolean>(false);

  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort(new DOMException('Component unmounted', 'AbortError'));
    };
  }, []);

  const applyConceptToStudio = useCallback((concept: ThumbnailConcept) => {
    setActiveConceptId(concept.id);
    setHeadlineText(concept.headline);
    setSubbadgeText(concept.subbadge);
    setBgStartColor(concept.bgStart);
    setBgEndColor(concept.bgEnd);
    setAccentColor(concept.accentColor);
    setTextColor(concept.textColor);
    setLayoutType(concept.layoutType);
    setPrompt(concept.aiScenePrompt);
    setTextOffsetX(0);
    setTextOffsetY(0);
  }, []);

  // Generate 3 Topic-Specific Thumbnail Concepts via Server AI
  const handleGenerateConcepts = async (
    overrideTopic?: string,
    overrideStyle?: ThumbnailVisualStyle,
    overrideLang?: 'hinglish' | 'hindi' | 'english',
    forceRefresh = false
  ) => {
    const targetTopic = (overrideTopic ?? topic).trim();
    const targetStyle = overrideStyle ?? visualStyle;
    const targetLang = overrideLang ?? textLanguage;

    if (!targetTopic) {
      onShowToast('Please enter a video topic first.');
      return;
    }

    setConceptError(null);
    setIsLoadingConcepts(true);

    try {
      const response = await fetch('/api/generate-thumbnail-concepts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: targetTopic,
          style: targetStyle,
          language: targetLang,
          forceRefresh,
        }),
        signal: AbortSignal.timeout(25000),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.error || 'Both primary and backup AI providers are currently unavailable. Please try again.'
        );
      }

      if (Array.isArray(data.concepts) && data.concepts.length > 0) {
        setConcepts(data.concepts);
        setIsAiConcepts(true);
        applyConceptToStudio(data.concepts[0]);
        onShowToast('Generated 3 AI topic-specific thumbnail concepts!');
        return;
      }

      throw new Error('No thumbnail concepts were returned by the AI provider.');
    } catch (err: any) {
      setConceptError(
        err?.message || 'Unable to generate AI thumbnail concepts right now. Please try again.'
      );
    } finally {
      setIsLoadingConcepts(false);
    }
  };

  // Draw the 1280x720 YouTube Thumbnail Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = 1280;
    const H = 720;
    canvas.width = W;
    canvas.height = H;

    // 1. Base Gradient Background
    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, bgStartColor);
    grad.addColorStop(1, bgEndColor);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // 2. Style-Specific Procedural Pattern (when no custom photo or blended under scrim)
    ctx.save();
    if (visualStyle === 'technology' || visualStyle === 'gaming') {
      // Perspective cyber grid lines
      ctx.strokeStyle = 'rgba(255,255,255,0.06)';
      ctx.lineWidth = 2;
      for (let x = 0; x <= W; x += 80) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);
        ctx.stroke();
      }
      for (let y = 0; y <= H; y += 80) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }
    } else if (visualStyle === 'business' || visualStyle === 'educational') {
      // Subtle upward trend bars / diagonal accents
      ctx.fillStyle = 'rgba(255,255,255,0.04)';
      for (let i = 0; i < 8; i++) {
        const barH = 120 + i * 65;
        ctx.fillRect(140 + i * 130, H - barH, 64, barH);
      }
    } else {
      // Radial energy rings
      ctx.strokeStyle = 'rgba(255,255,255,0.06)';
      ctx.lineWidth = 3;
      for (let r = 120; r <= 640; r += 110) {
        ctx.beginPath();
        ctx.arc(W * 0.72, H * 0.5, r, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    ctx.restore();

    // 3. Draw Uploaded or AI Background Image (if loaded)
    if (bgImageElement) {
      const imgW = bgImageElement.naturalWidth || bgImageElement.width;
      const imgH = bgImageElement.naturalHeight || bgImageElement.height;
      if (imgW > 0 && imgH > 0) {
        const scale = Math.max(W / imgW, H / imgH);
        const drawW = imgW * scale;
        const drawH = imgH * scale;
        const drawX = (W - drawW) / 2;
        const drawY = (H - drawH) / 2;
        ctx.drawImage(bgImageElement, drawX, drawY, drawW, drawH);

        // Contrast Scrim Overlay so text stays 100% readable
        const alpha = Math.max(0, Math.min(0.9, scrimOpacity / 100));
        const scrimGrad = ctx.createLinearGradient(0, 0, W, 0);
        scrimGrad.addColorStop(0, `rgba(2, 6, 23, ${Math.min(0.95, alpha + 0.2)})`);
        scrimGrad.addColorStop(0.65, `rgba(2, 6, 23, ${alpha})`);
        scrimGrad.addColorStop(1, `rgba(2, 6, 23, ${Math.max(0.15, alpha - 0.15)})`);
        ctx.fillStyle = scrimGrad;
        ctx.fillRect(0, 0, W, H);
      }
    }

    // 4. Optional Glow Spotlight Orb
    if (showGlowOrb) {
      ctx.save();
      const glowX = layoutType === 'left-focus' ? W * 0.78 : W * 0.5;
      const glowY = H * 0.5;
      const radGrad = ctx.createRadialGradient(glowX, glowY, 20, glowX, glowY, 420);
      radGrad.addColorStop(0, `${accentColor}55`);
      radGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = radGrad;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }

    // 5. Split-VS Diagonal Divider if layoutType === 'split-vs'
    if (layoutType === 'split-vs') {
      ctx.save();
      ctx.strokeStyle = accentColor;
      ctx.lineWidth = 10;
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.moveTo(W * 0.54, -20);
      ctx.lineTo(W * 0.46, H + 20);
      ctx.stroke();

      // VS Circle Badge in center
      ctx.fillStyle = accentColor;
      ctx.beginPath();
      ctx.arc(W * 0.5, H * 0.52, 46, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#09090b';
      ctx.font = '900 36px "Plus Jakarta Sans", system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('VS', W * 0.5, H * 0.52 + 2);
      ctx.restore();
    }

    // 6. Optional Corner Frame Border
    if (showCornerFrame) {
      ctx.save();
      ctx.strokeStyle = accentColor;
      ctx.lineWidth = 8;
      const m = 24;
      const len = 64;
      // Top-left
      ctx.beginPath();
      ctx.moveTo(m, m + len);
      ctx.lineTo(m, m);
      ctx.lineTo(m + len, m);
      ctx.stroke();
      // Top-right
      ctx.beginPath();
      ctx.moveTo(W - m - len, m);
      ctx.lineTo(W - m, m);
      ctx.lineTo(W - m, m + len);
      ctx.stroke();
      // Bottom-left
      ctx.beginPath();
      ctx.moveTo(m, H - m - len);
      ctx.lineTo(m, H - m);
      ctx.lineTo(m + len, H - m);
      ctx.stroke();
      // Bottom-right
      ctx.beginPath();
      ctx.moveTo(W - m - len, H - m);
      ctx.lineTo(W - m, H - m);
      ctx.lineTo(W - m, H - m - len);
      ctx.stroke();
      ctx.restore();
    }

    // 7. Word-Wrap & Render Sub-badge + Headline Text
    const maxTextWidth = layoutType === 'left-focus' ? 760 : 1040;
    const anchorX =
      (layoutType === 'left-focus' ? 88 : W / 2) + textOffsetX;
    const baseAnchorY =
      (layoutType === 'top-banner' ? 190 : layoutType === 'split-vs' ? 185 : 290) + textOffsetY;
    const textAlign: CanvasTextAlign = layoutType === 'left-focus' ? 'left' : 'center';

    // Sub-badge Pill/Rectangle
    if (subbadgeText.trim()) {
      ctx.save();
      ctx.font = '800 30px "Plus Jakarta Sans", system-ui, sans-serif';
      const badgeLabel = subbadgeText.trim().toUpperCase();
      const metrics = ctx.measureText(badgeLabel);
      const padX = 24;
      const badgeW = metrics.width + padX * 2;
      const badgeH = 54;
      const badgeX = textAlign === 'left' ? anchorX : anchorX - badgeW / 2;
      const badgeY = baseAnchorY - 82;

      ctx.fillStyle = accentColor;
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 12);
      ctx.fill();

      ctx.shadowBlur = 0;
      ctx.fillStyle = '#09090b';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(badgeLabel, badgeX + padX, badgeY + badgeH / 2 + 2);
      ctx.restore();
    }

    // Primary Headline Wrapping
    if (headlineText.trim()) {
      ctx.save();
      ctx.font = `900 ${fontSize}px "Plus Jakarta Sans", system-ui, sans-serif`;
      ctx.textAlign = textAlign;
      ctx.textBaseline = 'top';

      const words = headlineText.trim().split(/\s+/);
      const lines: string[] = [];
      let currentLine = words[0] || '';

      for (let i = 1; i < words.length; i++) {
        const testLine = `${currentLine} ${words[i]}`;
        if (ctx.measureText(testLine).width <= maxTextWidth) {
          currentLine = testLine;
        } else {
          lines.push(currentLine);
          currentLine = words[i];
        }
      }
      if (currentLine) lines.push(currentLine);

      const lineHeight = Math.round(fontSize * 1.18);

      lines.slice(0, 3).forEach((line, idx) => {
        const lineY = baseAnchorY + idx * lineHeight;
        const lineW = ctx.measureText(line).width;

        if (showHeadlineBox) {
          const boxX = textAlign === 'left' ? anchorX - 18 : anchorX - lineW / 2 - 18;
          ctx.fillStyle = 'rgba(9, 13, 22, 0.82)';
          ctx.beginPath();
          ctx.roundRect(boxX, lineY - 6, lineW + 36, fontSize + 16, 14);
          ctx.fill();
        }

        // Heavy dark outline for maximum mobile legibility
        ctx.lineJoin = 'round';
        ctx.lineWidth = Math.max(8, Math.round(fontSize * 0.14));
        ctx.strokeStyle = '#020617';
        ctx.shadowColor = 'rgba(0,0,0,0.85)';
        ctx.shadowBlur = 18;
        ctx.strokeText(line, anchorX, lineY);

        ctx.shadowBlur = 0;
        ctx.fillStyle = idx === 1 ? accentColor : textColor;
        ctx.fillText(line, anchorX, lineY);
      });
      ctx.restore();
    }

    // 8. Optional High-CTR Pointer Arrow Graphic
    if (showArrowShape) {
      ctx.save();
      ctx.strokeStyle = accentColor;
      ctx.fillStyle = accentColor;
      ctx.lineWidth = 12;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.shadowColor = 'rgba(0,0,0,0.75)';
      ctx.shadowBlur = 14;

      const startX = W * 0.68;
      const startY = H * 0.78;
      const endX = W * 0.84;
      const endY = H * 0.56;

      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.quadraticCurveTo(W * 0.78, H * 0.76, endX, endY);
      ctx.stroke();

      // Arrowhead
      ctx.beginPath();
      ctx.moveTo(endX, endY);
      ctx.lineTo(endX - 34, endY + 12);
      ctx.lineTo(endX - 10, endY + 36);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }, [
    visualStyle,
    headlineText,
    subbadgeText,
    layoutType,
    fontSize,
    textColor,
    accentColor,
    bgStartColor,
    bgEndColor,
    textOffsetX,
    textOffsetY,
    showHeadlineBox,
    showArrowShape,
    showCornerFrame,
    showGlowOrb,
    scrimOpacity,
    bgImageElement,
  ]);

  const handleExportThumbnail = (format: 'png' | 'jpeg') => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const mime = format === 'jpeg' ? 'image/jpeg' : 'image/png';
    const dataUrl = canvas.toDataURL(mime, 0.95);
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `creatorkit-thumbnail-1280x720-${Date.now()}.${format === 'jpeg' ? 'jpg' : 'png'}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onShowToast(`Exported 1280×720 HD Thumbnail (${format.toUpperCase()})!`);
  };

  const handleCustomBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      onShowToast('Please upload a valid PNG, JPG, or WebP image.');
      return;
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      setBgImageElement(img);
      setBgImageSourceLabel(`Uploaded: ${file.name}`);
      onShowToast('Custom photo applied to thumbnail background!');
    };
    img.src = url;
  };

  // Aspect ratio to resolution mapping for AI Horde
  const getDimensions = (ar: AspectRatio) => {
    switch (ar) {
      case '16:9':
        return { width: 768, height: 448, label: '768×448 (16:9 YouTube)' };
      case '9:16':
        return { width: 448, height: 768, label: '448×768 (9:16 Reels/Shorts)' };
      case '4:3':
        return { width: 640, height: 512, label: '640×512 (4:3 Standard)' };
      case '1:1':
      default:
        return { width: 512, height: 512, label: '512×512 (1:1 Square)' };
    }
  };

  const handleGenerateAiBackground = async (customPrompt?: string) => {
    if (isGenerating) return;

    const targetPrompt = (customPrompt || prompt).trim();
    if (!targetPrompt) {
      setError('Please describe the background scene you want AI to generate.');
      return;
    }

    setError(null);
    setIsGenerating(true);
    setProgressStatus('Initializing AI request...');
    setProgressPercent(10);
    setGenerationResult(null);

    const dims = getDimensions(aspectRatio);
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const result = await generateRealAiImage({
        prompt: targetPrompt,
        width: dims.width,
        height: dims.height,
        signal: controller.signal,
        onProgress: (status, percent) => {
          setProgressStatus(status);
          if (percent !== undefined) {
            setProgressPercent(percent);
          }
        },
      });

      setGenerationResult(result);
      setIsGenerating(false);

      // Automatically load into thumbnail canvas background as well
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        setBgImageElement(img);
        setBgImageSourceLabel('AI Generated Scene');
      };
      img.src = result.imageUrl;

      onShowToast('AI background generated and applied to your thumbnail canvas!');
    } catch (err: any) {
      setIsGenerating(false);
      if (err.message === 'Generation cancelled.' || err.name === 'AbortError') {
        onShowToast('AI generation stopped.');
        return;
      }
      setError(
        err.message ||
          'Free AI image service is temporarily busy. Your manual thumbnail studio above remains ready to export!'
      );
    } finally {
      abortControllerRef.current = null;
    }
  };

  const handleCancelAi = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort(new DOMException('Cancelled by user', 'AbortError'));
      setIsGenerating(false);
      setProgressStatus('');
      onShowToast('Generation cancelled.');
    }
  };

  const handleDownloadRawAi = async () => {
    if (!generationResult?.imageUrl) return;
    try {
      const response = await fetch(generationResult.imageUrl);
      const blob = await response.blob();
      const localUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = localUrl;
      link.download = `creatorkit-ai-scene-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(localUrl), 1000);
      onShowToast('Raw AI image downloaded!');
    } catch {
      const link = document.createElement('a');
      link.href = generationResult.imageUrl;
      link.download = `creatorkit-ai-scene-${Date.now()}.png`;
      link.target = '_blank';
      link.click();
    }
  };

  const handleCopyPrompt = () => {
    if (!prompt) return;
    navigator.clipboard.writeText(prompt);
    setCopiedPrompt(true);
    onShowToast('AI scene prompt copied!');
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Section 1: Topic-Specific Thumbnail Concept Generator */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 md:p-8 shadow-xs border border-slate-200 dark:border-slate-800 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/70 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">
              YouTube Thumbnail &amp; AI Visual Studio
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Generate topic-specific YouTube thumbnail concepts in Hindi, Hinglish, or English, customize overlays on a 1280×720 HD canvas, upload photos, or generate free AI backgrounds.
            </p>
          </div>
        </div>

        {/* Topic + Visual Style + Language Controls */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-6">
            <label
              htmlFor="thumb-topic"
              className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1.5"
            >
              1. Enter Your Exact Video Topic <span className="text-purple-600">*</span>
            </label>
            <input
              id="thumb-topic"
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleGenerateConcepts();
              }}
              placeholder="e.g. iPhone 16 vs S24 Camera Test, घर पर समोसा कैसे बनाएं"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600"
            />
          </div>

          <div className="md:col-span-3">
            <label
              htmlFor="thumb-style"
              className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1.5"
            >
              2. Visual Category Style
            </label>
            <select
              id="thumb-style"
              value={visualStyle}
              onChange={(e) => {
                const nextStyle = e.target.value as ThumbnailVisualStyle;
                setVisualStyle(nextStyle);
                handleGenerateConcepts(topic, nextStyle, textLanguage);
              }}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600"
            >
              {VISUAL_STYLES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-3">
            <label
              htmlFor="thumb-lang"
              className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1.5"
            >
              3. Headline Language
            </label>
            <select
              id="thumb-lang"
              value={textLanguage}
              onChange={(e) => {
                const nextLang = e.target.value as 'hinglish' | 'hindi' | 'english';
                setTextLanguage(nextLang);
                handleGenerateConcepts(topic, visualStyle, nextLang);
              }}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600"
            >
              <option value="hinglish">🇮🇳 Hinglish (Roman Hindi)</option>
              <option value="hindi">🇮🇳 Hindi (हिन्दी देवनागरी)</option>
              <option value="english">🇬🇧 English</option>
            </select>
          </div>
        </div>

        {/* Sample Topic Buttons & Generate Concept Button */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Try topic preset:
            </span>
            {TOPIC_PRESETS.map((p) => (
              <button
                key={p.topic}
                type="button"
                onClick={() => {
                  setTopic(p.topic);
                  setVisualStyle(p.style);
                  setTextLanguage(p.lang);
                  handleGenerateConcepts(p.topic, p.style, p.lang);
                }}
                className="text-xs bg-slate-100 dark:bg-slate-800 hover:bg-purple-50 dark:hover:bg-purple-950/60 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
              >
                {p.topic}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => handleGenerateConcepts(undefined, undefined, undefined, true)}
            disabled={isLoadingConcepts}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-all cursor-pointer disabled:opacity-60 min-h-[44px]"
          >
            {isLoadingConcepts ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            <span>
              {isLoadingConcepts ? 'Designing Concepts...' : 'Generate 3 Topic Thumbnail Concepts'}
            </span>
          </button>
        </div>

        {conceptError && (
          <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-sm">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{conceptError}</span>
            </div>
            <button
              type="button"
              onClick={() => handleGenerateConcepts(undefined, undefined, undefined, true)}
              disabled={isLoadingConcepts}
              className="shrink-0 px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* 3 Clickable Thumbnail Concept Cards */}
        {concepts.length > 0 && (
          <div className="pt-2 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>
                Click any concept below to load its headline, color hierarchy, and layout onto the canvas:
              </span>
              <span>{isAiConcepts ? 'AI Art-Directed Concepts' : 'Studio Topic Concepts'}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {concepts.map((c, idx) => {
                const isSelected = activeConceptId === c.id || (!activeConceptId && idx === 0);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => applyConceptToStudio(c)}
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                      isSelected
                        ? 'bg-purple-50/80 dark:bg-purple-950/60 border-purple-600 dark:border-purple-500 ring-2 ring-purple-600/20'
                        : 'bg-slate-50 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700 hover:border-purple-400'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-bold text-purple-700 dark:text-purple-300">
                        Concept {idx + 1} · {c.angleLabel}
                      </span>
                      <span
                        className="w-4 h-4 rounded-full border border-white/40 shrink-0"
                        style={{ backgroundColor: c.accentColor }}
                      />
                    </div>
                    <div>
                      <span className="inline-block text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-slate-900 text-amber-400 mb-1">
                        {c.subbadge}
                      </span>
                      <p className="text-sm font-extrabold text-slate-900 dark:text-white leading-tight">
                        {c.headline}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Section 2: Interactive 1280x720 Thumbnail Canvas & Manual Studio Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Live 1280x720 Canvas Preview + Export Bar (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span>Live 1280×720 HD Thumbnail Canvas</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {bgImageSourceLabel
                  ? `Active background: ${bgImageSourceLabel}`
                  : `Procedural Studio Backdrop (${visualStyle})`}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleExportThumbnail('png')}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white shadow-xs transition-colors cursor-pointer min-h-[40px]"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export HD PNG</span>
              </button>
              <button
                type="button"
                onClick={() => handleExportThumbnail('jpeg')}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer min-h-[40px]"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export JPG</span>
              </button>
            </div>
          </div>

          {/* 16:9 Canvas Container */}
          <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950 shadow-md">
            <canvas
              ref={canvasRef}
              width={1280}
              height={720}
              className="w-full h-auto block aspect-video"
            />
          </div>

          {/* Background Photo Upload & Reset Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex flex-wrap items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleCustomBgUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer min-h-[40px]"
              >
                <Upload className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                <span>Upload Custom Background Photo</span>
              </button>

              {bgImageElement && (
                <button
                  type="button"
                  onClick={() => {
                    setBgImageElement(null);
                    setBgImageSourceLabel('');
                    onShowToast('Removed background image; using studio gradient.');
                  }}
                  className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline px-2 py-1 cursor-pointer"
                >
                  Remove Photo
                </button>
              )}
            </div>

            {bgImageElement && (
              <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                <span>Dark Scrim: {scrimOpacity}%</span>
                <input
                  type="range"
                  min={0}
                  max={85}
                  value={scrimOpacity}
                  onChange={(e) => setScrimOpacity(Number(e.target.value))}
                  className="w-24 accent-purple-600"
                />
              </div>
            )}
          </div>
        </div>

        {/* Right: Manual Text Overlays, Colors, Layout & Shapes Editor (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <Sliders className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Manual Thumbnail Designer Controls
            </h2>
          </div>

          {/* Headline & Subbadge Text Inputs */}
          <div className="space-y-3">
            <div>
              <label
                htmlFor="studio-headline"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
              >
                Main Thumbnail Headline (Hindi / Hinglish / English)
              </label>
              <input
                id="studio-headline"
                type="text"
                value={headlineText}
                onChange={(e) => setHeadlineText(e.target.value)}
                placeholder="Keep it short (2-5 punchy words)"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-purple-600"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="studio-badge"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                >
                  Top Kicker Badge
                </label>
                <input
                  id="studio-badge"
                  type="text"
                  value={subbadgeText}
                  onChange={(e) => setSubbadgeText(e.target.value)}
                  placeholder="e.g. REAL TEST"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>

              <div>
                <label
                  htmlFor="studio-layout"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                >
                  Composition Layout
                </label>
                <select
                  id="studio-layout"
                  value={layoutType}
                  onChange={(e) => setLayoutType(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-600"
                >
                  <option value="left-focus">Left Headline + Right Subject</option>
                  <option value="center-impact">Center Big Impact</option>
                  <option value="split-vs">Split Screen VS Comparison</option>
                  <option value="top-banner">Top Header Banner</option>
                </select>
              </div>
            </div>
          </div>

          {/* Font Size & Position Offset Sliders */}
          <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <Type className="w-3.5 h-3.5" /> Headline Size
              </span>
              <span className="font-mono text-slate-500">{fontSize}px</span>
            </div>
            <input
              type="range"
              min={44}
              max={116}
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              className="w-full accent-purple-600"
            />

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                  <span>Horizontal Pos (X)</span>
                  <span className="font-mono">{textOffsetX}px</span>
                </div>
                <input
                  type="range"
                  min={-220}
                  max={220}
                  value={textOffsetX}
                  onChange={(e) => setTextOffsetX(Number(e.target.value))}
                  className="w-full accent-purple-600"
                />
              </div>
              <div>
                <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                  <span>Vertical Pos (Y)</span>
                  <span className="font-mono">{textOffsetY}px</span>
                </div>
                <input
                  type="range"
                  min={-160}
                  max={180}
                  value={textOffsetY}
                  onChange={(e) => setTextOffsetY(Number(e.target.value))}
                  className="w-full accent-purple-600"
                />
              </div>
            </div>
          </div>

          {/* Color Pickers */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-2">
              <Palette className="w-3.5 h-3.5" /> Colors &amp; Contrast Palette
            </span>
            <div className="grid grid-cols-4 gap-2 text-center">
              <label className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer">
                <input
                  type="color"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="w-6 h-6 rounded cursor-pointer mx-auto block"
                />
                <span className="text-[10px] font-medium text-slate-600 dark:text-slate-300 mt-1 block">
                  Accent
                </span>
              </label>

              <label className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer">
                <input
                  type="color"
                  value={textColor}
                  onChange={(e) => setTextColor(e.target.value)}
                  className="w-6 h-6 rounded cursor-pointer mx-auto block"
                />
                <span className="text-[10px] font-medium text-slate-600 dark:text-slate-300 mt-1 block">
                  Text
                </span>
              </label>

              <label className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer">
                <input
                  type="color"
                  value={bgStartColor}
                  onChange={(e) => setBgStartColor(e.target.value)}
                  className="w-6 h-6 rounded cursor-pointer mx-auto block"
                />
                <span className="text-[10px] font-medium text-slate-600 dark:text-slate-300 mt-1 block">
                  BG Left
                </span>
              </label>

              <label className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer">
                <input
                  type="color"
                  value={bgEndColor}
                  onChange={(e) => setBgEndColor(e.target.value)}
                  className="w-6 h-6 rounded cursor-pointer mx-auto block"
                />
                <span className="text-[10px] font-medium text-slate-600 dark:text-slate-300 mt-1 block">
                  BG Right
                </span>
              </label>
            </div>
          </div>

          {/* Graphic Shapes & Overlays Checkboxes */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2 text-xs">
            <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={showHeadlineBox}
                onChange={(e) => setShowHeadlineBox(e.target.checked)}
                className="rounded text-purple-600"
              />
              <span>Dark Headline Backing</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={showArrowShape}
                onChange={(e) => setShowArrowShape(e.target.checked)}
                className="rounded text-purple-600"
              />
              <span>Pointer Arrow Shape</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={showCornerFrame}
                onChange={(e) => setShowCornerFrame(e.target.checked)}
                className="rounded text-purple-600"
              />
              <span>Corner Frame Accents</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={showGlowOrb}
                onChange={(e) => setShowGlowOrb(e.target.checked)}
                className="rounded text-purple-600"
              />
              <span>Spotlight Glow</span>
            </label>
          </div>
        </div>
      </div>

      {/* Section 3: Optional Free AI Scene / Background Generator (AI Horde) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 md:p-8 shadow-xs border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Wand2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span>Optional: Generate Custom AI Scene Background (Free AI Cluster)</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Uses the free open-source AI Horde Stable Diffusion cluster. When finished, the AI image is automatically placed behind your crisp thumbnail text above!
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label
              htmlFor="ai-prompt"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
            >
              AI Scene Prompt (Auto-filled from your selected topic concept, or type your own)
            </label>
            <textarea
              id="ai-prompt"
              rows={2}
              value={prompt}
              disabled={isGenerating}
              onChange={(e) => {
                setPrompt(e.target.value);
                if (error) setError(null);
              }}
              className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-600 disabled:opacity-60"
            />
          </div>

          {/* Aspect Ratio Selector for standalone AI export */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: '16:9', label: '16:9 YouTube', desc: '768×448' },
              { id: '9:16', label: '9:16 Reels/Shorts', desc: '448×768' },
              { id: '1:1', label: '1:1 Square Post', desc: '512×512' },
              { id: '4:3', label: '4:3 Standard', desc: '640×512' },
            ].map((ar) => (
              <button
                key={ar.id}
                type="button"
                disabled={isGenerating}
                onClick={() => setAspectRatio(ar.id as AspectRatio)}
                className={`p-2 rounded-xl border text-center transition-colors cursor-pointer disabled:opacity-50 ${
                  aspectRatio === ar.id
                    ? 'bg-purple-50 dark:bg-purple-950/70 border-purple-600 text-purple-700 dark:text-purple-300 font-bold'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'
                }`}
              >
                <span className="block text-xs">{ar.label}</span>
                <span className="text-[10px] text-slate-400 font-mono">{ar.desc}</span>
              </button>
            ))}
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs space-y-2">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                <div>
                  <p className="font-semibold">{error}</p>
                  <p className="text-[11px] text-amber-700 dark:text-amber-300 mt-0.5">
                    Note: You can still customize and export your 1280×720 thumbnail immediately using the Studio Canvas above, or tap Retry to request an AI worker.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleGenerateAiBackground()}
                disabled={isGenerating}
                className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry AI Scene Generation</span>
              </button>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            {!isGenerating ? (
              <button
                type="button"
                onClick={() => handleGenerateAiBackground()}
                className="flex items-center justify-center gap-2 bg-slate-900 dark:bg-purple-600 hover:bg-slate-800 dark:hover:bg-purple-700 text-white px-5 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer min-h-[44px]"
              >
                <Wand2 className="w-4 h-4" />
                <span>Generate Free AI Background Scene</span>
              </button>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled
                  className="flex items-center gap-2 bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 px-4 py-2.5 rounded-xl font-bold text-xs min-h-[44px]"
                >
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{progressStatus || 'Synthesizing in free AI cluster...'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleCancelAi}
                  className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 px-3.5 py-2.5 rounded-xl font-semibold text-xs cursor-pointer min-h-[44px]"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Cancel</span>
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={handleCopyPrompt}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer min-h-[44px]"
            >
              {copiedPrompt ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedPrompt ? 'Copied Prompt' : 'Copy Scene Prompt'}</span>
            </button>
          </div>

          {isGenerating && (
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-purple-600 h-full transition-all duration-300 rounded-full"
                style={{ width: `${Math.max(15, progressPercent)}%` }}
              />
            </div>
          )}

          {generationResult && !isGenerating && (
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <img
                  src={generationResult.imageUrl}
                  alt="AI generated background"
                  referrerPolicy="no-referrer"
                  className="w-24 h-14 object-cover rounded-lg border border-slate-300 dark:border-slate-700"
                />
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-emerald-500" />
                    <span>AI Scene Ready ({generationResult.width}×{generationResult.height}px)</span>
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Applied to your 1280×720 Thumbnail Canvas above, or download raw image:
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleDownloadRawAi}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-purple-600 hover:text-white text-slate-800 dark:text-slate-200 transition-colors cursor-pointer shrink-0 min-h-[40px]"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Raw AI Image</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
