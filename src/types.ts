export type PageTab = 
  | 'home' 
  | 'all-tools' 
  | 'youtube-title' 
  | 'youtube-thumbnail'
  | 'youtube-calculator'
  | 'instagram-caption' 
  | 'instagram-bio'
  | 'instagram-splitter'
  | 'reel-script'
  | 'hashtag-generator' 
  | 'youtube-description' 
  | 'whatsapp-generator'
  | 'text-utilities' 
  | 'image-editor'
  | 'format-converter'
  | 'background-remover'
  | 'text-to-image'
  | 'about' 
  | 'contact' 
  | 'privacy' 
  | 'terms';

export interface ToolMeta {
  id: PageTab;
  title: string;
  shortName: string;
  description: string;
  category: 'YouTube' | 'Instagram' | 'SEO & Discovery' | 'Text & Utility' | 'Image & Design' | 'AI Creative';
  icon: string;
  badge?: string;
  popular?: boolean;
  keywords?: string[];
}

export type TitleStyle = 'all' | 'educational' | 'curiosity' | 'entertaining' | 'listicle' | 'how-to' | 'comparison' | 'hinglish';

export interface GeneratedTitle {
  id: string;
  title: string;
  style: string;
  estimatedCTR: 'High' | 'Very High' | 'Trending';
}

export type CaptionTone = 'friendly' | 'professional' | 'funny' | 'inspirational' | 'storytelling' | 'minimal';
export type PostType = 'reel' | 'carousel' | 'photo' | 'announcement' | 'product';

export interface GeneratedCaption {
  id: string;
  hook: string;
  body: string;
  cta: string;
  hashtags: string[];
  fullCaption: string;
  tone: CaptionTone;
  postType: PostType;
}

export interface HashtagGroup {
  category: string;
  tags: string[];
  reachLevel: 'High Volume (1M+)' | 'Targeted Niche (100k-1M)' | 'Community & Local (<100k)';
}

export type ReelScriptStyle = 'educational' | 'storytelling' | 'tech-review' | 'finance' | 'tutorial' | 'myth-busting';

export interface ReelScriptVariation {
  id: string;
  angle: string;
  hook: string;
  visualCue: string;
  scriptBody: string;
  cta: string;
  estimatedDuration: string;
}

export type ThumbnailVisualStyle =
  | 'educational'
  | 'gaming'
  | 'technology'
  | 'facts'
  | 'entertainment'
  | 'business'
  | 'tutorials';

export interface ThumbnailConcept {
  id: string;
  style: ThumbnailVisualStyle;
  angleLabel: string;
  headline: string;
  subbadge: string;
  bgStart: string;
  bgEnd: string;
  accentColor: string;
  textColor: string;
  layoutType: 'left-focus' | 'center-impact' | 'split-vs' | 'top-banner';
  aiScenePrompt: string;
}

export interface SavedCreatorItem {
  id: string;
  toolId: PageTab;
  toolName: string;
  title: string;
  content: string;
  createdAt: number;
  isFavorite: boolean;
}

