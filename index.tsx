import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import htm from 'htm';
import { GoogleGenAI, Type } from "@google/genai";

const html = htm.bind(React.createElement);

// --- THEME CONSTANTS ---
const Theme = {
    AMOLED_RAINBOW: 'Amoled Rainbow',
    AMOLED_WHITE: 'Amoled White',
    CYBERPUNK: 'Cyberpunk',
    WOODEN: 'Wooden',
    UNIVERSE: 'Universe',
    BARBIE: 'Barbie',
    INVERSE_PAPER: 'Inverse Paper',
};

const THEME_STYLES = {
    [Theme.AMOLED_WHITE]: {
        bg: 'bg-black', text: 'text-white', panel: 'bg-neutral-900', border: 'border-white/20', accent: 'text-gray-300',
        button: 'bg-white text-black', buttonHover: 'hover:bg-gray-200', input: 'bg-neutral-800 text-white border-white/20',
        tableHeader: 'bg-neutral-800 text-white', rowEven: 'bg-black', rowOdd: 'bg-neutral-900', font: 'font-sans',
        verdictGood: 'text-green-400', verdictBad: 'text-red-400',
    },
    [Theme.AMOLED_RAINBOW]: {
        bg: 'bg-black', text: 'text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-red-500',
        panel: 'bg-neutral-900 border-l border-pink-500', border: 'border-pink-500/50', accent: 'text-pink-300',
        button: 'bg-gradient-to-r from-purple-600 to-pink-600 text-white', buttonHover: 'hover:from-purple-500 hover:to-pink-500',
        input: 'bg-neutral-800 text-pink-500 border-pink-500/50', tableHeader: 'bg-neutral-900 text-pink-500 border-b border-pink-500',
        rowEven: 'bg-black', rowOdd: 'bg-neutral-900/50', font: 'font-sans tracking-wide', verdictGood: 'text-green-400', verdictBad: 'text-red-400',
    },
    [Theme.CYBERPUNK]: {
        bg: 'bg-yellow-300', text: 'text-black', panel: 'bg-cyan-600 text-black', border: 'border-black', accent: 'text-neutral-800',
        button: 'bg-black text-cyan-400 font-bold uppercase tracking-widest', buttonHover: 'hover:bg-neutral-800',
        input: 'bg-cyan-100 text-black border-black border-2', tableHeader: 'bg-black text-cyan-400 uppercase font-bold',
        rowEven: 'bg-yellow-300', rowOdd: 'bg-yellow-200', font: 'font-mono', verdictGood: 'bg-black text-green-400 px-1', verdictBad: 'bg-black text-red-500 px-1',
    },
    [Theme.WOODEN]: {
        bg: 'bg-[#5D4037]', text: 'text-[#EFEBE9]', panel: 'bg-[#4E342E]', border: 'border-[#8D6E63]', accent: 'text-[#D7CCC8]',
        button: 'bg-[#3E2723] text-[#D7CCC8] border border-[#8D6E63]', buttonHover: 'hover:bg-[#4E342E]',
        input: 'bg-[#3E2723] text-[#D7CCC8] border-[#8D6E63]', tableHeader: 'bg-[#3E2723] text-[#D7CCC8]',
        rowEven: 'bg-[#5D4037]', rowOdd: 'bg-[#4E342E]', font: 'font-serif', verdictGood: 'text-[#C8E6C9]', verdictBad: 'text-[#FFCDD2]',
    },
    [Theme.UNIVERSE]: {
        bg: 'bg-[#0f172a]', text: 'text-blue-100', panel: 'bg-[#1e293b]', border: 'border-blue-500/30', accent: 'text-cyan-300',
        button: 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.5)]', buttonHover: 'hover:bg-blue-500',
        input: 'bg-[#1e293b] text-blue-100 border-blue-500/30', tableHeader: 'bg-[#172554] text-cyan-200',
        rowEven: 'bg-[#0f172a]', rowOdd: 'bg-[#1e293b]', font: 'font-sans', verdictGood: 'text-cyan-300 shadow-cyan-500/50', verdictBad: 'text-purple-300',
    },
    [Theme.BARBIE]: {
        bg: 'bg-pink-500', text: 'text-white', panel: 'bg-white text-pink-600', border: 'border-white', accent: 'text-pink-100',
        button: 'bg-white text-pink-500 font-bold', buttonHover: 'hover:bg-pink-100',
        input: 'bg-pink-400 text-white placeholder-pink-200 border-white', tableHeader: 'bg-white text-pink-500 font-bold',
        rowEven: 'bg-pink-500', rowOdd: 'bg-pink-600', font: 'font-sans', verdictGood: 'bg-white text-green-500 px-2 rounded-full font-bold', verdictBad: 'bg-white text-red-500 px-2 rounded-full font-bold',
    },
    [Theme.INVERSE_PAPER]: {
        bg: 'bg-white', text: 'text-black', panel: 'bg-gray-100 text-black border-l border-black', border: 'border-black', accent: 'text-gray-700',
        button: 'bg-black text-white border border-black', buttonHover: 'hover:bg-gray-800',
        input: 'bg-white text-black border border-black', tableHeader: 'bg-gray-200 text-black border-b border-black font-bold uppercase',
        rowEven: 'bg-white text-black', rowOdd: 'bg-gray-50 text-black', font: 'font-serif', verdictGood: 'font-bold underline', verdictBad: 'italic text-gray-600',
    },
};

