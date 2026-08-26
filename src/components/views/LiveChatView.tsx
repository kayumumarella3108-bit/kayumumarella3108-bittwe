import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Send,
  Bot,
  User as UserIcon,
  Crown,
  Search,
  Sparkles,
  Zap,
  Trash2,
  Copy,
  Check,
  Users,
  Radio,
  AlertTriangle,
  FileText,
  Calendar,
  Flame,
  ChevronRight,
  X,
  RefreshCw,
  ShieldAlert,
  Settings,
  Plus,
  Edit3,
  Sliders,
  HelpCircle,
  CheckCircle2,
  ToggleLeft,
  ToggleRight,
  Play
} from 'lucide-react';
import { User, ChatMessage, UserOnlinePresence, AutoReplyRule } from '../../types';
import { isOwnerUser } from '../../utils/permissions';
import { calculatePresenceStatus } from '../../utils/presenceTracker';
import { db, doc, deleteDoc, setDoc } from '../../lib/firebase';

interface LiveChatViewProps {
  currentUser: User;
  chatMessages: ChatMessage[];
  onlineUsersList: UserOnlinePresence[];
  autoReplyRules?: AutoReplyRule[];
  onSelectView?: (viewKey: any) => void;
  onSendMessage?: (message: ChatMessage) => void;
  onDeleteMessage?: (msgId: string) => void;
  onClearChat?: () => void;
  onSaveAutoReplyRule?: (rule: AutoReplyRule) => void;
  onDeleteAutoReplyRule?: (ruleId: string) => void;
}

