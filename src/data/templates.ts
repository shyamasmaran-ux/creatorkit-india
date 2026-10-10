import { GeneratedCaption, GeneratedTitle, HashtagGroup, PostType, CaptionTone, TitleStyle } from '../types';

/**
 * Clean & honest offline template fallback engine for YouTube Titles.
 * Follows strict rules:
 * - Never invents facts or adds unrelated phrases like "Zero Se Hero" or "Reality in India"
 * - Honest descriptive style tags (e.g. "Curiosity Style", "Vlog Style", "How-To"), never speculative CTR claims
 * - Matches topic context cleanly
 */
export function generateYouTubeTitles(topic: string, keywords: string, selectedStyle: TitleStyle = 'all'): GeneratedTitle[] {
  const cleanTopic = topic.trim();
  const cleanKeyword = keywords.trim() || cleanTopic;
  const currentYear = new Date().getFullYear();

  const isHindiScript = /[\u0900-\u097F]/.test(cleanTopic);
  const isHinglish = /\b(ka|ki|ke|ko|se|mein|me|hai|ho|aur|kya|kyun|kaise|sach|dekho|karo|banao)\b/i.test(cleanTopic);

  const list: { style: string; title: string }[] = [];

  if (isHindiScript) {
    list.push(
      { style: 'How-To', title: `${cleanTopic}: शुरुआत से अंत तक पूरी गाइड` },
      { style: 'Curiosity Style', title: `${cleanTopic} के बारे में यह जानना बहुत ज़रूरी है` },
      { style: 'Vlog Style', title: `आज का अनुभव: ${cleanTopic}` },
      { style: 'Educational', title: `${cleanTopic} आसान भाषा में समझें` },
      { style: 'Simple', title: `${cleanTopic} - पूरी जानकारी (${currentYear})` },
      { style: 'Mistakes to Avoid', title: `${cleanTopic} करते समय इन गलतियों से बचें` },
      { style: 'Beginner Guide', title: `शुरुआती लोगों के लिए ${cleanTopic}` },
      { style: 'Honest Review', title: `${cleanTopic}: क्या यह सच में उपयोगी है?` },
      { style: 'Practical Tips', title: `${cleanTopic} के लिए महत्वपूर्ण टिप्स` },
      { style: 'Storytelling', title: `${cleanTopic} के साथ मेरा व्यक्तिगत अनुभव` }
    );
  } else if (isHinglish) {
    list.push(
      { style: 'How-To', title: `${cleanTopic} Step by Step Kaise Karein (${currentYear})` },
      { style: 'Curiosity Style', title: `${cleanTopic}: Jo Baatein Aapko Pehle Pata Honi Chahiye` },
      { style: 'Vlog Style', title: `Aaj Ka Din Aur ${cleanTopic} Experience` },
      { style: 'Educational', title: `${cleanTopic} Aasan Bhasha Me Samjhein` },
      { style: 'Simple', title: `${cleanTopic} - Complete Details for Beginners` },
      { style: 'Mistakes to Avoid', title: `${cleanTopic} Me Ye Galti Mat Karna!` },
      { style: 'Beginner Guide', title: `Beginners Guide to ${cleanTopic}` },
      { style: 'Honest Review', title: `${cleanTopic}: Mera Honest Feedback Aur Sach` },
      { style: 'Practical Tips', title: `${cleanTopic} Ke Best Tips Aur Tricks` },
      { style: 'Storytelling', title: `${cleanTopic} Journey: Kya Seekha Maine?` }
    );
  } else {
    list.push(
      { style: 'How-To', title: `How to Approach ${cleanTopic} in ${currentYear} (Step-by-Step)` },
      { style: 'Curiosity Style', title: `The Essential Things You Must Know About ${cleanTopic}` },
      { style: 'Educational', title: `${cleanTopic} Explained: Complete Guide for Beginners` },
      { style: 'Vlog Style', title: `A Day Experiencing ${cleanTopic} (Behind the Scenes)` },
      { style: 'Mistakes to Avoid', title: `5 Common Mistakes People Make with ${cleanTopic} (& Solutions)` },
      { style: 'Simple', title: `${cleanTopic} - Everything You Need to Get Started` },
      { style: 'Honest Review', title: `An Honest Look at ${cleanTopic}: Is It Worth Your Time?` },
      { style: 'Practical Tips', title: `Practical Tips to Get Better Results with ${cleanTopic}` },
      { style: 'Storytelling', title: `What I Learned from My Experience with ${cleanTopic}` },
      { style: 'Comparison', title: cleanKeyword !== cleanTopic ? `${cleanTopic} vs ${cleanKeyword}: Real Comparison` : `${cleanTopic}: What Actually Works in ${currentYear}` }
    );
  }

  // Filter if user specifically selected a style
  let filtered = list;
  if (selectedStyle !== 'all') {
    const key = selectedStyle.toLowerCase();
    const matched = list.filter(item => item.style.toLowerCase().includes(key));
    if (matched.length > 0) {
      filtered = matched;
    }
  }

  return filtered.map((item, index) => ({
    id: `title-${index}-${Date.now()}`,
    title: item.title,
    style: item.style,
    estimatedCTR: 'Authentic & Relevant' as any
  }));
}

