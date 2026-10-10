import React, { useState } from 'react';
import { 
  Search, ArrowRight, Video, Instagram, Hash, FileText, Type, Sparkles,
  Image as ImageIcon, Layout, Repeat, Scissors, Wand2, AtSign, Clapperboard, QrCode,
  IndianRupee, Grid
} from 'lucide-react';
import { ALL_TOOLS } from '../data/toolsList';
import { PageTab } from '../types';

interface Props {
  onNavigate: (tab: PageTab) => void;
}

export const AllToolsPage: React.FC<Props> = ({ onNavigate }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [search, setSearch] = useState('');

  const categories = [
    'All',
    'YouTube',
    'Instagram',
    'Image & Design',
    'SEO & Discovery',
    'Text & Utility',
    'AI Creative',
  ];

  const filtered = ALL_TOOLS.filter((tool) => {
    const matchesCat = selectedCategory === 'All' || tool.category === selectedCategory;
    const q = search.toLowerCase().trim();
    if (!q) return matchesCat;
    const matchesKeyword = tool.keywords?.some((k) => k.toLowerCase().includes(q)) ?? false;
    const matchesSearch =
      tool.title.toLowerCase().includes(q) ||
      tool.shortName.toLowerCase().includes(q) ||
      tool.description.toLowerCase().includes(q) ||
      tool.category.toLowerCase().includes(q) ||
      matchesKeyword;
    return matchesCat && matchesSearch;
  });

  const getToolIcon = (icon: string) => {
    switch (icon) {
      case 'Video':
        return <Video className="w-5 h-5 text-purple-600 dark:text-purple-400" />;
      case 'Instagram':
        return <Instagram className="w-5 h-5 text-pink-600 dark:text-pink-400" />;
      case 'AtSign':
        return <AtSign className="w-5 h-5 text-pink-600 dark:text-pink-400" />;
      case 'Clapperboard':
        return <Clapperboard className="w-5 h-5 text-rose-600 dark:text-rose-400" />;
      case 'QrCode':
        return <QrCode className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />;
      case 'IndianRupee':
        return <IndianRupee className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />;
      case 'Grid':
        return <Grid className="w-5 h-5 text-pink-600 dark:text-pink-400" />;
      case 'Hash':
        return <Hash className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
      case 'FileText':
        return <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />;
      case 'Type':
        return <Type className="w-5 h-5 text-violet-600 dark:text-violet-400" />;
      case 'Image':
        return <ImageIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />;
      case 'Layout':
        return <Layout className="w-5 h-5 text-red-600 dark:text-red-400" />;
      case 'Repeat':
        return <Repeat className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
      case 'Scissors':
        return <Scissors className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />;
      case 'Sparkles':
        return <Wand2 className="w-5 h-5 text-purple-600 dark:text-purple-400" />;
      default:
        return <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />;
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-xs">
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-2">
          All Free Creator Tools
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
          Browse our suite of free online utilities built for Indian creators, educators, students, and businesses. Filter by category or search below.
        </p>

        {/* Filter controls */}
        <div className="mt-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`text-xs font-semibold px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="relative max-w-xs w-full">
            <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search tools..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-600 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
          </div>
        </div>
      </div>

      {/* Tools Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((tool) => (
          <div
            key={tool.id}
            className="group bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/90 dark:border-slate-800 shadow-xs hover:shadow-md hover:border-purple-300 dark:hover:border-purple-700 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                  {getToolIcon(tool.icon)}
                </div>
                <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  {tool.category}
                </span>
              </div>

              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 group-hover:text-purple-700 dark:group-hover:text-purple-400 transition-colors mb-2">
                {tool.title}
              </h2>

              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
                {tool.description}
              </p>
            </div>

            <button
              type="button"
              onClick={() => onNavigate(tool.id)}
              className="w-full flex items-center justify-center gap-2 bg-slate-50 dark:bg-slate-800 hover:bg-purple-600 dark:hover:bg-purple-600 text-slate-800 dark:text-slate-100 hover:text-white px-4 py-3 rounded-xl text-xs sm:text-sm font-semibold border border-slate-200 dark:border-slate-700 group-hover:border-purple-600 transition-all cursor-pointer min-h-[44px]"
            >
              <span>Launch Tool</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