export const LiveChatView: React.FC<LiveChatViewProps> = ({
  currentUser,
  chatMessages,
  onlineUsersList,
  autoReplyRules = [],
  onSelectView,
  onSendMessage,
  onDeleteMessage,
  onClearChat,
  onSaveAutoReplyRule,
  onDeleteAutoReplyRule
}) => {
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<'semua' | 'gangguan' | 'teknis' | 'row' | 'survey'>('semua');
  const [isSending, setIsSending] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);

  // Auto Reply Rules Modal State
  const [isAutoReplyModalOpen, setIsAutoReplyModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<AutoReplyRule | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Rule Form State
  const [ruleTitle, setRuleTitle] = useState('');
  const [ruleTopic, setRuleTopic] = useState<'gangguan' | 'teknis' | 'row' | 'survey' | 'umum'>('umum');
  const [ruleKeywordsStr, setRuleKeywordsStr] = useState('');
  const [ruleResponse, setRuleResponse] = useState('');
  const [ruleIsActive, setRuleIsActive] = useState(true);

  // Live Test State
  const [testInput, setTestInput] = useState('');
  const [testResult, setTestResult] = useState<{ matchedRuleTitle?: string; text: string } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isCurrentUserOwner = isOwnerUser(currentUser);

  // Determine Sistem / System Admin presence status
  const systemPresence = onlineUsersList.find(
    (p) => (p.username || '').toLowerCase() === 'owner' || p.role?.toLowerCase() === 'owner'
  );
  const systemStatusInfo = systemPresence
    ? calculatePresenceStatus(systemPresence)
    : { status: 'offline' as const, label: 'Offline' };

  const isSystemOnline = systemStatusInfo.status === 'online';
  const systemDotColorClass = isSystemOnline ? 'bg-emerald-500' : systemStatusInfo.status === 'idle' ? 'bg-amber-500' : 'bg-slate-400';

  // Auto scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Filter messages based on search & topic
  const filteredMessages = chatMessages
    .filter((msg) => {
      // Topic filter
      if (selectedTopic !== 'semua' && msg.topic && msg.topic !== selectedTopic) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchText = (msg.message || '').toLowerCase();
        const matchName = (msg.senderName || '').toLowerCase();
        const matchBot = (msg.botName || '').toLowerCase();
        return matchText.includes(q) || matchName.includes(q) || matchBot.includes(q);
      }

      return true;
    })
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  // Reset form helper
  const handleResetForm = () => {
    setEditingRule(null);
    setRuleTitle('');
    setRuleTopic('umum');
    setRuleKeywordsStr('');
    setRuleResponse('');
    setRuleIsActive(true);
    setIsFormOpen(false);
  };

  const handleStartEditRule = (rule: AutoReplyRule) => {
    setEditingRule(rule);
    setRuleTitle(rule.title);
    setRuleTopic(rule.topic || 'umum');
    setRuleKeywordsStr(rule.keywords ? rule.keywords.join(', ') : '');
    setRuleResponse(rule.response);
    setRuleIsActive(rule.isActive);
    setIsFormOpen(true);
  };

  const handleSaveRuleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleTitle.trim() || !ruleResponse.trim()) return;

    const keywords = ruleKeywordsStr
      .split(',')
      .map((k) => k.trim())
      .filter((k) => k.length > 0);

    const ruleObj: AutoReplyRule = {
      id: editingRule ? editingRule.id : `rule_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title: ruleTitle.trim(),
      topic: ruleTopic,
      keywords: keywords,
      response: ruleResponse.trim(),
      isActive: ruleIsActive,
      createdBy: currentUser.name || currentUser.username,
      createdAt: editingRule ? editingRule.createdAt : new Date().toISOString()
    };

    if (onSaveAutoReplyRule) {
      onSaveAutoReplyRule(ruleObj);
    }
    handleResetForm();
  };

  const handleToggleRuleActive = (rule: AutoReplyRule) => {
    const updated = { ...rule, isActive: !rule.isActive };
    if (onSaveAutoReplyRule) {
      onSaveAutoReplyRule(updated);
    }
  };

  const handleTestAutoReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testInput.trim()) return;

    const queryLower = testInput.trim().toLowerCase();
    const activeRules = autoReplyRules.filter((r) => r.isActive);

    for (const rule of activeRules) {
      if (rule.keywords && rule.keywords.some((kw) => kw.trim() && queryLower.includes(kw.trim().toLowerCase()))) {
        setTestResult({
          matchedRuleTitle: rule.title,
          text: rule.response.replace(/@username/gi, `@${currentUser.username}`).replace(/@name/gi, currentUser.name || currentUser.username)
        });
        return;
      }
    }

    setTestResult({
      matchedRuleTitle: 'Respons Default (Tidak ada kata kunci cocok)',
      text: `Terima kasih atas pesan Anda, @${currentUser.username}. **Sistem ULP Baguala saat ini sedang OFFLINE.** Pesan Anda tersimpan dengan aman.`
    });
  };

  // Smart Auto-Reply Generator for Bot
  const generateBotResponse = (userMsg: string, sender: User): { text: string; topic?: 'gangguan' | 'teknis' | 'row' | 'survey' | 'umum' } => {
    const textLower = userMsg.toLowerCase();

    // 1. Check custom configured auto reply rules first
    if (autoReplyRules && autoReplyRules.length > 0) {
      const activeRules = autoReplyRules.filter((r) => r.isActive);
      for (const rule of activeRules) {
        if (rule.keywords && rule.keywords.some((kw) => kw.trim() && textLower.includes(kw.trim().toLowerCase()))) {
          const formattedResponse = rule.response
            .replace(/@username/gi, `@${sender.username}`)
            .replace(/@name/gi, sender.name || sender.username);
          return {
            topic: rule.topic || 'umum',
            text: formattedResponse
          };
        }
      }
    }

    // 2. Default hardcoded fallback rules
    if (textLower.includes('gangguan') || textLower.includes('trip') || textLower.includes('padam') || textLower.includes('feeder')) {
      return {
        topic: 'gangguan',
        text: `Salam hangat @${sender.username} (${sender.name}). **Sistem ULP Baguala** saat ini sedang **OFFLINE**.\n\n🤖 **Respons Otomatis Bot ULP Baguala [SOP Gangguan Feeder]:**\n1. Pastikan indikasi relay di Gardu Induk (OCR/GFR/EF) telah dicatat.\n2. Lakukan koordinasi penelusuran lokasi gangguan berjarak bersama tim Yantek.\n3. Input Laporan Gangguan pada menu **'Laporan Gangguan Feeder'** agar waktu pemulihan terhitung otomatis di SAIDI/SAIFI.\n\n*Pesan Anda telah disimpan di inbox Sistem dan akan ditanggapi langsung begitu Sistem online.*`
      };
    }

    if (textLower.includes('piket') || textLower.includes('jadwal') || textLower.includes('yantek') || textLower.includes('shift')) {
      return {
        topic: 'teknis',
        text: `Halo @${sender.username} (${sender.name})! **Sistem ULP Baguala** sedang **OFFLINE**.\n\n🤖 **Informasi Otomatis Bot Piket:**\nJadwal piket harian Petugas Yantek ULP Baguala dibagi menjadi 3 Shift (Pagi 08.00-16.00, Siang 16.00-24.00, Malam 00.00-08.00 WIT). Silakan periksa atau perbarui susunan tim piket di menu **'Jadwal Piket Petugas'**.\n\n*Sistem telah menerima notifikasi pesan Anda.*`
      };
    }

    if (textLower.includes('row') || textLower.includes('pohon') || textLower.includes('tebang') || textLower.includes('pangkas')) {
      return {
        topic: 'row',
        text: `Halo @${sender.username}! **Sistem ULP Baguala** sedang **OFFLINE**.\n\n🤖 **Informasi Bot ROW & Titik Pohon Kritis:**\nLaporan pemangkasan/tebang pohon kritis dekat JTM 20kV wajib dilengkapi koordinat lat/long dan foto sebelum/sesudah. Anda dapat memantau atau mengentri data pada menu **'Peta ROW & Titik Pohon'**.\n\n*Pesan Anda tersimpan aman dan siap dibaca Sistem.*`
      };
    }

    if (textLower.includes('survey') || textLower.includes('pb') || textLower.includes('pd') || textLower.includes('pasang baru') || textLower.includes('tambah daya')) {
      return {
        topic: 'survey',
        text: `Halo @${sender.username}! **Sistem ULP Baguala** saat ini sedang **OFFLINE**.\n\n🤖 **Informasi Bot Survey PB/PD:**\nSLA pelaksanaan survey lokasi pasang baru / tambah daya adalah maksimal **1x24 jam** sejak WO diterbitkan. Silakan periksa daftar survei aktif pada menu **'Survey Pasang Baru & PB/PD'**.\n\n*Sistem akan meninjau laporan Anda saat kembali aktif.*`
      };
    }

    // Default intelligent response
    return {
      topic: 'umum',
      text: `Terima kasih atas pesan Anda, @${sender.username} (${sender.name}). **Sistem ULP Baguala saat ini sedang OFFLINE.**\n\n🤖 **Tanggapan Otomatis AI Bot Assistant:**\nPesan Anda telah tersimpan dengan aman di database. Untuk kebutuhan koordinasi lapangan yang membutuhkan bantuan rekan tim, obrolan ini langsung terhubung dengan seluruh petugas dan Sistem.\n\n*Sistem akan membaca dan membalas pesan ini sesegera mungkin saat kembali aktif.*`
    };
  };

  // Send message handler
  const handleSendMessage = async (e?: React.FormEvent, customText?: string) => {
    if (e) e.preventDefault();
    const textToSend = customText || inputText;
    if (!textToSend.trim() || isSending) return;

    setIsSending(true);

    try {
      const nowIso = new Date().toISOString();
      const msgId = `chat_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

      // 1. Prepare User Message
      const userMessageObj: ChatMessage = {
        id: msgId,
        senderId: currentUser.id || currentUser.username,
        senderName: currentUser.name || 'Petugas ULP',
        senderUsername: currentUser.username,
        senderRole: currentUser.role === 'Owner' ? 'Sistem' : (currentUser.role || 'Petugas'),
        senderAvatar: currentUser.avatarUrl,
        recipient: 'all',
        message: textToSend.trim(),
        timestamp: nowIso,
        isOwnerOnlineAtSend: isSystemOnline
      };

      // Optimistic local state update
      onSendMessage?.(userMessageObj);
      if (!customText) setInputText('');

      // Save user message to Firestore
      try {
        await setDoc(doc(db, 'chat_messages', msgId), userMessageObj);
      } catch (err) {
        console.warn('Firestore setDoc user message (handled):', err);
      }

      // 2. Check if Auto Bot Reply is needed (if sender is NOT system and system is offline)
      if (!isCurrentUserOwner && !isSystemOnline) {
        // Wait 800ms for natural feel before bot replies
        setTimeout(async () => {
          const botResult = generateBotResponse(textToSend, currentUser);
          const botMsgId = `chat_bot_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

          const botMessageObj: ChatMessage = {
            id: botMsgId,
            senderId: 'bot_pln_baguala',
            senderName: 'PLN Baguala AI Bot',
            senderUsername: 'bot_assistant',
            senderRole: 'Asisten Otomatis ULP',
            senderAvatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
            recipient: 'all',
            message: botResult.text,
            timestamp: new Date().toISOString(),
            isBotReply: true,
            botName: 'PLN Baguala AI Bot',
            botType: 'auto_reply_owner_offline',
            topic: botResult.topic
          };

          onSendMessage?.(botMessageObj);

          try {
            await setDoc(doc(db, 'chat_messages', botMsgId), botMessageObj);
          } catch (err) {
            console.warn('Firestore setDoc bot message (handled):', err);
          }
        }, 800);
      }
    } catch (err) {
      console.error('Error sending chat message:', err);
    } finally {
      setIsSending(false);
    }
  };

  const handleDeleteMessage = async (msgId: string) => {
    onDeleteMessage?.(msgId);
    try {
      await deleteDoc(doc(db, 'chat_messages', msgId));
    } catch (err) {
      console.warn('Firestore deleteDoc (handled):', err);
    }
  };

  const handleConfirmClearChat = async () => {
    if (onClearChat) {
      onClearChat();
    } else {
      // Fallback local clear
      for (const msg of chatMessages) {
        try {
          await deleteDoc(doc(db, 'chat_messages', msg.id));
        } catch (e) {}
      }
    }
    setIsClearModalOpen(false);
  };

  const handleCopyText = (msgId: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(msgId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleQuickPreset = (presetText: string) => {
    setInputText(presetText);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-100 overflow-hidden font-sans">
      {/* Top Header Banner */}
      <div className="bg-gradient-to-r from-[#022623] via-[#044c45] to-[#022e2a] border-b-2 border-teal-500/60 px-6 py-5 shadow-xl text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-teal-950/80 border border-teal-500/40 text-teal-300 rounded-2xl shadow-inner">
              <MessageSquare className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold text-white tracking-tight drop-shadow-xs">
                  Live Chat
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-teal-500/20 border border-teal-500/40 text-teal-300 text-[11px] font-black uppercase">
                  <Sparkles className="w-3 h-3 text-amber-300" />
                  Realtime
                </span>
              </div>
              <p className="text-xs text-teal-100/90 mt-0.5">
                Saluran obrolan langsung antar petugas dan Sistem PLN ULP Baguala.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Sistem Online Presence Indicator Card */}
            <div className="flex items-center gap-3 bg-[#012521] border border-teal-700/80 rounded-2xl p-2.5 px-4 shadow-md">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-teal-950 text-teal-200 border-2 border-teal-400 flex items-center justify-center font-black text-xs shadow-xs">
                  <Bot className="w-5 h-5 text-teal-300" />
                </div>
                <span className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-[#012521] ${systemDotColorClass}`} />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-white">Sistem ULP</span>
                  <span className={`px-2 py-0.2 rounded-md text-[10px] font-black uppercase ${
                    isSystemOnline
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-teal-900/60 text-teal-200 border border-teal-700/60'
                  }`}>
                    {systemStatusInfo.label}
                  </span>
                </div>
                <p className="text-[11px] text-teal-100/80 font-medium">
                  {isSystemOnline
                    ? 'Sistem aktif memantau obrolan secara real-time.'
                    : 'Sistem AI Bot aktif menjawab pesan otomatis.'}
                </p>
              </div>
            </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Pengaturan Pesan Otomatis Button (Khusus User Owner) */}
            {isCurrentUserOwner && (
              <button
                onClick={() => setIsAutoReplyModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2.5 bg-[#012521] hover:bg-[#02312b] text-teal-200 border border-teal-500/60 rounded-xl text-xs font-extrabold transition-all cursor-pointer shadow-sm shrink-0 active:scale-95"
                title="Kelola Aturan Pesan Otomatis & FAQ Saat Sistem Offline"
              >
                <Settings className="w-4 h-4 text-teal-300" />
                <span className="hidden sm:inline">Pengaturan Pesan Otomatis</span>
                <span className="ml-1 px-1.5 py-0.2 bg-teal-400 text-slate-950 rounded-full text-[10px] font-black">
                  {autoReplyRules.filter((r) => r.isActive).length}
                </span>
              </button>
            )}

            {/* Pembersih Chat Button */}
            <button
              onClick={() => setIsClearModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-rose-950/70 hover:bg-rose-900/90 text-rose-200 border border-rose-500/50 rounded-xl text-xs font-extrabold transition-all cursor-pointer shadow-sm shrink-0 active:scale-95"
              title="Bersihkan Seluruh Obrolan Chat"
            >
              <Trash2 className="w-4 h-4 text-rose-400" />
              <span className="hidden sm:inline">Pembersih Chat</span>
            </button>
          </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-teal-500/30 relative z-10">
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            <span className="text-[10px] font-black text-teal-300 uppercase tracking-wider mr-1">Filter Topik:</span>
            {[
              { id: 'semua', label: 'Semua Pesan' },
              { id: 'gangguan', label: '⚡ Gangguan' },
              { id: 'teknis', label: '📅 Piket & Teknis' },
              { id: 'row', label: '🌳 ROW / Pohon' },
              { id: 'survey', label: '📋 Survey PB/PD' }
            ].map((tp) => (
              <button
                key={tp.id}
                onClick={() => setSelectedTopic(tp.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedTopic === tp.id
                    ? 'bg-gradient-to-r from-teal-400 to-emerald-400 text-slate-950 font-black shadow-md border border-teal-200'
                    : 'bg-[#012521] text-teal-200 border border-teal-700/60 hover:bg-[#02312b] hover:text-white'
                }`}
              >
                {tp.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative min-w-[220px]">
            <Search className="w-4 h-4 text-teal-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari kata kunci percakapan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-[#012521] border border-teal-600/80 rounded-xl text-xs font-bold text-white placeholder:text-teal-400/60 focus:outline-none focus:bg-[#02312b] focus:border-teal-300 transition-all shadow-inner"
            />
          </div>
        </div>
      </div>

      {/* Main Chat Workspace */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden p-4 gap-4">
        {/* Chat Messages Area */}
        <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col overflow-hidden">
          {/* Active Channel Info Bar */}
          <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-blue-100 text-blue-800 rounded-lg">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-xs font-extrabold text-slate-900">
                  Ruang Obrolan Live Chat ULP Baguala
                </h2>
                <p className="text-[11px] text-slate-500 font-medium">
                  Koordinasi langsung antar Petugas, Koordinator, dan Sistem ULP Baguala.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-[11px] font-bold text-slate-400">
                {filteredMessages.length} Pesan
              </span>
              <button
                onClick={() => setIsClearModalOpen(true)}
                className="text-xs font-bold text-rose-600 hover:text-rose-800 flex items-center gap-1 cursor-pointer transition-colors"
                title="Bersihkan Seluruh Chat"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="text-[11px]">Bersihkan</span>
              </button>
            </div>
          </div>

          {/* Messages Scroll View */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
            {filteredMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400 space-y-3">
                <div className="p-4 bg-slate-100 text-slate-400 rounded-full">
                  <MessageSquare className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-700">Belum Ada Percakapan</h3>
                  <p className="text-xs text-slate-500 max-w-sm mt-1">
                    Mulai obrolan dengan mengetik pesan di bawah atau gunakan tombol preset pertanyaan cepat.
                  </p>
                </div>
              </div>
            ) : (
              filteredMessages.map((msg) => {
                const isMe = msg.senderUsername?.toLowerCase() === currentUser.username?.toLowerCase();
                const isBot = msg.isBotReply === true;
                const isSystemMsg = isOwnerUser({ name: msg.senderName || '', username: msg.senderUsername, role: msg.senderRole });

                // Replace any leftover "Owner" in message text display
                const displaySenderRole = (msg.senderRole || '').toLowerCase().includes('owner') ? 'Sistem' : msg.senderRole;
                const displaySenderName = (msg.senderName || '').replace(/Owner/gi, 'Sistem');

                return (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-3 max-w-3xl ${
                      isMe ? 'ml-auto flex-row-reverse' : 'mr-auto'
                    }`}
                  >
                    {/* Avatar */}
                    {isBot ? (
                      <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center font-black text-xs shadow-md shrink-0 ring-2 ring-indigo-200">
                        <Bot className="w-5 h-5" />
                      </div>
                    ) : isSystemMsg ? (
                      <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-900 border-2 border-emerald-400 flex items-center justify-center font-black text-xs shadow-xs shrink-0">
                        <Bot className="w-5 h-5 text-emerald-600" />
                      </div>
                    ) : msg.senderAvatar ? (
                      <img
                        src={msg.senderAvatar}
                        alt={displaySenderName}
                        referrerPolicy="no-referrer"
                        className="w-9 h-9 rounded-full object-cover border border-slate-200 shadow-xs shrink-0"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-extrabold text-xs shadow-xs shrink-0">
                        {displaySenderName ? displaySenderName.substring(0, 2).toUpperCase() : 'US'}
                      </div>
                    )}

                    {/* Message Bubble Box */}
                    <div className={`group relative rounded-2xl p-4 space-y-1.5 shadow-xs max-w-xl transition-all ${
                      isMe
                        ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-tr-none'
                        : isBot
                        ? 'bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-tl-none border border-indigo-900/50 shadow-md'
                        : isSystemMsg
                        ? 'bg-gradient-to-br from-emerald-50 to-teal-50 text-slate-900 border border-emerald-200/80 rounded-tl-none'
                        : 'bg-white text-slate-800 border border-slate-200/80 rounded-tl-none'
                    }`}>
                      {/* Sender Name & Role Label */}
                      <div className="flex items-center justify-between gap-3 text-[11px]">
                        <div className="flex items-center gap-1.5">
                          <span className={`font-extrabold ${
                            isMe ? 'text-blue-100' : isBot ? 'text-indigo-300' : isSystemMsg ? 'text-emerald-950' : 'text-slate-900'
                          }`}>
                            {displaySenderName}
                          </span>
                          <span className={`px-1.5 py-0.2 rounded text-[9px] font-black uppercase ${
                            isMe
                              ? 'bg-white/20 text-white'
                              : isBot
                              ? 'bg-indigo-500/30 text-indigo-200 border border-indigo-400/30'
                              : isSystemMsg
                              ? 'bg-emerald-200/80 text-emerald-950'
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            {isBot ? 'Bot Assistant' : displaySenderRole}
                          </span>
                        </div>

                        {/* Timestamp */}
                        <span className={`text-[10px] ${
                          isMe ? 'text-blue-200' : isBot ? 'text-indigo-300' : 'text-slate-400'
                        }`}>
                          {new Date(msg.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIT
                        </span>
                      </div>

                      {/* Bot Tag Header if Bot */}
                      {isBot && (
                        <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-amber-400 bg-black/20 px-2.5 py-1 rounded-lg border border-amber-500/20">
                          <Sparkles className="w-3.0 h-3.0" />
                          <span>Balasan Otomatis AI Bot ULP Baguala (Sistem Offline)</span>
                        </div>
                      )}

                      {/* Main Message Content */}
                      <div className="text-xs leading-relaxed whitespace-pre-wrap break-words font-medium">
                        {msg.message}
                      </div>

                      {/* Action Hover Controls (Copy & Delete) */}
                      <div className={`opacity-0 group-hover:opacity-100 transition-opacity absolute -top-3 ${
                        isMe ? 'left-2' : 'right-2'
                      } bg-white border border-slate-200 rounded-lg p-0.5 shadow-sm flex items-center gap-0.5`}>
                        <button
                          onClick={() => handleCopyText(msg.id, msg.message)}
                          className="p-1 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded cursor-pointer"
                          title="Salin Pesan"
                        >
                          {copiedId === msg.id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        </button>
                        {(isMe || isCurrentUserOwner) && (
                          <button
                            onClick={() => handleDeleteMessage(msg.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded cursor-pointer"
                            title="Hapus Pesan"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Preset Topics Prompt Buttons */}
          <div className="px-4 py-2 bg-slate-100/80 border-t border-slate-200/80 flex items-center gap-2 overflow-x-auto scrollbar-none">
            <span className="text-[10px] font-bold text-slate-500 shrink-0 uppercase tracking-wider flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-500" />
              Tanya Cepat:
            </span>
            <button
              onClick={() => handleQuickPreset('Bagaimana SOP penanganan gangguan feeder trip?')}
              className="px-2.5 py-1 bg-white hover:bg-slate-200 border border-slate-200 rounded-lg text-[11px] font-bold text-slate-700 shrink-0 transition-colors cursor-pointer"
            >
              ⚡ SOP Gangguan Feeder
            </button>
            <button
              onClick={() => handleQuickPreset('Siapa saja tim piket Yantek yang bertugas hari ini?')}
              className="px-2.5 py-1 bg-white hover:bg-slate-200 border border-slate-200 rounded-lg text-[11px] font-bold text-slate-700 shrink-0 transition-colors cursor-pointer"
            >
              📅 Info Jadwal Piket
            </button>
            <button
              onClick={() => handleQuickPreset('Berapa SLA penyelesaian survey Pasang Baru (PB/PD)?')}
              className="px-2.5 py-1 bg-white hover:bg-slate-200 border border-slate-200 rounded-lg text-[11px] font-bold text-slate-700 shrink-0 transition-colors cursor-pointer"
            >
              📋 SLA Survey PB/PD
            </button>
            <button
              onClick={() => handleQuickPreset('Bagaimana prosedur pangkas pohon kritis ROW 20kV?')}
              className="px-2.5 py-1 bg-white hover:bg-slate-200 border border-slate-200 rounded-lg text-[11px] font-bold text-slate-700 shrink-0 transition-colors cursor-pointer"
            >
              🌳 Pangkas Pohon ROW
            </button>
          </div>

          {/* Chat Input Form */}
          <form onSubmit={(e) => handleSendMessage(e)} className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
            <input
              type="text"
              placeholder={
                isSystemOnline
                  ? 'Ketik pesan langsung untuk Sistem & tim...'
                  : 'Sistem sedang Offline. Ketik pesan (AI Bot akan membalas otomatis)...'
              }
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:bg-white focus:border-blue-500 transition-all placeholder:text-slate-400"
            />

            <button
              type="submit"
              disabled={!inputText.trim() || isSending}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-md shadow-blue-600/20 transition-all cursor-pointer flex items-center gap-2 shrink-0"
            >
              <span>Kirim</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>

        {/* Right Info Sidebar Panel */}
        <div className="w-full md:w-72 bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-4 shrink-0 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Bot className="w-4 h-4 text-indigo-600" />
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                Fitur Live Chat
              </h3>
            </div>

            {/* Auto Reply Management Card (Khusus User Owner) */}
            {isCurrentUserOwner && (
              <div className="p-3 bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200/80 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs font-black text-indigo-950">
                    <Bot className="w-3.5 h-3.5 text-indigo-600" />
                    Auto-Reply & FAQ
                  </span>
                  <span className="px-1.5 py-0.2 bg-indigo-600 text-white text-[10px] font-black rounded-md">
                    {autoReplyRules.filter((r) => r.isActive).length} Aktif
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 font-medium leading-tight">
                  Atur kata kunci & jawaban instan AI Bot untuk membalas pertanyaan petugas saat Sistem Offline.
                </p>
                <button
                  onClick={() => setIsAutoReplyModalOpen(true)}
                  className="w-full py-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[11px] rounded-lg transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>Kelola Pesan Otomatis</span>
                </button>
              </div>
            )}

            {/* Sistem Status Alert */}
            <div className={`p-3 rounded-xl border text-xs space-y-2.5 ${
              isSystemOnline
                ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                : 'bg-amber-50 border-amber-200 text-amber-950'
            }`}>
              <div className="flex items-center gap-2 font-black">
                <span className={`w-2 h-2 rounded-full ${isSystemOnline ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
                <span>Status Sistem: {isSystemOnline ? 'ONLINE' : 'OFFLINE'}</span>
              </div>
              <p className="text-[11px] leading-relaxed font-medium">
                {isSystemOnline
                  ? 'Sistem sedang aktif dipantau. Seluruh obrolan akan ditanggapi langsung oleh Sistem.'
                  : 'Sistem sedang offline. Pesan Anda akan terbalas otomatis oleh PLN Baguala AI Bot dan tetap tersimpan di inbox Sistem.'}
              </p>
            </div>

            {/* Quick Links Navigation */}
            <div className="space-y-2">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                Pintas Ke Modul:
              </label>
              {onSelectView && (
                <div className="space-y-1">
                  <button
                    onClick={() => onSelectView('gangguan')}
                    className="w-full p-2 bg-slate-50 hover:bg-slate-100 rounded-xl text-left text-xs font-bold text-slate-700 flex items-center justify-between cursor-pointer transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <Flame className="w-3.5 h-3.5 text-rose-500" />
                      Laporan Gangguan
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  <button
                    onClick={() => onSelectView('jadwal_piket')}
                    className="w-full p-2 bg-slate-50 hover:bg-slate-100 rounded-xl text-left text-xs font-bold text-slate-700 flex items-center justify-between cursor-pointer transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-blue-500" />
                      Jadwal Piket Petugas
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  <button
                    onClick={() => onSelectView('survey_pb_pd')}
                    className="w-full p-2 bg-slate-50 hover:bg-slate-100 rounded-xl text-left text-xs font-bold text-slate-700 flex items-center justify-between cursor-pointer transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5 text-emerald-500" />
                      Survey PB / PD
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-[10px] text-slate-500 text-center font-bold">
            Sistem Komunikasi Operasional ULP Baguala
          </div>
        </div>
      </div>

      {/* Modal Confirmation Pembersih Chat */}
      {isClearModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
              <Trash2 className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-black text-slate-900">
                Pembersih Chat Live
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Apakah Anda yakin ingin membersihkan seluruh percakapan di ruang Live Chat ini? Semua riwayat obrolan akan dihapus secara permanen.
              </p>
            </div>
            <div className="flex items-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsClearModalOpen(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmClearChat}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold rounded-xl transition-all shadow-md shadow-rose-600/20 cursor-pointer"
              >
                Ya, Bersihkan Chat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Pengaturan Pesan Otomatis (FAQ Auto-Reply) */}
      {isAutoReplyModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 text-white p-5 px-6 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-500/20 border border-indigo-400/30 rounded-2xl text-indigo-300">
                  <Bot className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold tracking-tight flex items-center gap-2">
                    <span>Pengaturan Pesan Otomatis</span>
                    <span className="px-2 py-0.5 rounded-full bg-indigo-500/30 border border-indigo-400/30 text-indigo-200 text-[10px] font-black uppercase">
                      FAQ Bot
                    </span>
                  </h3>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Kelola respons instan AI Bot saat Sistem ULP Baguala sedang Offline.
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setIsAutoReplyModalOpen(false);
                  handleResetForm();
                }}
                className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
              {/* Active Rules Info Banner */}
              <div className="bg-indigo-50/80 border border-indigo-200/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-indigo-950">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs font-black">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    <span>Mekanisme Pencocokan Pesan Otomatis</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Saat pesan masuk dari petugas saat Sistem sedang Offline, AI Bot akan memindai kata kunci (keywords) yang aktif. Jika pesan mencocokkan kata kunci, balasan instan di bawah ini akan dikirim secara otomatis.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (isFormOpen) {
                      handleResetForm();
                    } else {
                      setIsFormOpen(true);
                      setEditingRule(null);
                      setRuleTitle('');
                      setRuleTopic('umum');
                      setRuleKeywordsStr('');
                      setRuleResponse('');
                      setRuleIsActive(true);
                    }
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-extrabold text-xs rounded-xl shadow-sm transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
                >
                  {isFormOpen ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  <span>{isFormOpen ? 'Batal Tambah' : 'Tambah Aturan FAQ'}</span>
                </button>
              </div>

              {/* Form Input Rule (If Open) */}
              {isFormOpen && (
                <form onSubmit={handleSaveRuleSubmit} className="bg-slate-50 border-2 border-indigo-200 rounded-2xl p-5 space-y-4 animate-in fade-in-50 duration-200">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                      <Edit3 className="w-4 h-4 text-indigo-600" />
                      {editingRule ? 'Edit Aturan Pesan Otomatis' : 'Buat Aturan Pesan Otomatis Baru'}
                    </h4>
                    <span className="text-[11px] font-bold text-slate-400">
                      ID: {editingRule ? editingRule.id : 'Baru'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2 space-y-1">
                      <label className="text-[11px] font-extrabold text-slate-700">Judul / Pertanyaan FAQ *</label>
                      <input
                        type="text"
                        required
                        placeholder="Contoh: SOP Penanganan Trafo Overload"
                        value={ruleTitle}
                        onChange={(e) => setRuleTitle(e.target.value)}
                        className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-extrabold text-slate-700">Kategori / Topik *</label>
                      <select
                        value={ruleTopic}
                        onChange={(e) => setRuleTopic(e.target.value as any)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-500"
                      >
                        <option value="umum">💬 Umum</option>
                        <option value="gangguan">⚡ Gangguan</option>
                        <option value="teknis">📅 Piket & Teknis</option>
                        <option value="row">🌳 ROW / Pohon</option>
                        <option value="survey">📋 Survey PB/PD</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-extrabold text-slate-700">Kata Kunci (Keywords) *</label>
                      <span className="text-[10px] text-slate-500 font-medium">Pisahkan dengan koma (,)</span>
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: trafo, overload, panas, pembebanan, pendinginan"
                      value={ruleKeywordsStr}
                      onChange={(e) => setRuleKeywordsStr(e.target.value)}
                      className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-extrabold text-slate-700">Pesan Balasan Otomatis *</label>
                      <span className="text-[10px] text-indigo-600 font-bold">Gunakan @username atau @name</span>
                    </div>
                    <textarea
                      rows={4}
                      required
                      placeholder="Ketik template jawaban otomatis yang akan dikirim oleh AI Bot..."
                      value={ruleResponse}
                      onChange={(e) => setRuleResponse(e.target.value)}
                      className="w-full p-3 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-indigo-500 leading-relaxed font-mono"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={ruleIsActive}
                        onChange={(e) => setRuleIsActive(e.target.checked)}
                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-xs font-bold text-slate-700">Status Aturan Aktif</span>
                    </label>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleResetForm}
                        className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                      >
                        Batal
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold rounded-xl transition-all shadow-md shadow-indigo-600/20 cursor-pointer"
                      >
                        {editingRule ? 'Simpan Perubahan' : 'Tambah Aturan'}
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {/* List of Configured Rules */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-indigo-600" />
                    Daftar Aturan Pesan Otomatis ({autoReplyRules.length})
                  </h4>
                </div>

                {autoReplyRules.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-300 rounded-2xl space-y-2">
                    <Bot className="w-8 h-8 text-slate-400 mx-auto" />
                    <p className="text-xs font-bold text-slate-600">Belum ada aturan pesan otomatis khusus.</p>
                    <p className="text-[11px] text-slate-400">Klik tombol "Tambah Aturan FAQ" di atas untuk membuat kata kunci pertama.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {autoReplyRules.map((rule) => (
                      <div
                        key={rule.id}
                        className={`p-4 rounded-2xl border transition-all ${
                          rule.isActive
                            ? 'bg-white border-slate-200 shadow-xs hover:border-indigo-300'
                            : 'bg-slate-50 border-slate-200 opacity-60'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 pb-2.5 border-b border-slate-100">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-extrabold text-slate-900">{rule.title}</span>
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${
                                rule.topic === 'gangguan' ? 'bg-rose-100 text-rose-800' :
                                rule.topic === 'teknis' ? 'bg-blue-100 text-blue-800' :
                                rule.topic === 'row' ? 'bg-emerald-100 text-emerald-800' :
                                rule.topic === 'survey' ? 'bg-amber-100 text-amber-800' :
                                'bg-indigo-100 text-indigo-800'
                              }`}>
                                {rule.topic || 'umum'}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[10px] font-bold text-slate-400 uppercase">Kata Kunci:</span>
                              {rule.keywords && rule.keywords.map((kw, idx) => (
                                <span key={idx} className="px-2 py-0.2 bg-slate-100 border border-slate-200 rounded-md text-[10px] font-bold text-slate-700">
                                  {kw}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                            {/* Toggle Switch */}
                            <button
                              type="button"
                              onClick={() => handleToggleRuleActive(rule)}
                              className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-extrabold transition-all cursor-pointer ${
                                rule.isActive
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                  : 'bg-slate-200 text-slate-600 border border-slate-300'
                              }`}
                            >
                              {rule.isActive ? <ToggleRight className="w-4 h-4 text-emerald-600" /> : <ToggleLeft className="w-4 h-4 text-slate-400" />}
                              <span>{rule.isActive ? 'Aktif' : 'Nonaktif'}</span>
                            </button>

                            {/* Edit Button */}
                            <button
                              type="button"
                              onClick={() => handleStartEditRule(rule)}
                              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer"
                              title="Edit Aturan"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete Button */}
                            <button
                              type="button"
                              onClick={() => onDeleteAutoReplyRule?.(rule.id)}
                              className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors cursor-pointer"
                              title="Hapus Aturan"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Response Text Preview */}
                        <div className="mt-2.5 p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs text-slate-700 whitespace-pre-wrap font-sans leading-relaxed">
                          {rule.response}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Interactive Live Testing Box */}
              <div className="p-5 bg-slate-900 text-white rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Play className="w-4 h-4 text-emerald-400" />
                    <h4 className="text-xs font-black uppercase tracking-wider text-emerald-400">
                      Uji Coba Respons Otomatis AI Bot
                    </h4>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">Tes Simulasi Kata Kunci</span>
                </div>

                <form onSubmit={handleTestAutoReply} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Ketik pesan tes (contoh: 'bagaimana jadwal piket?')..."
                    value={testInput}
                    onChange={(e) => setTestInput(e.target.value)}
                    className="flex-1 px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-emerald-500 placeholder:text-slate-500"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer shrink-0"
                  >
                    Uji Respons
                  </button>
                </form>

                {testResult && (
                  <div className="p-3 bg-slate-800/90 border border-slate-700 rounded-xl space-y-1.5 animate-in fade-in-50 duration-150">
                    <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{testResult.matchedRuleTitle}</span>
                    </div>
                    <div className="text-xs text-slate-200 whitespace-pre-wrap leading-relaxed font-sans">
                      {testResult.text}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 px-6 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setIsAutoReplyModalOpen(false);
                  handleResetForm();
                }}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
              >
                Tutup Pengaturan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