/**
 * Clean & honest offline template fallback engine for Instagram Captions.
 */
export function generateInstagramCaptions(
  topic: string, 
  postType: PostType, 
  tone: CaptionTone, 
  additionalContext?: string
): GeneratedCaption[] {
  const cleanTopic = topic.trim();
  const context = additionalContext?.trim() || '';

  const results: GeneratedCaption[] = [];
  const baseTag = slugify(cleanTopic);
  const relevantTags = baseTag ? [`#${baseTag}`, '#contentcreator', '#dailygram'] : ['#creator', '#dailygram'];

  if (tone === 'funny') {
    results.push({
      id: `ig-1-${Date.now()}`,
      hook: `Me trying to handle ${cleanTopic} like an absolute pro. 😅`,
      body: `Behind every neat post about ${cleanTopic} is a chaotic workspace and way too much overthinking.\n\n` +
            (context ? `Honest note: ${context}\n\n` : '') +
            `Tell me I'm not the only one who goes through this!`,
      cta: `Share this with someone who can relate! 👇`,
      hashtags: relevantTags,
      fullCaption: '',
      tone,
      postType
    });
    results.push({
      id: `ig-2-${Date.now()}`,
      hook: `Expectation vs Reality: ${cleanTopic} edition. 😂`,
      body: `Expectation: Seamless and effortless.\nReality: Taking three tries just to get it right.\n\n` +
            `Still showed up though! That counts for something, right?`,
      cta: `Drop a ❤️ if you’ve been here before.`,
      hashtags: relevantTags,
      fullCaption: '',
      tone,
      postType
    });
    results.push({
      id: `ig-3-${Date.now()}`,
      hook: `Current mood: figuring out ${cleanTopic} one step at a time.`,
      body: `Some days are smooth, other days are pure improvisation.\n\n` +
            (context ? `${context}\n\n` : '') +
            `At least we are making progress!`,
      cta: `Comment your current status below! 👇`,
      hashtags: relevantTags,
      fullCaption: '',
      tone,
      postType
    });
  } else if (tone === 'professional') {
    results.push({
      id: `ig-1-${Date.now()}`,
      hook: `Key considerations when approaching ${cleanTopic}:`,
      body: `Clarity and consistency make all the difference.\n\n` +
            `• Focus on fundamental principles before complicating systems.\n` +
            `• Track meaningful outcomes rather than surface-level metrics.\n` +
            `• Continuous iteration based on practical experience.\n\n` +
            (context ? `Note: ${context}\n\n` : ''),
      cta: `Save this post for your next planning session.`,
      hashtags: relevantTags,
      fullCaption: '',
      tone,
      postType
    });
    results.push({
      id: `ig-2-${Date.now()}`,
      hook: `A structured perspective on ${cleanTopic}.`,
      body: `Success with ${cleanTopic} often comes down to disciplined execution.\n\n` +
            `1. Establish clear goals early.\n` +
            `2. Eliminate avoidable inefficiencies.\n` +
            `3. Focus on quality output.\n\n` +
            (context ? `${context}\n\n` : ''),
      cta: `What has your experience with this been? Share your perspective below.`,
      hashtags: relevantTags,
      fullCaption: '',
      tone,
      postType
    });
  } else if (tone === 'storytelling') {
    results.push({
      id: `ig-1-${Date.now()}`,
      hook: `A quick reflection on ${cleanTopic}...`,
      body: `When I first got into ${cleanTopic}, I thought it would be straightforward. The real experience taught me a lot more about patience and adapting to the unexpected.\n\n` +
            (context ? `Key takeaway: ${context}\n\n` : '') +
            `Sometimes the journey teaches you more than the outcome itself.`,
      cta: `Have you ever experienced something similar? Let me know below!`,
      hashtags: relevantTags,
      fullCaption: '',
      tone,
      postType
    });
    results.push({
      id: `ig-2-${Date.now()}`,
      hook: `Behind the scenes of ${cleanTopic}.`,
      body: `It's easy to see the finished result, but the process is where the real work happens.\n\n` +
            `Every step forward takes effort and learning along the way.\n\n` +
            (context ? `${context}\n\n` : ''),
      cta: `Double tap if you appreciate the process!`,
      hashtags: relevantTags,
      fullCaption: '',
      tone,
      postType
    });
  } else {
    // Friendly & general
    results.push({
      id: `ig-1-${Date.now()}`,
      hook: `Quick thoughts on ${cleanTopic}! ✨`,
      body: `Here are a few things that have made a genuine difference for me:\n\n` +
            `1. Start simple and build up steadily.\n` +
            `2. Don't stress over perfection.\n` +
            `3. Enjoy the learning curve along the way.\n\n` +
            (context ? `Context: ${context}\n\n` : ''),
      cta: `Save this post for later and share your thoughts below! 💬`,
      hashtags: relevantTags,
      fullCaption: '',
      tone,
      postType
    });
    results.push({
      id: `ig-2-${Date.now()}`,
      hook: `Checking in on ${cleanTopic}.`,
      body: `Taking time today to focus on what matters most with ${cleanTopic}.\n\n` +
            `Small, honest efforts every single day add up over time.\n\n` +
            (context ? `${context}\n\n` : ''),
      cta: `Drop a comment with your thoughts!`,
      hashtags: relevantTags,
      fullCaption: '',
      tone,
      postType
    });
    results.push({
      id: `ig-3-${Date.now()}`,
      hook: `The reality of ${cleanTopic}.`,
      body: `No shortcuts, just genuine consistency and focus.\n\n` +
            (context ? `Keep in mind: ${context}\n\n` : ''),
      cta: `Tag a friend who would find this helpful!`,
      hashtags: relevantTags,
      fullCaption: '',
      tone,
      postType
    });
  }

  return results.map(item => ({
    ...item,
    fullCaption: `${item.hook}\n\n${item.body}\n\n${item.cta}\n\n.\n.\n${item.hashtags.join(' ')}`
  }));
}