// --- DATA FETCHING ---
const fetchGameData = async (gameName, currency, region) => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: `Search for current prices and playtime for the video game "${gameName}". 
            Context: Region ${region}, Currency ${currency}. 
            Stores: Steam, GOG, Green Man Gaming, Humble Bundle, Kinguin, G2A. 
            Provide HowLongToBeat (HLTB) main story time and historic low price.`,
            config: {
                tools: [{ googleSearch: {} }],
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING },
                        hltbTime: { type: Type.STRING },
                        steamPrice: { type: Type.NUMBER },
                        gogPrice: { type: Type.NUMBER },
                        gmgPrice: { type: Type.NUMBER },
                        humblePrice: { type: Type.NUMBER },
                        kinguinPrice: { type: Type.NUMBER },
                        g2aPrice: { type: Type.NUMBER },
                        lowestAllTime: { type: Type.NUMBER },
                        isGoodDeal: { type: Type.BOOLEAN },
                        dealVerdict: { type: Type.STRING }
                    },
                    required: ["name", "hltbTime", "steamPrice", "gogPrice", "gmgPrice", "humblePrice", "kinguinPrice", "g2aPrice", "lowestAllTime", "isGoodDeal", "dealVerdict"]
                }
            },
        });

        if (response.text) {
            const data = JSON.parse(response.text);
            return {
                name: data.name || gameName,
                hltbTime: data.hltbTime || '?',
                prices: {
                    steam: data.steamPrice || 0,
                    gog: data.gogPrice || 0,
                    gmg: data.gmgPrice || 0,
                    humble: data.humblePrice || 0,
                    kinguin: data.kinguinPrice || 0,
                    g2a: data.g2aPrice || 0,
                },
                lowestAllTime: data.lowestAllTime || 0,
                isGoodDeal: data.isGoodDeal || false,
                dealVerdict: data.dealVerdict || 'Unknown',
                status: 'success',
            };
        }
        throw new Error("Empty response");
    } catch (error: any) {
        console.error("Fetch Error:", error);
        return { name: gameName, status: 'error', dealVerdict: "Search Error" };
    }
};

const fetchRecommendations = async (gameList) => {
    if (gameList.length === 0) return [];
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: `Based on this wishlist: ${gameList.join(", ")}, recommend 5 similar indie games.`,
            config: { 
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            name: { type: Type.STRING },
                            reason: { type: Type.STRING }
                        },
                        required: ["name", "reason"]
                    }
                }
            },
        });
        return response.text ? JSON.parse(response.text) : [];
    } catch (e) {
        console.error("Rec Error:", e);
        return [];
    }
};

// --- ICONS ---
const RefreshIcon = () => html`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3"/></svg>`;
const TrashIcon = () => html`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`;
const SettingsIcon = () => html`<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 5 9 1.65 1.65 0 0 0 4.67 7.18l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`;
const KeyIcon = () => html`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.778-7.778zm0 0L15.5 7.5m0 0l3 3m-3-3l-2.5-2.5"/></svg>`;