/**
 * Clean & honest offline template fallback engine for YouTube Description.
 */
export function generateYouTubeDescription(params: {
  topic: string;
  keywords?: string;
  channelName?: string;
  socials?: { instagram?: string; twitter?: string; telegram?: string; email?: string };
  includeTimestamps?: boolean;
  includeDisclaimer?: boolean;
}): string {
  const topic = params.topic?.trim() || 'this video';
  const keywords = params.keywords?.trim() || topic;
  const channel = params.channelName?.trim() || 'My Channel';
  const currentYear = new Date().getFullYear();

  let desc = `In this video, we cover ${topic} with practical details and clear insights.\n\n`;
  desc += `Whether you are just starting out or looking for useful guidance, here is a breakdown of what you need to know about ${keywords} in ${currentYear}.\n\n`;

  desc += `📌 Key Points Covered in This Video:\n`;
  desc += `• Overview of ${topic}\n`;
  desc += `• Practical insights and tips on ${keywords}\n`;
  desc += `• Common pitfalls to avoid and realistic expectations\n\n`;

  if (params.includeTimestamps) {
    desc += `⏱️ Video Timestamps:\n`;
    desc += `00:00 - Introduction to ${topic}\n`;
    desc += `01:10 - Overview & Context\n`;
    desc += `03:30 - Core Details & Walkthrough\n`;
    desc += `06:45 - Key Takeaways & Practical Tips\n`;
    desc += `08:30 - Summary & Next Steps\n\n`;
  }

  desc += `📲 Follow & Connect with ${channel}:\n`;
  if (params.socials?.instagram) desc += `• Instagram: ${params.socials.instagram}\n`;
  if (params.socials?.telegram) desc += `• Telegram: ${params.socials.telegram}\n`;
  if (params.socials?.twitter) desc += `• Twitter / X: ${params.socials.twitter}\n`;
  if (params.socials?.email) desc += `• Business Enquiries: ${params.socials.email}\n`;

  desc += `\n🔔 If you found this video helpful, please like the video, share it with someone who might benefit, and subscribe to ${channel} for more content!\n\n`;

  if (params.includeDisclaimer) {
    desc += `⚠️ Disclaimer: This video is for informational and educational purposes. All opinions and experiences shared are personal.\n\n`;
  }

  const tags = `#${slugify(topic)} #${slugify(keywords)} #${channel.replace(/\s+/g, '')}`;
  desc += `${tags}`;

  return desc;
}

/**
 * Built-in Hashtag Intelligence Engine
 */