const App = () => {
    const [games, setGames] = useState(() => JSON.parse(localStorage.getItem('gpt_games') || '[]'));
    const [settings, setSettings] = useState(() => JSON.parse(localStorage.getItem('gpt_settings') || '{"currency":"EUR","region":"EU West","theme":"Inverse Paper"}'));
    const [recommendations, setRecommendations] = useState([]);
    const [inputName, setInputName] = useState('');
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isRecLoading, setIsRecLoading] = useState(false);
    const [hasKey, setHasKey] = useState(false);

    const styles = THEME_STYLES[settings.theme] || THEME_STYLES[Theme.INVERSE_PAPER];

    useEffect(() => {
        localStorage.setItem('gpt_games', JSON.stringify(games));
    }, [games]);

    useEffect(() => {
        localStorage.setItem('gpt_settings', JSON.stringify(settings));
    }, [settings]);

    useEffect(() => {
        const checkKey = async () => {
            if (window.aistudio && window.aistudio.hasSelectedApiKey) {
                try { setHasKey(await window.aistudio.hasSelectedApiKey()); } 
                catch (e) { console.error(e); }
            }
        };
        checkKey();
    }, []);

    useEffect(() => {
        const fetchRecs = async () => {
            if (games.length === 0) { setRecommendations([]); return; }
            setIsRecLoading(true);
            setRecommendations(await fetchRecommendations(games.map(g => g.name)));
            setIsRecLoading(false);
        };
        const t = setTimeout(fetchRecs, 2000);
        return () => clearTimeout(t);
    }, [games.length]);

    const handleLinkAccount = async () => {
        if (window.aistudio && window.aistudio.openSelectKey) {
            await window.aistudio.openSelectKey();
            setHasKey(true);
        } else {
            alert("This secure account linking is provided by the AI Studio environment. To use this app externally, set the environment variable 'API_KEY'.");
        }
    };

    const handleAdd = async () => {
        if (!inputName.trim()) return;
        const id = Date.now().toString();
        setGames(p => [...p, { id, name: inputName, status: 'loading', prices: { steam: 0, gog: 0, gmg: 0, humble: 0, kinguin: 0, g2a: 0 }, dealVerdict: 'Analysing...' }]);
        setInputName('');
        const data = await fetchGameData(inputName, settings.currency, settings.region);
        setGames(p => p.map(g => g.id === id ? { ...g, ...data } : g));
    };

    const handleRefresh = async (id, name) => {
        setGames(p => p.map(g => g.id === id ? { ...g, status: 'loading' } : g));
        const data = await fetchGameData(name, settings.currency, settings.region);
        setGames(p => p.map(g => g.id === id ? { ...g, ...data } : g));
    };

    const formatPrice = (p) => new Intl.NumberFormat(undefined, { style: 'currency', currency: settings.currency }).format(p || 0);

    const getVerdictColor = (g) => {
        if (g.status === 'loading') return 'bg-gray-500 animate-pulse';
        if (g.isGoodDeal) return 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]';
        return 'bg-red-500/50';
    };

    return html`
        <div className=${`min-h-screen transition-colors duration-300 ${styles.bg} ${styles.text} ${styles.font} p-4 md:p-8`}>
            <div className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8">
                <div className="lg:col-span-3 space-y-6">
                    <!-- Header -->
                    <div className=${`p-6 rounded-2xl shadow-2xl ${styles.panel} ${styles.border} border flex flex-col md:flex-row justify-between items-center gap-4`}>
                        <div className="flex flex-col">
                            <h1 className=${`text-4xl font-black tracking-tighter ${styles.text}`}>GAME SCOUT</h1>
                            <p className=${`opacity-60 text-xs font-bold uppercase tracking-widest mt-1 ${styles.accent}`}>Omni-Store Market Tracker</p>
                        </div>
                        <div className="flex items-center gap-2">
                             <button onClick=${handleLinkAccount} className=${`flex items-center gap-2 px-4 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${hasKey ? 'bg-green-500/10 border-green-500/50 text-green-400' : 'bg-red-500/10 border-red-500/50 text-red-400 animate-pulse'}`}>
                                <${KeyIcon} /> ${hasKey ? 'Account Linked' : 'Connect Account'}
                            </button>
                            <button onClick=${() => setIsSettingsOpen(!isSettingsOpen)} className=${`p-3 rounded-xl border shadow-lg ${styles.button} ${styles.buttonHover} transition-transform active:scale-95`}><${SettingsIcon} /></button>
                        </div>
                    </div>

                    <!-- Settings Panel -->
                    ${isSettingsOpen ? html`
                        <div className=${`p-8 rounded-2xl shadow-inner mb-6 border-2 ${styles.border} ${styles.panel} animate-in fade-in slide-in-from-top-4 duration-500`}>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                <div>
                                    <label className="block text-[10px] uppercase tracking-widest mb-3 opacity-50 font-black">Visual Identity</label>
                                    <select value=${settings.theme} onChange=${e => setSettings({...settings, theme: e.target.value})} className=${`w-full p-3 rounded-lg border outline-none font-bold ${styles.input}`}>
                                        ${Object.values(Theme).map(t => html`<option key=${t} value=${t}>${t}</option>`)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] uppercase tracking-widest mb-3 opacity-50 font-black">Currency & Region</label>
                                    <div className="flex gap-2">
                                        <select value=${settings.currency} onChange=${e => setSettings({...settings, currency: e.target.value})} className=${`w-1/2 p-3 rounded-lg border outline-none font-bold ${styles.input}`}>
                                            <option value="EUR">€ EUR</option><option value="USD">$ USD</option>
                                        </select>
                                        <select value=${settings.region} onChange=${e => setSettings({...settings, region: e.target.value})} className=${`w-1/2 p-3 rounded-lg border outline-none font-bold ${styles.input}`}>
                                            <option value="EU West">EU West</option><option value="USA">USA</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] uppercase tracking-widest mb-3 opacity-50 font-black">Account Connection</label>
                                    <button onClick=${handleLinkAccount} className=${`w-full p-3 rounded-lg border-2 font-black uppercase text-[10px] transition-all ${hasKey ? 'border-green-500 text-green-500' : 'border-red-500 text-red-500'}`}>
                                        ${hasKey ? 'Change Gemini Account' : 'Connect Secure Gemini Key'}
                                    </button>
                                </div>
                            </div>
                            <div className="mt-8 pt-8 border-t border-white/5 space-y-4">
                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-30">Developer / External Usage Info</h4>
                                <p className="text-xs opacity-50 leading-relaxed">
                                    To use your own API keys outside of this environment (e.g., in a downloaded build), this application is hard-coded to retrieve credentials via the standard <code>process.env.API_KEY</code> environment variable. Simply set this variable in your hosting platform or <code>.env</code> file. No UI input is required for local security.
                                </p>
                            </div>
                        </div>
                    `: null}

                    <!-- Search -->
                    <div className="flex gap-3">
                        <input type="text" value=${inputName} onChange=${e => setInputName(e.target.value)} onKeyDown=${e => e.key === 'Enter' && handleAdd()} placeholder="Add a game to track (e.g., Hades II)..." className=${`flex-1 p-5 rounded-2xl outline-none border shadow-2xl ${styles.input} text-xl transition-all focus:ring-4 focus:ring-white/10`} />
                        <button onClick=${handleAdd} className=${`px-12 rounded-2xl font-black uppercase tracking-widest shadow-2xl active:scale-95 transition-all ${styles.button} ${styles.buttonHover}`}>Search</button>
                    </div>

                    <!-- Comparison Table -->
                    <div className=${`overflow-hidden rounded-2xl border-2 shadow-2xl ${styles.border} backdrop-blur-xl`}>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[1000px]">
                                <thead>
                                    <tr className=${`${styles.tableHeader} border-b-2 ${styles.border}`}>
                                        <th className="p-4 text-[10px] uppercase tracking-widest font-black">Title</th>
                                        <th className="p-4 text-center text-[10px] uppercase tracking-widest font-black">HLTB</th>
                                        <th className="p-4 text-right text-[10px] uppercase tracking-widest font-black">Steam</th>
                                        <th className="p-4 text-right text-[10px] uppercase tracking-widest font-black">GOG</th>
                                        <th className="p-4 text-right text-[10px] uppercase tracking-widest font-black">GMG</th>
                                        <th className="p-4 text-right text-[10px] uppercase tracking-widest font-black">Humble</th>
                                        <th className="p-4 text-right text-[10px] uppercase tracking-widest font-black">Kinguin</th>
                                        <th className="p-4 text-right text-[10px] uppercase tracking-widest font-black">G2A</th>
                                        <th className="p-4 text-center text-[10px] uppercase tracking-widest font-black w-16">Deal</th>
                                        <th className="p-4 text-center text-[10px] uppercase tracking-widest font-black">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${games.length === 0 ? html`<tr><td colSpan="10" className=${`p-16 text-center opacity-30 font-medium ${styles.rowEven}`}>Your list is empty. Connect your account and search for a game!</td></tr>` : games.map((g, i) => html`
                                        <tr key=${g.id} className=${`border-b border-opacity-10 ${styles.border} ${i % 2 === 0 ? styles.rowEven : styles.rowOdd} hover:bg-white/5 transition-colors group`}>
                                            <td className="p-4">
                                                <div className="flex flex-col">
                                                    <span className="truncate max-w-[180px] font-bold">${g.name}</span>
                                                    <span className="text-[9px] opacity-40 font-black uppercase tracking-tighter">Hist. Low: ${formatPrice(g.lowestAllTime)}</span>
                                                </div>
                                            </td>
                                            <td className="p-4 text-center text-xs opacity-60 font-mono">${g.hltbTime}</td>
                                            <td className="p-4 text-right font-bold text-sm">
                                                <a href="https://store.steampowered.com/search/?term=${encodeURIComponent(g.name)}" target="_blank" className="hover:underline">${g.status === 'loading' ? '...' : formatPrice(g.prices.steam)}</a>
                                            </td>
                                            <td className="p-4 text-right text-xs opacity-80">${g.status === 'loading' ? '...' : formatPrice(g.prices.gog)}</td>
                                            <td className="p-4 text-right text-xs opacity-80">${g.status === 'loading' ? '...' : formatPrice(g.prices.gmg)}</td>
                                            <td className="p-4 text-right text-xs opacity-80">${g.status === 'loading' ? '...' : formatPrice(g.prices.humble)}</td>
                                            <td className="p-4 text-right text-[10px] font-mono opacity-50">${g.status === 'loading' ? '...' : formatPrice(g.prices.kinguin)}</td>
                                            <td className="p-4 text-right text-[10px] font-mono opacity-50">${g.status === 'loading' ? '...' : formatPrice(g.prices.g2a)}</td>
                                            <td className="p-4 text-center relative group/verdict">
                                                <div className=${`w-3 h-3 rounded-full mx-auto ${getVerdictColor(g)} transition-all`} />
                                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-32 p-2 bg-black text-white text-[9px] rounded opacity-0 pointer-events-none group-hover/verdict:opacity-100 transition-opacity z-10 border border-white/20 text-center uppercase font-black">
                                                    ${g.dealVerdict}
                                                </div>
                                            </td>
                                            <td className="p-4 text-center">
                                                <div className="flex justify-center gap-1">
                                                    <button onClick=${() => handleRefresh(g.id, g.name)} disabled=${g.status === 'loading'} className="p-1.5 hover:bg-white/10 rounded-full transition-all active:scale-75"><${RefreshIcon}/></button>
                                                    <button onClick=${() => setGames(prev => prev.filter(x => x.id !== g.id))} className="p-1.5 hover:bg-red-500/10 hover:text-red-400 rounded-full transition-all active:scale-75"><${TrashIcon}/></button>
                                                </div>
                                            </td>
                                        </tr>
                                    `)}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <!-- Sidebar Legend & Spotlight -->
                <div className="lg:col-span-1 space-y-6">
                    <div className=${`p-6 rounded-2xl shadow-xl border-2 ${styles.panel} ${styles.border} backdrop-blur-2xl`}>
                        <h2 className=${`text-[10px] font-black mb-4 uppercase tracking-[0.2em] ${styles.accent}`}>Price Analysis Legend</h2>
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]"></div>
                                <span className="text-[9px] font-black uppercase opacity-60">Excellent Deal / Near All-Time Low</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-2.5 h-2.5 rounded-full bg-red-500/50"></div>
                                <span className="text-[9px] font-black uppercase opacity-60">High Price / Wait for Discount</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-2.5 h-2.5 rounded-full bg-gray-500 animate-pulse"></div>
                                <span className="text-[9px] font-black uppercase opacity-60">Fetching Real-time Markets</span>
                            </div>
                            <p className="text-[8px] opacity-30 mt-4 italic leading-tight uppercase font-bold">Hover over status indicators for detailed AI reasoning.</p>
                        </div>
                    </div>

                    <div className=${`p-8 rounded-2xl shadow-2xl h-fit border-2 ${styles.panel} ${styles.border} backdrop-blur-2xl`}>
                        <h2 className=${`text-2xl font-black mb-6 uppercase tracking-tighter ${styles.accent}`}>INDIE SPOTLIGHT</h2>
                        ${isRecLoading ? html`<div className="space-y-4"><div className="h-24 bg-white/5 animate-pulse rounded-xl"></div><div className="h-24 bg-white/5 animate-pulse rounded-xl"></div></div>` : recommendations.length > 0 ? html`
                            <ul className="space-y-4">
                                ${recommendations.map((r, i) => html`<li key=${i} className=${`p-4 rounded-xl border border-opacity-20 ${styles.border} ${styles.rowOdd} group hover:bg-white/10 transition-all scale-100 hover:scale-[1.02]`}>
                                    <div className="font-black text-xs mb-2 group-hover:text-white uppercase tracking-tighter">${r.name}</div>
                                    <div className="text-[10px] opacity-50 leading-relaxed italic font-medium">${r.reason}</div>
                                </li>`)}
                            </ul>
                        ` : html`<div className="text-center opacity-20 text-[9px] py-16 border-2 border-dashed ${styles.border} rounded-2xl uppercase font-black tracking-widest">Add games for AI discovery</div>`}
                    </div>
                </div>
            </div>
        </div>
    `;
};

const root = createRoot(document.getElementById('root')!);
root.render(html`<${App} />`);