export function generateHashtags(query: string): { groups: HashtagGroup[]; totalCount: number; allTagsList: string[] } {
  const clean = query.toLowerCase().trim();
  const slug = slugify(clean);

  const baseIndianTags = [
    '#reelsindia', '#creatorsofindia', '#indiancreators', '#bharatcreators',
    '#instaindia', '#explorepageindia', '#desicontent', '#creatorindia',
    '#reelitfeelit', '#indianyoutuber', '#exploreindia'
  ];

  const nicheMap: Record<string, string[]> = {
    tech: ['#techindia', '#technewsindia', '#gadgetsindia', '#smartphonesindia', '#unboxingindia', '#techcreator', '#indianyoutubers', '#techupdates', '#hindiTech', '#appreview'],
    gadget: ['#gadgetsindia', '#techgadgets', '#smartphoneunboxing', '#bestgadgets', '#amazonfindsindia', '#coolgadgets', '#techtrends'],
    finance: ['#stockmarketindia', '#personalfinanceindia', '#investingindia', '#mutualfundsindia', '#wealthcreation', '#sipindia', '#nifty50', '#financialfreedomindia', '#moneytipsindia', '#indiastocks'],
    money: ['#personalfinanceindia', '#moneymanagement', '#earnmoneyonlineindia', '#studentfinance', '#savingsindia', '#budgetingindia'],
    food: ['#indianfoodie', '#delhifoodie', '#mumbaifoodie', '#desifood', '#streetfoodindia', '#foodtalkindia', '#gharkakhana', '#indianrecipes', '#foodiesofindia', '#quickrecipes'],
    cooking: ['#indiancooking', '#easyrecipesindia', '#vegrecipesofindia', '#desikhana', '#chefsofinstagram', '#homecookindia'],
    fitness: ['#fitnessindia', '#fitindiamovement', '#desifitness', '#gymloverindia', '#healthylifestyleindia', '#workoutmotivation', '#delhifitness', '#nutritionindia', '#yogaindia'],
    gym: ['#gymindia', '#bodybuildingindia', '#fitnessmotivation', '#desigym', '#fitbharat', '#naturalbodybuildingindia'],
    education: ['#upscaspirants', '#studentsofindia', '#studyindia', '#currentaffairsindia', '#studymotivationindia', '#cbseboard', '#neetpreparation', '#iasmotivation', '#indianeducation'],
    study: ['#studygramindia', '#studytips', '#examprepindia', '#aspirantslife', '#upscmotivation', '#collegeindia'],
    business: ['#smallbusinessindia', '#vocalforlocalindia', '#d2cindia', '#indianstartups', '#handmadeinindia', '#entrepreneurindia', '#womenentrepreneursindia', '#makeinindia'],
    travel: ['#travelindia', '#incredibleindia', '#indiatravelgram', '#solotravelindia', '#himalayasindia', '#himachalpradesh', '#keralatourism', '#wanderlustindia', '#backpackingindia'],
    fashion: ['#indianfashionblogger', '#desilook', '#ethnicwearindia', '#festivefashionindia', '#sareelove', '#ootdindia', '#delhifashion', '#fashioncreatorindia'],
    gaming: ['#esportsindia', '#bgmiindia', '#indiangamers', '#gamingcommunityindia', '#freefireindia', '#pcgamingindia', '#streamerindia'],
    vlog: ['#dailyvlogindia', '#lifestylevlogger', '#indianvlogger', '#minivlogindia', '#motovlogindia', '#familyvlogindia']
  };

  let matchedNicheTags: string[] = [];
  for (const [key, tags] of Object.entries(nicheMap)) {
    if (clean.includes(key) || key.includes(clean)) {
      matchedNicheTags = [...matchedNicheTags, ...tags];
    }
  }

  const words = clean.split(/\s+/).filter(w => w.length > 2);
  const dynamicGenerated = words.flatMap(word => [
    `#${word}india`,
    `#${word}creator`,
    `#${word}tips`,
    `#best${word}`,
    `#learn${word}`,
    `#daily${word}`,
    `#${word}daily`
  ]);

  if (slug) {
    dynamicGenerated.unshift(`#${slug}`, `#${slug}india`, `#${slug}2025`);
  }

  const pool = Array.from(new Set([...matchedNicheTags, ...dynamicGenerated, ...baseIndianTags]));

  const highTier = pool.slice(0, 10);
  const midTier = pool.slice(10, 20);
  const lowTier = pool.slice(20, 30);

  const groups: HashtagGroup[] = [
    {
      category: 'High Reach / Trending',
      reachLevel: 'High Volume (1M+)',
      tags: highTier.length ? highTier : baseIndianTags.slice(0, 8)
    },
    {
      category: 'Targeted Niche & Topic',
      reachLevel: 'Targeted Niche (100k-1M)',
      tags: midTier.length ? midTier : [`#${slug}`, `#${slug}india`, '#desicontent', '#explorepageindia']
    },
    {
      category: 'Community & Low Competition',
      reachLevel: 'Community & Local (<100k)',
      tags: lowTier.length ? lowTier : [`#${slug}tips`, '#creatorcommunity', '#growthindia']
    }
  ];

  const allTagsList = Array.from(new Set(groups.flatMap(g => g.tags)));

  return {
    groups,
    totalCount: allTagsList.length,
    allTagsList
  };
}

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '')
    .replace(/[^\w-]+/g, '');
}
