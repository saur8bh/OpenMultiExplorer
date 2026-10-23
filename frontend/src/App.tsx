import React, { useState, useEffect, useRef } from 'react';
import {
  Folder, File, HardDrive, Cloud, Server, Database, Box, Flame,
  ArrowRight, ArrowLeft, RefreshCw, Upload, Download, Trash2,
  FolderPlus, Edit3, Shield, Search, ArrowLeftRight, Settings,
  CheckCircle, AlertCircle, Play, Pause, X, ChevronRight, Lock, Unlock,
  Sliders, Plus, Check, ExternalLink, Scissors, Copy, Clipboard,
  Share2, Info, Eye, Monitor, Layout, Columns, ChevronDown, Globe
} from 'lucide-react';

interface StorageItem {
  name: string;
  path: string;
  is_dir: boolean;
  size: number;
  modified: string;
  is_encrypted: boolean;
  display_name?: string;
  account_id?: string;
  account_name?: string;
  account_type?: string;
  public_link?: string;
}

interface Account {
  id: string;
  name: string;
  type: string;
  display_name?: string;
  subtitle?: string;
  color?: string;
  email?: string;
  endpoint_url?: string;
  bucket?: string;
  url?: string;
  host?: string;
}

interface TabInfo {
  id: string;
  title: string;
  accountId: string;
  path: string;
  isNewTab?: boolean;
}

interface ProviderSchema {
  type: string;
  name: string;
  category: string;
  icon: string;
  verified?: boolean;
  description: string;
  fields: Array<{
    key: string;
    label: string;
    type: string;
    default?: any;
    required?: boolean;
  }>;
}

interface TransferJob {
  id: string;
  source_account_name: string;
  source_path: string;
  target_account_name: string;
  target_path: string;
  filename: string;
  size: number;
  bytes_transferred: number;
  status: 'pending' | 'transferring' | 'paused' | 'completed' | 'failed' | 'cancelled';
  speed_bps: number;
  progress: number;
  error_message?: string;
  encrypt_on_upload: boolean;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Exact Verified Shield Badge from user's image (mint squircle + emerald shield + checkmark)
function VerifiedShieldIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
    >
      <rect width="24" height="24" rx="6.5" fill="#ecfdf5" />
      <path
        d="M12 4.6L5.8 7.5V11.5C5.8 15.6 8.5 19.3 12 20.4C15.5 19.3 18.2 15.6 18.2 11.5V7.5L12 4.6Z"
        stroke="#059669"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.6 12.1L11.2 13.7L14.7 10.2"
        stroke="#059669"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Unique OpenMultiExplorer App Logo (Cyber squircle + multi-cloud nodes + dual-pane folder + vault diamond)
function AppLogo({ size = 26 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 128 128"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
    >
      <defs>
        <linearGradient id="logoBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0a0f1d" />
          <stop offset="50%" stopColor="#0f172a" />
          <stop offset="100%" stopColor="#020617" />
        </linearGradient>
        <linearGradient id="logoBorder" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="50%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
        <linearGradient id="logoCloud" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#2563eb" />
        </linearGradient>
        <linearGradient id="logoFront" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#0284c7" />
        </linearGradient>
      </defs>

      <rect x="5" y="5" width="118" height="118" rx="28" fill="url(#logoBg)" stroke="url(#logoBorder)" strokeWidth="3" />
      <path d="M 28 44 A 42 42 0 0 1 100 44" fill="none" stroke="#38bdf8" strokeWidth="2.5" strokeDasharray="4 3" opacity="0.6" />
      <path d="M 100 84 A 42 42 0 0 1 28 84" fill="none" stroke="#6366f1" strokeWidth="2.5" strokeDasharray="4 3" opacity="0.6" />
      <circle cx="28" cy="44" r="5" fill="#38bdf8" />
      <circle cx="100" cy="44" r="5" fill="#818cf8" />
      <circle cx="100" cy="84" r="4.5" fill="#38bdf8" />
      <circle cx="28" cy="84" r="4.5" fill="#34d399" />
      <path d="M 44 48 A 14 14 0 0 1 68 40 A 18 18 0 0 1 92 48 A 12 12 0 0 1 92 70 L 40 70 A 12 12 0 0 1 44 48 Z" fill="url(#logoCloud)" opacity="0.9" />
      <path d="M 36 56 L 52 56 L 58 62 L 92 62 C 95 62 97 64 97 67 L 97 74 L 31 74 L 31 61 C 31 58 33 56 36 56 Z" fill="#0369a1" />
      <path d="M 31 71 C 31 68 33 66 36 66 L 92 66 C 95 66 97 68 97 71 L 95 94 C 95 97 93 99 90 99 L 38 99 C 35 99 33 97 33 94 Z" fill="url(#logoFront)" />
      <g transform="translate(64, 82)">
        <path d="M 0 -8 L 8 -4 L 8 2 C 8 7 4 10 0 12 C -4 10 -8 7 -8 2 L -8 -4 Z" fill="#0f172a" stroke="#ffffff" strokeWidth="1.6" />
        <path d="M -3 1 L -1 3 L 4 -2" fill="none" stroke="#38bdf8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  );
}

export default function App() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [supportedProviders, setSupportedProviders] = useState<ProviderSchema[]>([]);
  
  // Settings & Customization State (persisted to localStorage)
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [settings, setSettings] = useState<{
    defaultSortBy: 'modified' | 'name' | 'size';
    defaultSortOrder: 'asc' | 'desc';
    defaultViewMode: 'single' | 'dual';
    speedLimitKbps: number;
  }>(() => {
    try {
      const s = localStorage.getItem('openmultiexplorer_settings');
      if (s) return JSON.parse(s);
    } catch {}
    return {
      defaultSortBy: 'modified',
      defaultSortOrder: 'desc',
      defaultViewMode: 'single',
      speedLimitKbps: 0
    };
  });

  // Tab items cache reference to eliminate re-fetching on tab switching
  const tabCacheRef = useRef<Record<string, StorageItem[]>>({});

  // View mode: 'single' (One Panel) or 'dual' (Two Panels)
  const [viewMode, setViewMode] = useState<'single' | 'dual'>(settings.defaultViewMode || 'single');
  const [showViewDropdown, setShowViewDropdown] = useState<boolean>(false);

  // Tabs for Left Pane
  const [leftTabs, setLeftTabs] = useState<TabInfo[]>([
    { id: 'tab-1', title: 'MediaFire', accountId: '', path: '/' }
  ]);
  const [activeLeftTabId, setActiveLeftTabId] = useState<string>('tab-1');

  // Tabs for Right Pane (when in Dual mode)
  const [rightTabs, setRightTabs] = useState<TabInfo[]>([
    { id: 'tab-r1', title: 'This PC', accountId: 'local-pc', path: '/' }
  ]);
  const [activeRightTabId, setActiveRightTabId] = useState<string>('tab-r1');

  // Active Pane State
  const activeLeftTab = leftTabs.find(t => t.id === activeLeftTabId) || leftTabs[0];
  const activeRightTab = rightTabs.find(t => t.id === activeRightTabId) || rightTabs[0];

  const leftAccountId = activeLeftTab?.accountId || '';
  const leftPath = activeLeftTab?.path || '/';
  const [leftItems, setLeftItems] = useState<StorageItem[]>([]);
  const [leftSelected, setLeftSelected] = useState<string[]>([]);
  const [leftFilter, setLeftFilter] = useState<string>('');
  const [leftLoading, setLeftLoading] = useState<boolean>(false);
  const [leftSortBy, setLeftSortBy] = useState<'modified' | 'name' | 'size'>(settings.defaultSortBy || 'modified');
  const [leftSortOrder, setLeftSortOrder] = useState<'asc' | 'desc'>(settings.defaultSortOrder || 'desc');

  const rightAccountId = activeRightTab?.accountId || '';
  const rightPath = activeRightTab?.path || '/';
  const [rightItems, setRightItems] = useState<StorageItem[]>([]);
  const [rightSelected, setRightSelected] = useState<string[]>([]);
  const [rightFilter, setRightFilter] = useState<string>('');
  const [rightLoading, setRightLoading] = useState<boolean>(false);
  const [rightSortBy, setRightSortBy] = useState<'modified' | 'name' | 'size'>(settings.defaultSortBy || 'modified');
  const [rightSortOrder, setRightSortOrder] = useState<'asc' | 'desc'>(settings.defaultSortOrder || 'desc');

  // Encryption Key / Master Passphrase
  const [passphrase, setPassphrase] = useState<string>('MySecureCloudPassphrase2026');
  const [encryptByDefault, setEncryptByDefault] = useState<boolean>(false);

  // Transfers Drawer State
  const [transfers, setTransfers] = useState<TransferJob[]>([]);
  const [isTransferDrawerOpen, setIsTransferDrawerOpen] = useState<boolean>(false);
  const [speedLimitKbps, setSpeedLimitKbps] = useState<number>(0);

  // Modals
  const [showAccountModal, setShowAccountModal] = useState<boolean>(false);
  const [showSyncModal, setShowSyncModal] = useState<boolean>(false);
  const [showSearchModal, setShowSearchModal] = useState<boolean>(false);
  const [showCryptoModal, setShowCryptoModal] = useState<boolean>(false);
  const [showNewFolderModal, setShowNewFolderModal] = useState<{ open: boolean; pane: 'left' | 'right' }>({ open: false, pane: 'left' });
  const [newFolderName, setNewFolderName] = useState<string>('');

  // Context Menu State
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    item: StorageItem | null;
    pane: 'left' | 'right';
  }>({ visible: false, x: 0, y: 0, item: null, pane: 'left' });

  // Clipboard State (for Cut / Copy / Paste)
  const [clipboard, setClipboard] = useState<{
    action: 'copy' | 'cut';
    items: StorageItem[];
    sourceAccountId: string;
    sourcePath: string;
  } | null>(null);

  // Rename Modal State
  const [renameModal, setRenameModal] = useState<{
    open: boolean;
    item: StorageItem | null;
    newName: string;
    pane: 'left' | 'right';
  }>({ open: false, item: null, newName: '', pane: 'left' });

  // Properties Modal State
  const [propertiesModal, setPropertiesModal] = useState<{
    open: boolean;
    item: StorageItem | null;
    pane: 'left' | 'right';
  }>({ open: false, item: null, pane: 'left' });

  // Share Link Modal State (Air Explorer Style)
  const [shareModal, setShareModal] = useState<{
    open: boolean;
    items: StorageItem[];
    links: string[];
    copied: boolean;
    loading: boolean;
  }>({ open: false, items: [], links: [], copied: false, loading: false });

  // Add Account Wizard State
  const [selectedProviderType, setSelectedProviderType] = useState<string>('mediafire');
  const [accountFormData, setAccountFormData] = useState<Record<string, any>>({ name: '' });

  // Sync Wizard State
  const [syncMode, setSyncMode] = useState<string>('mirror');
  const [syncDirection, setSyncDirection] = useState<'left-to-right' | 'right-to-left'>('left-to-right');
  const [syncAnalysis, setSyncAnalysis] = useState<any>(null);
  const [syncAnalyzing, setSyncAnalyzing] = useState<boolean>(false);

  // Search State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState<boolean>(false);

  // New Tab Dashboard Search State
  const [dashboardSearch, setDashboardSearch] = useState<string>('');

  // Mouse Selection Marquee State
  const [marquee, setMarquee] = useState<{
    active: boolean;
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
    pane: 'left' | 'right';
  } | null>(null);

  // Notifications / Toast
  const [notification, setNotification] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  const fileInputRefLeft = useRef<HTMLInputElement>(null);
  const fileInputRefRight = useRef<HTMLInputElement>(null);

  // Mouse Drag Multi-Selection References
  const dragRef = useRef<{
    active: boolean;
    isDragging: boolean;
    startX: number;
    startY: number;
    pane: 'left' | 'right';
    clickedItemName: string | null;
    initialSelected: string[];
    ctrlKey: boolean;
  } | null>(null);
  const justDraggedRef = useRef<boolean>(false);
  const lastClickedItemRef = useRef<{ name: string; pane: 'left' | 'right' } | null>(null);

  const notify = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
    setNotification({ text, type });
    setTimeout(() => setNotification(null), 3500);
  };

  // Global mouse handlers: Lasso drag-to-select, shortcuts, context menu close
  useEffect(() => {
    const handleGlobalClick = () => {
      setContextMenu(prev => (prev.visible ? { ...prev, visible: false } : prev));
      setShowViewDropdown(false);
    };

    const handleWindowMouseMove = (e: MouseEvent) => {
      const drag = dragRef.current;
      if (!drag || !drag.active) return;

      const dx = e.clientX - drag.startX;
      const dy = e.clientY - drag.startY;
      const dist = Math.hypot(dx, dy);

      // 4px threshold to distinguish click vs drag
      if (!drag.isDragging) {
        if (dist >= 4) {
          drag.isDragging = true;
          window.getSelection()?.removeAllRanges();
        } else {
          return;
        }
      }

      e.preventDefault();

      setMarquee({
        active: true,
        startX: drag.startX,
        startY: drag.startY,
        currentX: e.clientX,
        currentY: e.clientY,
        pane: drag.pane
      });

      const left = Math.min(drag.startX, e.clientX);
      const top = Math.min(drag.startY, e.clientY);
      const right = Math.max(drag.startX, e.clientX);
      const bottom = Math.max(drag.startY, e.clientY);

      // Hit-testing rows for collision with the lasso rectangle
      const rows = document.querySelectorAll(`.file-row[data-pane="${drag.pane}"]`);
      const intersectedNames: string[] = [];
      rows.forEach(r => {
        const rect = r.getBoundingClientRect();
        const intersects = !(rect.left > right || rect.right < left || rect.top > bottom || rect.bottom < top);
        if (intersects) {
          const name = r.getAttribute('data-name');
          if (name) intersectedNames.push(name);
        }
      });

      let finalSelected: string[];
      if (drag.ctrlKey) {
        finalSelected = Array.from(new Set([...drag.initialSelected, ...intersectedNames]));
      } else {
        finalSelected = intersectedNames;
      }

      if (drag.pane === 'left') {
        setLeftSelected(finalSelected);
      } else {
        setRightSelected(finalSelected);
      }
    };

    const handleWindowMouseUp = (e: MouseEvent) => {
      const drag = dragRef.current;
      if (drag && drag.active) {
        if (drag.isDragging) {
          justDraggedRef.current = true;
          setTimeout(() => {
            justDraggedRef.current = false;
          }, 150);
        } else {
          // Pure click on blank table whitespace (not dragging and not on any row)
          if (!drag.clickedItemName && !drag.ctrlKey) {
            const target = e.target as HTMLElement;
            if (!target.closest('.file-row') && !target.closest('button') && !target.closest('input')) {
              if (drag.pane === 'left') setLeftSelected([]);
              else setRightSelected([]);
            }
          }
        }
        drag.active = false;
      }
      dragRef.current = null;
      setMarquee(null);
    };

    const handleDragStart = (e: DragEvent) => {
      if (dragRef.current?.active) {
        e.preventDefault();
      }
    };

    // Keyboard Shortcuts: Ctrl+A / Cmd+A to select all files in active pane
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
        const activeEl = document.activeElement;
        if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) {
          return;
        }
        e.preventDefault();
        setLeftSelected(leftItems.map(i => i.name));
      }
    };

    window.addEventListener('click', handleGlobalClick);
    window.addEventListener('mousemove', handleWindowMouseMove);
    window.addEventListener('mouseup', handleWindowMouseUp);
    window.addEventListener('dragstart', handleDragStart);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', handleGlobalClick, true);

    return () => {
      window.removeEventListener('click', handleGlobalClick);
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
      window.removeEventListener('dragstart', handleDragStart);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', handleGlobalClick, true);
    };
  }, [leftItems, rightItems]);

  // Initial Data Fetch
  useEffect(() => {
    fetchAccounts();
    fetchSupportedProviders();
  }, []);

  const fetchAccounts = async () => {
    try {
      const res = await fetch('/api/accounts');
      const data: Account[] = await res.json();
      setAccounts(data);

      if (data.length > 0) {
        // Find user's added cloud account (e.g. MediaFire or S3), or This PC
        const primaryAcc = data.find(a => a.type === 'mediafire') || data[0];
        setLeftTabs(prev => {
          if (prev.length > 0 && !prev[0].accountId) {
            return [{
              ...prev[0],
              accountId: primaryAcc.id,
              title: primaryAcc.name,
              isNewTab: false
            }];
          }
          return prev;
        });

        const secondaryAcc = data.find(a => a.id === 'local-pc') || data[0];
        setRightTabs(prev => {
          if (prev.length > 0 && !prev[0].accountId) {
            return [{
              ...prev[0],
              accountId: secondaryAcc.id,
              title: secondaryAcc.name,
              isNewTab: false
            }];
          }
          return prev;
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSupportedProviders = async () => {
    try {
      const res = await fetch('/api/providers/supported');
      const data = await res.json();
      setSupportedProviders(data);
    } catch (err) {
      console.error(err);
    }
  };

  // Poll Transfers from backend
  useEffect(() => {
    const timer = setInterval(async () => {
      try {
        const res = await fetch('/api/transfers');
        const data = await res.json();
        const serverJobs: TransferJob[] = data.jobs || [];
        setTransfers(prev => {
          // Keep active client-side download jobs
          const clientDlJobs = prev.filter(j => j.id.startsWith('dl-') && j.status === 'transferring');
          const combined = [...clientDlJobs];
          serverJobs.forEach(sj => {
            if (!combined.some(c => c.id === sj.id)) {
              combined.push(sj);
            }
          });
          return combined;
        });
      } catch (err) {
        // ignore
      }
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch Left Items with in-memory caching per tab+folder to eliminate unnecessary reloads
  const refreshLeft = async (force: boolean = false) => {
    if (!leftAccountId || activeLeftTab?.isNewTab) return;

    const cacheKey = `${activeLeftTabId}:${leftAccountId}:${leftPath}`;
    if (!force && tabCacheRef.current[cacheKey]) {
      setLeftItems(tabCacheRef.current[cacheKey]);
      setLeftLoading(false);
      return;
    }

    setLeftLoading(true);
    try {
      const p = new URLSearchParams({ account_id: leftAccountId, path: leftPath });
      if (passphrase) p.append('passphrase', passphrase);
      const res = await fetch(`/api/files/list?${p.toString()}`);
      const data = await res.json();
      const items: StorageItem[] = data.items || [];
      tabCacheRef.current[cacheKey] = items;
      setLeftItems(items);
      setLeftSelected([]);
    } catch (err: any) {
      notify(`Failed to list pane: ${err.message}`, 'error');
    } finally {
      setLeftLoading(false);
    }
  };

  // Fetch Right Items with in-memory caching per tab+folder
  const refreshRight = async (force: boolean = false) => {
    if (!rightAccountId || activeRightTab?.isNewTab) return;

    const cacheKey = `${activeRightTabId}:${rightAccountId}:${rightPath}`;
    if (!force && tabCacheRef.current[cacheKey]) {
      setRightItems(tabCacheRef.current[cacheKey]);
      setRightLoading(false);
      return;
    }

    setRightLoading(true);
    try {
      const p = new URLSearchParams({ account_id: rightAccountId, path: rightPath });
      if (passphrase) p.append('passphrase', passphrase);
      const res = await fetch(`/api/files/list?${p.toString()}`);
      const data = await res.json();
      const items: StorageItem[] = data.items || [];
      tabCacheRef.current[cacheKey] = items;
      setRightItems(items);
      setRightSelected([]);
    } catch (err: any) {
      notify(`Failed to list pane: ${err.message}`, 'error');
    } finally {
      setRightLoading(false);
    }
  };

  useEffect(() => { refreshLeft(false); }, [leftAccountId, leftPath, activeLeftTabId]);
  useEffect(() => { refreshRight(false); }, [rightAccountId, rightPath, activeRightTabId]);

  // Tab management helpers
  const handleAddNewTab = (pane: 'left' | 'right') => {
    const newId = 'tab-' + Math.random().toString(36).substring(2, 7);
    const newTabItem: TabInfo = {
      id: newId,
      title: 'New Tab',
      accountId: '',
      path: '/',
      isNewTab: true
    };
    if (pane === 'left') {
      setLeftTabs(prev => [...prev, newTabItem]);
      setActiveLeftTabId(newId);
    } else {
      setRightTabs(prev => [...prev, newTabItem]);
      setActiveRightTabId(newId);
    }
  };

  const handleCloseTab = (tabId: string, pane: 'left' | 'right', e: React.MouseEvent) => {
    e.stopPropagation();
    if (pane === 'left') {
      if (leftTabs.length <= 1) return;
      const remaining = leftTabs.filter(t => t.id !== tabId);
      setLeftTabs(remaining);
      if (activeLeftTabId === tabId) {
        setActiveLeftTabId(remaining[0].id);
      }
    } else {
      if (rightTabs.length <= 1) return;
      const remaining = rightTabs.filter(t => t.id !== tabId);
      setRightTabs(remaining);
      if (activeRightTabId === tabId) {
        setActiveRightTabId(remaining[0].id);
      }
    }
  };

  const selectAccountForActiveTab = (accId: string, pane: 'left' | 'right') => {
    const acc = accounts.find(a => a.id === accId);
    const title = acc?.name || 'Account';
    if (pane === 'left') {
      setLeftTabs(prev => prev.map(t => t.id === activeLeftTabId ? {
        ...t,
        accountId: accId,
        title,
        path: '/',
        isNewTab: false
      } : t));
    } else {
      setRightTabs(prev => prev.map(t => t.id === activeRightTabId ? {
        ...t,
        accountId: accId,
        title,
        path: '/',
        isNewTab: false
      } : t));
    }
  };

  // Navigate folder
  const handleItemDoubleClick = (item: StorageItem, pane: 'left' | 'right') => {
    if (!item.is_dir) {
      handleDownloadDirect(item, pane);
      return;
    }
    if (pane === 'left') {
      setLeftTabs(prev => prev.map(t => t.id === activeLeftTabId ? { ...t, path: item.path, title: item.name } : t));
    } else {
      setRightTabs(prev => prev.map(t => t.id === activeRightTabId ? { ...t, path: item.path, title: item.name } : t));
    }
  };

  const handleNavigateUp = (pane: 'left' | 'right') => {
    const current = pane === 'left' ? leftPath : rightPath;
    if (current === '/' || !current) return;
    const parts = current.split('/').filter(Boolean);
    parts.pop();
    const newPath = parts.length === 0 ? '/' : `/${parts.join('/')}`;
    const newTitle = parts.length === 0 
      ? (accounts.find(a => a.id === (pane === 'left' ? leftAccountId : rightAccountId))?.name || 'Home')
      : parts[parts.length - 1];

    if (pane === 'left') {
      setLeftTabs(prev => prev.map(t => t.id === activeLeftTabId ? { ...t, path: newPath, title: newTitle } : t));
    } else {
      setRightTabs(prev => prev.map(t => t.id === activeRightTabId ? { ...t, path: newPath, title: newTitle } : t));
    }
  };

  // Sorting function (Modified descending by default!)
  const sortItems = (items: StorageItem[], sortBy: 'modified' | 'name' | 'size', sortOrder: 'asc' | 'desc') => {
    return [...items].sort((a, b) => {
      // Directories always on top
      if (a.is_dir !== b.is_dir) return a.is_dir ? -1 : 1;
      let cmp = 0;
      if (sortBy === 'name') {
        cmp = a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
      } else if (sortBy === 'size') {
        cmp = a.size - b.size;
      } else { // modified
        cmp = (a.modified || '').localeCompare(b.modified || '');
      }
      return sortOrder === 'desc' ? -cmp : cmp;
    });
  };

  const handleSortClick = (column: 'modified' | 'name' | 'size', pane: 'left' | 'right') => {
    if (pane === 'left') {
      if (leftSortBy === column) {
        setLeftSortOrder(leftSortOrder === 'asc' ? 'desc' : 'asc');
      } else {
        setLeftSortBy(column);
        setLeftSortOrder(column === 'modified' ? 'desc' : 'asc');
      }
    } else {
      if (rightSortBy === column) {
        setRightSortOrder(rightSortOrder === 'asc' ? 'desc' : 'asc');
      } else {
        setRightSortBy(column);
        setRightSortOrder(column === 'modified' ? 'desc' : 'asc');
      }
    }
  };

  // Transfer Action: Left -> Right
  const transferLeftToRight = async (encrypt: boolean = false) => {
    if (leftSelected.length === 0) {
      notify('Select one or more items to transfer', 'info');
      return;
    }
    const selectedItems = leftItems.filter(i => leftSelected.includes(i.name) && !i.is_dir);
    for (const item of selectedItems) {
      await fetch('/api/transfers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source_account_id: leftAccountId,
          source_path: item.path,
          target_account_id: rightAccountId,
          target_path: rightPath,
          filename: item.name,
          size: item.size,
          encrypt_on_upload: encrypt || encryptByDefault,
          passphrase: passphrase
        })
      });
    }
    notify(`Queued ${selectedItems.length} transfer(s) to Right Pane`, 'success');
    setIsTransferDrawerOpen(true);
  };

  // Transfer Action: Right -> Left
  const transferRightToLeft = async (encrypt: boolean = false) => {
    if (rightSelected.length === 0) {
      notify('Select one or more items to transfer', 'info');
      return;
    }
    const selectedItems = rightItems.filter(i => rightSelected.includes(i.name) && !i.is_dir);
    for (const item of selectedItems) {
      await fetch('/api/transfers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source_account_id: rightAccountId,
          source_path: item.path,
          target_account_id: leftAccountId,
          target_path: leftPath,
          filename: item.name,
          size: item.size,
          encrypt_on_upload: encrypt || encryptByDefault,
          passphrase: passphrase
        })
      });
    }
    notify(`Queued ${selectedItems.length} transfer(s) to Left Pane`, 'success');
    setIsTransferDrawerOpen(true);
  };

  // New Folder
  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    const pane = showNewFolderModal.pane;
    const accountId = pane === 'left' ? leftAccountId : rightAccountId;
    const currentPath = pane === 'left' ? leftPath : rightPath;
    const fullPath = `${currentPath.replace(/\/+$/, '')}/${newFolderName.trim()}`.replace('//', '/');

    try {
      const res = await fetch('/api/files/mkdir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ account_id: accountId, path: fullPath })
      });
      if (res.ok) {
        notify(`Created folder "${newFolderName}"`, 'success');
        setShowNewFolderModal({ open: false, pane: 'left' });
        setNewFolderName('');
        if (pane === 'left') refreshLeft(true);
        else refreshRight(true);
      }
    } catch (err: any) {
      notify(`Error creating folder: ${err.message}`, 'error');
    }
  };

  // Delete Selection
  const handleDeleteSelection = async (pane: 'left' | 'right') => {
    const selected = pane === 'left' ? leftSelected : rightSelected;
    const accountId = pane === 'left' ? leftAccountId : rightAccountId;
    const items = pane === 'left' ? leftItems : rightItems;
    if (selected.length === 0) return;

    if (!confirm(`Are you sure you want to delete ${selected.length} item(s)?`)) return;

    for (const name of selected) {
      const target = items.find(i => i.name === name);
      if (target) {
        await fetch('/api/files/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ account_id: accountId, path: target.path, is_dir: target.is_dir })
        });
      }
    }
    notify(`Deleted ${selected.length} item(s)`, 'success');
    if (pane === 'left') refreshLeft(true);
    else refreshRight(true);
  };

  // Context Menu Trigger
  const handleContextMenu = (e: React.MouseEvent, item: StorageItem | null, pane: 'left' | 'right') => {
    e.preventDefault();
    e.stopPropagation();

    if (item) {
      const selected = pane === 'left' ? leftSelected : rightSelected;
      if (!selected.includes(item.name)) {
        if (pane === 'left') setLeftSelected([item.name]);
        else setRightSelected([item.name]);
      }
    }

    const menuWidth = 230;
    const menuHeight = 420;
    const posX = e.clientX + menuWidth > window.innerWidth ? window.innerWidth - menuWidth - 12 : e.clientX;
    const posY = e.clientY + menuHeight > window.innerHeight ? window.innerHeight - menuHeight - 12 : e.clientY;

    setContextMenu({
      visible: true,
      x: Math.max(10, posX),
      y: Math.max(10, posY),
      item,
      pane
    });
  };

  // Download with Real-Time Progress & Multi-Download Support
  const handleDownloadDirect = async (item: StorageItem, pane: 'left' | 'right') => {
    handleMultiDownload([item], pane);
  };

  const handleMultiDownload = async (itemsToDownload: StorageItem[], pane: 'left' | 'right') => {
    const validItems = itemsToDownload.filter(i => !i.is_dir);
    if (validItems.length === 0) return;

    setContextMenu(prev => ({ ...prev, visible: false }));
    setIsTransferDrawerOpen(true);
    notify(`Starting download of ${validItems.length} file(s)...`, 'info');

    const accId = pane === 'left' ? leftAccountId : rightAccountId;
    const acc = accounts.find(a => a.id === accId);
    const accName = acc?.name || 'Cloud';

    for (const item of validItems) {
      const downloadJobId = 'dl-' + Math.random().toString(36).substring(2, 9);
      const newJob: TransferJob = {
        id: downloadJobId,
        source_account_name: accName,
        source_path: item.path,
        target_account_name: 'This PC (Downloads)',
        target_path: 'Downloads',
        filename: item.display_name || item.name,
        size: item.size,
        bytes_transferred: 0,
        status: 'transferring',
        speed_bps: 0,
        progress: 0,
        encrypt_on_upload: false
      };

      setTransfers(prev => [newJob, ...prev]);

      try {
        const url = `/api/files/download?account_id=${encodeURIComponent(accId)}&path=${encodeURIComponent(item.path)}&decrypt=true&passphrase=${encodeURIComponent(passphrase)}`;
        const startTime = Date.now();
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const contentLength = response.headers.get('content-length');
        const total = contentLength ? parseInt(contentLength, 10) : item.size;
        const reader = response.body?.getReader();
        const chunks: Uint8Array[] = [];
        let received = 0;

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            if (value) {
              chunks.push(value);
              received += value.length;
              const elapsed = Math.max(0.1, (Date.now() - startTime) / 1000);
              const speed = received / elapsed;
              const pct = total > 0 ? Math.min(100, Math.round((received / total) * 100)) : 100;
              setTransfers(prev => prev.map(j => j.id === downloadJobId ? {
                ...j,
                bytes_transferred: received,
                progress: pct,
                speed_bps: speed
              } : j));
            }
          }
        }

        const blob = new Blob(chunks as any);
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = item.display_name || item.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(blobUrl);

        setTransfers(prev => prev.map(j => j.id === downloadJobId ? {
          ...j,
          status: 'completed',
          progress: 100,
          bytes_transferred: total || received
        } : j));
        notify(`Downloaded "${item.name}" successfully!`, 'success');
      } catch (err: any) {
        setTransfers(prev => prev.map(j => j.id === downloadJobId ? {
          ...j,
          status: 'failed',
          error_message: err.message
        } : j));
        notify(`Download failed for "${item.name}": ${err.message}`, 'error');
      }
    }
  };

  // Open item
  const handleOpenItem = (item: StorageItem, pane: 'left' | 'right') => {
    if (item.is_dir) {
      handleItemDoubleClick(item, pane);
    } else {
      handleDownloadDirect(item, pane);
    }
    setContextMenu(prev => ({ ...prev, visible: false }));
  };

  // Cut
  const handleCut = (pane: 'left' | 'right') => {
    const items = pane === 'left' ? leftItems : rightItems;
    const selected = pane === 'left' ? leftSelected : rightSelected;
    const targetItems = selected.length > 0 
      ? items.filter(i => selected.includes(i.name)) 
      : (contextMenu.item ? [contextMenu.item] : []);
    if (targetItems.length === 0) return;

    setClipboard({
      action: 'cut',
      items: targetItems,
      sourceAccountId: pane === 'left' ? leftAccountId : rightAccountId,
      sourcePath: pane === 'left' ? leftPath : rightPath,
    });
    notify(`Cut ${targetItems.length} item(s) to clipboard`, 'info');
    setContextMenu(prev => ({ ...prev, visible: false }));
  };

  // Copy
  const handleCopy = (pane: 'left' | 'right') => {
    const items = pane === 'left' ? leftItems : rightItems;
    const selected = pane === 'left' ? leftSelected : rightSelected;
    const targetItems = selected.length > 0 
      ? items.filter(i => selected.includes(i.name)) 
      : (contextMenu.item ? [contextMenu.item] : []);
    if (targetItems.length === 0) return;

    setClipboard({
      action: 'copy',
      items: targetItems,
      sourceAccountId: pane === 'left' ? leftAccountId : rightAccountId,
      sourcePath: pane === 'left' ? leftPath : rightPath,
    });
    notify(`Copied ${targetItems.length} item(s) to clipboard`, 'info');
    setContextMenu(prev => ({ ...prev, visible: false }));
  };

  // Paste
  const handlePaste = async (pane: 'left' | 'right') => {
    if (!clipboard || clipboard.items.length === 0) return;
    const targetAccId = pane === 'left' ? leftAccountId : rightAccountId;
    const targetP = pane === 'left' ? leftPath : rightPath;

    for (const item of clipboard.items) {
      await fetch('/api/transfers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source_account_id: clipboard.sourceAccountId,
          source_path: item.path,
          target_account_id: targetAccId,
          target_path: targetP,
          filename: item.name,
          size: item.size
        })
      });
    }
    notify(`Pasting ${clipboard.items.length} item(s)...`, 'success');
    setIsTransferDrawerOpen(true);
    setContextMenu(prev => ({ ...prev, visible: false }));
    if (clipboard.action === 'cut') setClipboard(null);
  };

  // Rename Submit
  const handleRenameSubmit = async () => {
    if (!renameModal.item || !renameModal.newName.trim()) return;
    const item = renameModal.item;
    const pane = renameModal.pane;
    const accId = pane === 'left' ? leftAccountId : rightAccountId;
    const currentFolder = item.path.split('/').slice(0, -1).join('/') || '/';
    const newPath = `${currentFolder.replace(/\/+$/, '')}/${renameModal.newName.trim()}`.replace('//', '/');

    try {
      const res = await fetch('/api/files/rename', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          account_id: accId,
          old_path: item.path,
          new_path: newPath
        })
      });
      if (res.ok) {
        notify(`Renamed to "${renameModal.newName}"`, 'success');
        setRenameModal({ open: false, item: null, newName: '', pane: 'left' });
        if (pane === 'left') refreshLeft(true);
        else refreshRight(true);
      }
    } catch (err: any) {
      notify(`Rename error: ${err.message}`, 'error');
    }
  };

  // Share Link (Air Explorer Public Link Generator)
  const handleOpenShareModal = async (items: StorageItem[], pane: 'left' | 'right') => {
    setContextMenu(prev => ({ ...prev, visible: false }));
    const accId = pane === 'left' ? leftAccountId : rightAccountId;
    setShareModal({ open: true, items, links: [], copied: false, loading: true });

    const collectedLinks: string[] = [];
    for (const item of items) {
      if (item.public_link) {
        collectedLinks.push(item.public_link);
      } else {
        try {
          const res = await fetch(`/api/files/share-link?account_id=${encodeURIComponent(accId)}&path=${encodeURIComponent(item.path)}`);
          const data = await res.json();
          if (data.share_link) {
            collectedLinks.push(data.share_link.startsWith('http') ? data.share_link : `${window.location.origin}${data.share_link}`);
          } else {
            collectedLinks.push(`${window.location.origin}/api/files/download?account_id=${encodeURIComponent(accId)}&path=${encodeURIComponent(item.path)}`);
          }
        } catch {
          collectedLinks.push(`${window.location.origin}/api/files/download?account_id=${encodeURIComponent(accId)}&path=${encodeURIComponent(item.path)}`);
        }
      }
    }
    setShareModal({ open: true, items, links: collectedLinks, copied: false, loading: false });
  };

  // Direct File Upload
  const handleUploadFiles = async (e: React.ChangeEvent<HTMLInputElement>, pane: 'left' | 'right') => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const accountId = pane === 'left' ? leftAccountId : rightAccountId;
    const path = pane === 'left' ? leftPath : rightPath;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const formData = new FormData();
      formData.append('account_id', accountId);
      formData.append('path', path);
      formData.append('encrypt', String(encryptByDefault));
      if (encryptByDefault && passphrase) {
        formData.append('passphrase', passphrase);
      }
      formData.append('file', file);

      notify(`Uploading ${file.name}...`, 'info');
      await fetch('/api/files/upload', { method: 'POST', body: formData });
    }
    notify(`Finished uploading ${files.length} file(s)`, 'success');
    if (pane === 'left') refreshLeft(true);
    else refreshRight(true);
    e.target.value = '';
  };

  // Add Account Submit
  const handleSaveAccount = async () => {
    try {
      const res = await fetch('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: selectedProviderType,
          ...accountFormData
        })
      });
      if (res.ok) {
        notify('Account added successfully!', 'success');
        setShowAccountModal(false);
        setAccountFormData({ name: '' });
        fetchAccounts();
      }
    } catch (err: any) {
      notify(`Error saving account: ${err.message}`, 'error');
    }
  };

  // Delete Account
  const handleDeleteAccount = async (id: string) => {
    if (!confirm('Are you sure you want to remove this account?')) return;
    await fetch(`/api/accounts/${id}`, { method: 'DELETE' });
    notify('Account removed', 'info');
    fetchAccounts();
  };

  // Save Settings & Preferences
  const handleSaveSettings = async (newSettings: typeof settings) => {
    setSettings(newSettings);
    localStorage.setItem('openmultiexplorer_settings', JSON.stringify(newSettings));
    setLeftSortBy(newSettings.defaultSortBy);
    setLeftSortOrder(newSettings.defaultSortOrder);
    setRightSortBy(newSettings.defaultSortBy);
    setRightSortOrder(newSettings.defaultSortOrder);
    setViewMode(newSettings.defaultViewMode);
    setSpeedLimitKbps(newSettings.speedLimitKbps);

    try {
      await fetch('/api/transfers/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ speed_limit_bps: newSettings.speedLimitKbps * 1024 })
      });
    } catch {}

    setShowSettingsModal(false);
    notify('Settings saved and applied successfully!', 'success');
  };

  // Analyze Sync
  const handleAnalyzeSync = async () => {
    setSyncAnalyzing(true);
    try {
      const srcAcc = syncDirection === 'left-to-right' ? leftAccountId : rightAccountId;
      const srcP = syncDirection === 'left-to-right' ? leftPath : rightPath;
      const dstAcc = syncDirection === 'left-to-right' ? rightAccountId : leftAccountId;
      const dstP = syncDirection === 'left-to-right' ? rightPath : leftPath;

      const res = await fetch('/api/sync/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source_account_id: srcAcc,
          source_path: srcP,
          target_account_id: dstAcc,
          target_path: dstP,
          mode: syncMode
        })
      });
      const data = await res.json();
      setSyncAnalysis(data);
    } catch (err: any) {
      notify(`Sync analysis error: ${err.message}`, 'error');
    } finally {
      setSyncAnalyzing(false);
    }
  };

  // Execute Sync
  const handleExecuteSync = async () => {
    if (!syncAnalysis) return;
    try {
      const res = await fetch('/api/sync/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analysis: syncAnalysis,
          encrypt_on_upload: encryptByDefault,
          passphrase: passphrase
        })
      });
      const data = await res.json();
      notify(`Synchronization queued! ${data.scheduled_jobs_count} job(s) scheduled.`, 'success');
      setShowSyncModal(false);
      setIsTransferDrawerOpen(true);
    } catch (err: any) {
      notify(`Sync execute error: ${err.message}`, 'error');
    }
  };

  // Multi-Cloud Search
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearchLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      setSearchResults(data.results || []);
    } catch (err: any) {
      notify(`Search error: ${err.message}`, 'error');
    } finally {
      setSearchLoading(false);
    }
  };

  const getProviderIcon = (type: string) => {
    switch (type) {
      case 'local': return <HardDrive size={16} className="text-blue-400" />;
      case 'mediafire': return <Flame size={16} className="text-orange-500" />;
      case 's3': case 'wasabi': case 'backblaze': return <Database size={16} className="text-amber-400" />;
      case 'webdav': case 'ftp': return <Server size={16} className="text-emerald-400" />;
      default: return <Cloud size={16} className="text-cyan-400" />;
    }
  };

  // Mouse Marquee Drag Selection (Desktop-Grade Explorer Lasso)
  const handleMouseDownTable = (e: React.MouseEvent, pane: 'left' | 'right') => {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    // Don't drag if clicking buttons, checkbox, inputs, selects, links, or context menus
    if (target.closest('button') || target.closest('input') || target.closest('select') || target.closest('a') || target.closest('.context-menu')) {
      return;
    }

    const rowEl = target.closest('.file-row') as HTMLElement | null;
    const clickedItemName = rowEl ? rowEl.getAttribute('data-name') : null;

    const currentSelected = pane === 'left' ? leftSelected : rightSelected;
    const isCtrl = e.ctrlKey || e.metaKey;

    dragRef.current = {
      active: true,
      isDragging: false,
      startX: e.clientX,
      startY: e.clientY,
      pane,
      clickedItemName,
      initialSelected: isCtrl ? currentSelected : [],
      ctrlKey: isCtrl
    };
  };

  // Row Click Handler (Single click, Shift+Click Range, Ctrl+Click Toggle, Drag Protection)
  const handleRowClick = (item: StorageItem, pane: 'left' | 'right', e: React.MouseEvent) => {
    // If we just finished dragging, prevent the click from overriding our lasso selection!
    if (justDraggedRef.current) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    const currentSelected = pane === 'left' ? leftSelected : rightSelected;
    const setSelected = pane === 'left' ? setLeftSelected : setRightSelected;
    const rawItems = pane === 'left' ? leftItems : rightItems;
    const filterText = pane === 'left' ? leftFilter : rightFilter;
    const sortBy = pane === 'left' ? leftSortBy : rightSortBy;
    const sortOrder = pane === 'left' ? leftSortOrder : rightSortOrder;
    const visibleItems = sortItems(
      rawItems.filter(i => !filterText || i.name.toLowerCase().includes(filterText.toLowerCase())),
      sortBy,
      sortOrder
    );

    const isSelected = currentSelected.includes(item.name);

    if (e.ctrlKey || e.metaKey) {
      if (isSelected) {
        setSelected(currentSelected.filter(n => n !== item.name));
      } else {
        setSelected([...currentSelected, item.name]);
      }
      lastClickedItemRef.current = { name: item.name, pane };
    } else if (e.shiftKey && lastClickedItemRef.current && lastClickedItemRef.current.pane === pane) {
      const lastIdx = visibleItems.findIndex(i => i.name === lastClickedItemRef.current!.name);
      const currIdx = visibleItems.findIndex(i => i.name === item.name);
      if (lastIdx !== -1 && currIdx !== -1) {
        const start = Math.min(lastIdx, currIdx);
        const end = Math.max(lastIdx, currIdx);
        const rangeNames = visibleItems.slice(start, end + 1).map(i => i.name);
        setSelected(Array.from(new Set([...currentSelected, ...rangeNames])));
      } else {
        setSelected([item.name]);
        lastClickedItemRef.current = { name: item.name, pane };
      }
    } else {
      setSelected([item.name]);
      lastClickedItemRef.current = { name: item.name, pane };
    }
  };

  // Skeleton Table Component
  const SkeletonTable = () => (
    <tbody>
      {Array.from({ length: 8 }).map((_, idx) => (
        <tr key={idx} className="skeleton-row">
          <td style={{ width: 30 }}>
            <div className="skeleton-shimmer" style={{ width: 14, height: 14, borderRadius: 3 }} />
          </td>
          <td>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div className="skeleton-shimmer" style={{ width: 18, height: 18, borderRadius: 4 }} />
              <div className="skeleton-shimmer" style={{ width: `${40 + (idx % 4) * 15}%`, height: 14 }} />
            </div>
          </td>
          <td style={{ width: 100 }}>
            <div className="skeleton-shimmer" style={{ width: 55, height: 13 }} />
          </td>
          <td style={{ width: 150 }}>
            <div className="skeleton-shimmer" style={{ width: 100, height: 13 }} />
          </td>
        </tr>
      ))}
    </tbody>
  );

  // New Tab Accounts Dashboard (Image 2)
  const AccountsDashboard = ({ pane }: { pane: 'left' | 'right' }) => {
    const filtered = accounts.filter(a => {
      if (!dashboardSearch) return true;
      return a.name.toLowerCase().includes(dashboardSearch.toLowerCase()) ||
             a.type.toLowerCase().includes(dashboardSearch.toLowerCase()) ||
             (a.subtitle && a.subtitle.toLowerCase().includes(dashboardSearch.toLowerCase()));
    });

    return (
      <div className="accounts-dashboard">
        <div className="dashboard-search-row">
          <div className="dashboard-search-scope">
            <Globe size={14} className="text-cyan-400" />
            <span>All</span>
            <ChevronDown size={12} />
          </div>
          <input
            type="text"
            className="dashboard-search-input"
            placeholder="Search accounts..."
            value={dashboardSearch}
            onChange={(e) => setDashboardSearch(e.target.value)}
          />
          {dashboardSearch && (
            <button className="btn-icon" onClick={() => setDashboardSearch('')} style={{ padding: 2 }}>
              <X size={13} />
            </button>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div
            className="dashboard-item"
            onClick={() => setShowAccountModal(true)}
            style={{ color: '#38bdf8', fontWeight: 600 }}
          >
            <Plus size={16} />
            <span>Register account</span>
          </div>

          <div
            className="dashboard-item"
            onClick={() => selectAccountForActiveTab('local-pc', pane)}
          >
            <HardDrive size={16} className="text-blue-400" />
            <span style={{ fontWeight: 500 }}>This PC</span>
          </div>
        </div>

        <div className="dashboard-section-header">
          <ChevronDown size={14} />
          <span>Accounts</span>
          <Edit3 size={12} className="cursor-pointer text-slate-400 hover:text-white" onClick={() => setShowAccountModal(true)} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {filtered.filter(a => a.id !== 'local-pc').map(acc => (
            <div
              key={acc.id}
              className="dashboard-item"
              onClick={() => selectAccountForActiveTab(acc.id, pane)}
            >
              {getProviderIcon(acc.type)}
              <span style={{ fontWeight: 600, minWidth: 70, textTransform: 'capitalize' }}>
                {acc.type === 'mediafire' ? 'MediaFire' : acc.type === 'mega' ? 'Mega' : acc.type.toUpperCase()}
              </span>
              <span style={{ color: '#f8fafc', fontWeight: 500 }}>{acc.name}</span>
              {acc.subtitle && acc.subtitle !== acc.name && (
                <span style={{ color: '#64748b', fontSize: 12 }}>({acc.subtitle})</span>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="app-container">
      {/* Global Desktop Selection Marquee Lasso */}
      {marquee && marquee.active && (
        <div
          className="selection-marquee"
          style={{
            left: Math.min(marquee.startX, marquee.currentX),
            top: Math.min(marquee.startY, marquee.currentY),
            width: Math.abs(marquee.currentX - marquee.startX),
            height: Math.abs(marquee.currentY - marquee.startY)
          }}
        />
      )}

      {/* Toast Notification */}
      {notification && (
        <div style={{
          position: 'fixed', bottom: 35, right: 20, zIndex: 9999,
          background: notification.type === 'error' ? '#dc2626' : notification.type === 'success' ? '#059669' : '#1e293b',
          color: 'white', padding: '10px 16px', borderRadius: 8, boxShadow: '0 8px 16px rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, border: '1px solid rgba(255,255,255,0.1)'
        }}>
          {notification.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle size={16} />}
          {notification.text}
        </div>
      )}

      {/* TOP NAVBAR */}
      <header className="top-navbar">
        <div className="brand-badge">
          <AppLogo size={26} />
          <span>OpenMultiExplorer</span>
          <span className="pro-badge">v1.0</span>
        </div>

        <div className="nav-actions">
          {/* View Dropdown (Image 1) */}
          <div style={{ position: 'relative' }}>
            <button
              className="btn btn-secondary"
              onClick={(e) => { e.stopPropagation(); setShowViewDropdown(!showViewDropdown); }}
            >
              <Monitor size={15} className="text-cyan-400" />
              <span>View</span>
              <ChevronDown size={13} />
            </button>

            {showViewDropdown && (
              <div className="view-dropdown" onClick={(e) => e.stopPropagation()}>
                <div
                  className={`context-menu-item ${viewMode === 'single' ? 'selected' : ''}`}
                  onClick={() => { setViewMode('single'); setShowViewDropdown(false); }}
                >
                  <Layout size={15} />
                  <span>One Panel</span>
                  {viewMode === 'single' && <Check size={14} className="text-cyan-400 ml-auto" />}
                </div>

                <div
                  className={`context-menu-item ${viewMode === 'dual' ? 'selected' : ''}`}
                  onClick={() => { setViewMode('dual'); setShowViewDropdown(false); }}
                >
                  <Columns size={15} />
                  <span>Two Panels</span>
                  {viewMode === 'dual' && <Check size={14} className="text-cyan-400 ml-auto" />}
                </div>

                <div className="context-menu-separator" />

                <div
                  className="context-menu-item"
                  onClick={() => { setIsTransferDrawerOpen(!isTransferDrawerOpen); setShowViewDropdown(false); }}
                >
                  <Sliders size={15} />
                  <span>Transfers & Logs</span>
                </div>
              </div>
            )}
          </div>

          <button className="btn btn-secondary" onClick={() => setShowAccountModal(true)}>
            <Cloud size={15} />
            <span>Accounts ({accounts.filter(a => a.id !== 'local-pc').length})</span>
          </button>

          {viewMode === 'dual' && (
            <button className="btn btn-secondary" onClick={() => { setSyncAnalysis(null); setShowSyncModal(true); }}>
              <ArrowLeftRight size={15} />
              <span>Folder Sync</span>
            </button>
          )}

          <button className="btn btn-secondary" onClick={() => setShowSearchModal(true)}>
            <Search size={15} />
            <span>Search Clouds</span>
          </button>

          <button className={`btn ${encryptByDefault ? 'btn-success' : 'btn-secondary'}`} onClick={() => setShowCryptoModal(true)}>
            <Shield size={15} />
            <span>AES-256 Vault {encryptByDefault ? '(Active)' : ''}</span>
          </button>

          <button className="btn btn-secondary" onClick={() => setShowSettingsModal(true)}>
            <Settings size={15} />
            <span>Settings</span>
          </button>

          <button className="btn btn-primary" onClick={() => setIsTransferDrawerOpen(!isTransferDrawerOpen)}>
            <Sliders size={15} />
            <span>Transfers ({transfers.filter(t => t.status === 'transferring' || t.status === 'pending').length})</span>
          </button>
        </div>
      </header>

      {/* MAIN WORKSPACE (Single or Dual Panels) */}
      <main className="dual-pane-workspace">
        {/* LEFT PANE */}
        <section className="pane" style={{ flex: 1 }}>
          {/* Panel Tab Bar (Image 2) */}
          <div className="panel-tab-bar">
            {leftTabs.map(tab => (
              <div
                key={tab.id}
                className={`panel-tab ${activeLeftTabId === tab.id ? 'active' : ''}`}
                onClick={() => setActiveLeftTabId(tab.id)}
              >
                {tab.isNewTab ? <Globe size={13} className="text-slate-400" /> : getProviderIcon(accounts.find(a => a.id === tab.accountId)?.type || 'local')}
                <span>{tab.title}</span>
                {leftTabs.length > 1 && (
                  <span className="tab-close-btn" onClick={(e) => handleCloseTab(tab.id, 'left', e)}>
                    <X size={12} />
                  </span>
                )}
              </div>
            ))}
            <button className="panel-tab-add" title="Open new tab" onClick={() => handleAddNewTab('left')}>
              <Plus size={14} />
            </button>
          </div>

          {activeLeftTab?.isNewTab ? (
            <AccountsDashboard pane="left" />
          ) : (
            <>
              <div className="pane-header">
                <div className="pane-selector-row">
                  <select
                    className="account-select"
                    value={leftAccountId}
                    onChange={(e) => selectAccountForActiveTab(e.target.value, 'left')}
                  >
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} ({acc.type.toUpperCase()})
                      </option>
                    ))}
                  </select>
                  <button className="btn-icon" title="Refresh" onClick={() => refreshLeft(true)}>
                    <RefreshCw size={14} className={leftLoading ? 'animate-spin' : ''} />
                  </button>
                </div>

                <div className="pane-breadcrumbs-row">
                  <button className="btn-icon" title="Up one level" onClick={() => handleNavigateUp('left')}>
                    <ArrowLeft size={14} />
                  </button>
                  <div className="breadcrumbs-box">
                    <span className="crumb-part" onClick={() => setLeftTabs(prev => prev.map(t => t.id === activeLeftTabId ? { ...t, path: '/', title: accounts.find(a => a.id === leftAccountId)?.name || 'Home' } : t))}>/</span>
                    {leftPath.split('/').filter(Boolean).map((part, idx, arr) => (
                      <React.Fragment key={idx}>
                        <span>/</span>
                        <span
                          className="crumb-part"
                          onClick={() => {
                            const newP = '/' + arr.slice(0, idx + 1).join('/');
                            setLeftTabs(prev => prev.map(t => t.id === activeLeftTabId ? { ...t, path: newP, title: part } : t));
                          }}
                        >
                          {part}
                        </span>
                      </React.Fragment>
                    ))}
                  </div>
                  <input
                    type="text"
                    placeholder="Filter files..."
                    value={leftFilter}
                    onChange={(e) => setLeftFilter(e.target.value)}
                    style={{
                      background: '#0b0f19', border: '1px solid #1e293b', borderRadius: 4,
                      padding: '4px 8px', fontSize: 12, color: 'white', width: 110, outline: 'none'
                    }}
                  />
                </div>
              </div>

              {/* Action strip */}
              <div className="action-strip">
                <input
                  type="file"
                  multiple
                  ref={fileInputRefLeft}
                  style={{ display: 'none' }}
                  onChange={(e) => handleUploadFiles(e, 'left')}
                />
                <button className="btn btn-secondary btn-icon" title="Upload Files" onClick={() => fileInputRefLeft.current?.click()}>
                  <Upload size={14} />
                </button>
                <button className="btn btn-secondary btn-icon" title="New Folder" onClick={() => setShowNewFolderModal({ open: true, pane: 'left' })}>
                  <FolderPlus size={14} />
                </button>
                <button
                  className="btn btn-secondary"
                  title="Download selected to PC"
                  disabled={leftSelected.length === 0}
                  onClick={() => handleMultiDownload(leftItems.filter(i => leftSelected.includes(i.name)), 'left')}
                >
                  <Download size={14} />
                  <span>Download to PC ({leftSelected.length})</span>
                </button>
                <button className="btn btn-danger btn-icon" title="Delete Selected" onClick={() => handleDeleteSelection('left')}>
                  <Trash2 size={14} />
                </button>
                <div style={{ flex: 1 }} />
                {viewMode === 'dual' && (
                  <button className="btn btn-primary" title="Transfer selected to Right Pane" onClick={() => transferLeftToRight(false)}>
                    <span>Transfer to Right</span>
                    <ArrowRight size={14} />
                  </button>
                )}
              </div>

              {/* Left File Table with Desktop-Grade Lasso Drag-Selection & Column Sorting */}
              <div
                className="file-list-view"
                onMouseDown={(e) => handleMouseDownTable(e, 'left')}
                onContextMenu={(e) => handleContextMenu(e, null, 'left')}
                onDragStart={(e) => e.preventDefault()}
              >
                <table className="file-table" onDragStart={(e) => e.preventDefault()}>
                  <thead>
                    <tr>
                      <th style={{ width: 30 }}>
                        <input
                          type="checkbox"
                          checked={leftSelected.length > 0 && leftSelected.length === leftItems.length}
                          onChange={(e) => {
                            if (e.target.checked) setLeftSelected(leftItems.map(i => i.name));
                            else setLeftSelected([]);
                          }}
                        />
                      </th>
                      <th className="cursor-pointer hover:text-white select-none" onClick={() => handleSortClick('name', 'left')}>
                        Name {leftSortBy === 'name' ? (leftSortOrder === 'asc' ? '▲' : '▼') : ''}
                      </th>
                      <th style={{ width: 100 }} className="cursor-pointer hover:text-white select-none" onClick={() => handleSortClick('size', 'left')}>
                        Size {leftSortBy === 'size' ? (leftSortOrder === 'asc' ? '▲' : '▼') : ''}
                      </th>
                      <th style={{ width: 170 }} className="cursor-pointer hover:text-white select-none" onClick={() => handleSortClick('modified', 'left')}>
                        Modified {leftSortBy === 'modified' ? (leftSortOrder === 'asc' ? '▲' : '▼') : ''}
                      </th>
                    </tr>
                  </thead>

                  {leftLoading ? (
                    <SkeletonTable />
                  ) : (
                    <tbody>
                      {sortItems(
                        leftItems.filter(i => !leftFilter || i.name.toLowerCase().includes(leftFilter.toLowerCase())),
                        leftSortBy,
                        leftSortOrder
                      ).map(item => {
                        const isSelected = leftSelected.includes(item.name);
                        return (
                          <tr
                            key={item.path}
                            data-pane="left"
                            data-name={item.name}
                            className={`file-row ${isSelected ? 'selected' : ''}`}
                            onDoubleClick={() => handleItemDoubleClick(item, 'left')}
                            onClick={(e) => handleRowClick(item, 'left', e)}
                            onContextMenu={(e) => handleContextMenu(e, item, 'left')}
                            onDragStart={(e) => e.preventDefault()}
                          >
                            <td>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  if (isSelected) setLeftSelected(leftSelected.filter(n => n !== item.name));
                                  else setLeftSelected([...leftSelected, item.name]);
                                }}
                                onClick={(e) => e.stopPropagation()}
                              />
                            </td>
                            <td>
                              <div className="file-name-cell">
                                {item.is_dir ? <Folder size={16} className="text-amber-400" /> : <File size={16} className="text-slate-400" />}
                                <span>{item.display_name || item.name}</span>
                                {item.is_encrypted && (
                                  <span className="enc-badge">
                                    <Lock size={10} /> AES-256
                                  </span>
                                )}
                              </div>
                            </td>
                            <td>{item.is_dir ? '—' : formatBytes(item.size)}</td>
                            <td>{item.modified || '—'}</td>
                          </tr>
                        );
                      })}
                      {leftItems.length === 0 && (
                        <tr>
                          <td colSpan={4} style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>
                            Folder is empty
                          </td>
                        </tr>
                      )}
                    </tbody>
                  )}
                </table>
              </div>
            </>
          )}
        </section>

        {/* RIGHT PANE (Only in Two Panels mode) */}
        {viewMode === 'dual' && (
          <section className="pane" style={{ flex: 1 }}>
            {/* Panel Tab Bar */}
            <div className="panel-tab-bar">
              {rightTabs.map(tab => (
                <div
                  key={tab.id}
                  className={`panel-tab ${activeRightTabId === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveRightTabId(tab.id)}
                >
                  {tab.isNewTab ? <Globe size={13} className="text-slate-400" /> : getProviderIcon(accounts.find(a => a.id === tab.accountId)?.type || 'local')}
                  <span>{tab.title}</span>
                  {rightTabs.length > 1 && (
                    <span className="tab-close-btn" onClick={(e) => handleCloseTab(tab.id, 'right', e)}>
                      <X size={12} />
                    </span>
                  )}
                </div>
              ))}
              <button className="panel-tab-add" title="Open new tab" onClick={() => handleAddNewTab('right')}>
                <Plus size={14} />
              </button>
            </div>

            {activeRightTab?.isNewTab ? (
              <AccountsDashboard pane="right" />
            ) : (
              <>
                <div className="pane-header">
                  <div className="pane-selector-row">
                    <select
                      className="account-select"
                      value={rightAccountId}
                      onChange={(e) => selectAccountForActiveTab(e.target.value, 'right')}
                    >
                      {accounts.map(acc => (
                        <option key={acc.id} value={acc.id}>
                          {acc.name} ({acc.type.toUpperCase()})
                        </option>
                      ))}
                    </select>
                    <button className="btn-icon" title="Refresh" onClick={() => refreshRight(true)}>
                      <RefreshCw size={14} className={rightLoading ? 'animate-spin' : ''} />
                    </button>
                  </div>

                  <div className="pane-breadcrumbs-row">
                    <button className="btn-icon" title="Up one level" onClick={() => handleNavigateUp('right')}>
                      <ArrowLeft size={14} />
                    </button>
                    <div className="breadcrumbs-box">
                      <span className="crumb-part" onClick={() => setRightTabs(prev => prev.map(t => t.id === activeRightTabId ? { ...t, path: '/', title: accounts.find(a => a.id === rightAccountId)?.name || 'Home' } : t))}>/</span>
                      {rightPath.split('/').filter(Boolean).map((part, idx, arr) => (
                        <React.Fragment key={idx}>
                          <span>/</span>
                          <span
                            className="crumb-part"
                            onClick={() => {
                              const newP = '/' + arr.slice(0, idx + 1).join('/');
                              setRightTabs(prev => prev.map(t => t.id === activeRightTabId ? { ...t, path: newP, title: part } : t));
                            }}
                          >
                            {part}
                          </span>
                        </React.Fragment>
                      ))}
                    </div>
                    <input
                      type="text"
                      placeholder="Filter files..."
                      value={rightFilter}
                      onChange={(e) => setRightFilter(e.target.value)}
                      style={{
                        background: '#0b0f19', border: '1px solid #1e293b', borderRadius: 4,
                        padding: '4px 8px', fontSize: 12, color: 'white', width: 110, outline: 'none'
                      }}
                    />
                  </div>
                </div>

                {/* Action strip */}
                <div className="action-strip">
                  <button className="btn btn-primary" title="Transfer selected to Left Pane" onClick={() => transferRightToLeft(false)}>
                    <ArrowLeft size={14} />
                    <span>Transfer to Left</span>
                  </button>
                  <div style={{ flex: 1 }} />
                  <input
                    type="file"
                    multiple
                    ref={fileInputRefRight}
                    style={{ display: 'none' }}
                    onChange={(e) => handleUploadFiles(e, 'right')}
                  />
                  <button className="btn btn-secondary btn-icon" title="Upload Files" onClick={() => fileInputRefRight.current?.click()}>
                    <Upload size={14} />
                  </button>
                  <button className="btn btn-secondary btn-icon" title="New Folder" onClick={() => setShowNewFolderModal({ open: true, pane: 'right' })}>
                    <FolderPlus size={14} />
                  </button>
                  <button
                    className="btn btn-secondary"
                    title="Download selected to PC"
                    disabled={rightSelected.length === 0}
                    onClick={() => handleMultiDownload(rightItems.filter(i => rightSelected.includes(i.name)), 'right')}
                  >
                    <Download size={14} />
                    <span>Download to PC ({rightSelected.length})</span>
                  </button>
                  <button className="btn btn-danger btn-icon" title="Delete Selected" onClick={() => handleDeleteSelection('right')}>
                    <Trash2 size={14} />
                  </button>
                </div>

                {/* Right File Table with Desktop-Grade Lasso Drag-Selection & Column Sorting */}
                <div
                  className="file-list-view"
                  onMouseDown={(e) => handleMouseDownTable(e, 'right')}
                  onContextMenu={(e) => handleContextMenu(e, null, 'right')}
                  onDragStart={(e) => e.preventDefault()}
                >
                  <table className="file-table" onDragStart={(e) => e.preventDefault()}>
                    <thead>
                      <tr>
                        <th style={{ width: 30 }}>
                          <input
                            type="checkbox"
                            checked={rightSelected.length > 0 && rightSelected.length === rightItems.length}
                            onChange={(e) => {
                              if (e.target.checked) setRightSelected(rightItems.map(i => i.name));
                              else setRightSelected([]);
                            }}
                          />
                        </th>
                        <th className="cursor-pointer hover:text-white select-none" onClick={() => handleSortClick('name', 'right')}>
                          Name {rightSortBy === 'name' ? (rightSortOrder === 'asc' ? '▲' : '▼') : ''}
                        </th>
                        <th style={{ width: 100 }} className="cursor-pointer hover:text-white select-none" onClick={() => handleSortClick('size', 'right')}>
                          Size {rightSortBy === 'size' ? (rightSortOrder === 'asc' ? '▲' : '▼') : ''}
                        </th>
                        <th style={{ width: 170 }} className="cursor-pointer hover:text-white select-none" onClick={() => handleSortClick('modified', 'right')}>
                          Modified {rightSortBy === 'modified' ? (rightSortOrder === 'asc' ? '▲' : '▼') : ''}
                        </th>
                      </tr>
                    </thead>

                    {rightLoading ? (
                      <SkeletonTable />
                    ) : (
                      <tbody>
                        {sortItems(
                          rightItems.filter(i => !rightFilter || i.name.toLowerCase().includes(rightFilter.toLowerCase())),
                          rightSortBy,
                          rightSortOrder
                        ).map(item => {
                          const isSelected = rightSelected.includes(item.name);
                          return (
                            <tr
                              key={item.path}
                              data-pane="right"
                              data-name={item.name}
                              className={`file-row ${isSelected ? 'selected' : ''}`}
                              onDoubleClick={() => handleItemDoubleClick(item, 'right')}
                              onClick={(e) => handleRowClick(item, 'right', e)}
                              onContextMenu={(e) => handleContextMenu(e, item, 'right')}
                              onDragStart={(e) => e.preventDefault()}
                            >
                              <td>
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={(e) => {
                                    e.stopPropagation();
                                    if (isSelected) setRightSelected(rightSelected.filter(n => n !== item.name));
                                    else setRightSelected([...rightSelected, item.name]);
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                />
                              </td>
                              <td>
                                <div className="file-name-cell">
                                  {item.is_dir ? <Folder size={16} className="text-amber-400" /> : <File size={16} className="text-slate-400" />}
                                  <span>{item.display_name || item.name}</span>
                                  {item.is_encrypted && (
                                    <span className="enc-badge">
                                      <Lock size={10} /> AES-256
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td>{item.is_dir ? '—' : formatBytes(item.size)}</td>
                              <td>{item.modified || '—'}</td>
                            </tr>
                          );
                        })}
                        {rightItems.length === 0 && (
                          <tr>
                            <td colSpan={4} style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>
                              Folder is empty
                            </td>
                          </tr>
                        )}
                      </tbody>
                    )}
                  </table>
                </div>
              </>
            )}
          </section>
        )}
      </main>

      {/* TRANSFER QUEUE DRAWER */}
      {isTransferDrawerOpen && (
        <section className="transfer-drawer">
          <div className="drawer-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontWeight: 600, fontSize: 13, color: '#f8fafc' }}>
                Transfer & Download Manager ({transfers.length})
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#94a3b8' }}>
                <span>Speed Limit:</span>
                <select
                  value={speedLimitKbps}
                  onChange={async (e) => {
                    const val = parseInt(e.target.value);
                    setSpeedLimitKbps(val);
                    await fetch('/api/transfers/settings', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ speed_limit_kbps: val })
                    });
                  }}
                  style={{ background: '#0b0f19', border: '1px solid #334155', color: 'white', borderRadius: 4, padding: '2px 6px' }}
                >
                  <option value={0}>Unlimited</option>
                  <option value={512}>512 KB/s</option>
                  <option value={2048}>2 MB/s</option>
                  <option value={10240}>10 MB/s</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                className="btn btn-secondary"
                style={{ padding: '3px 8px', fontSize: 11 }}
                onClick={() => {
                  setTransfers(prev => prev.filter(t => t.status === 'transferring' || t.status === 'pending'));
                  fetch('/api/transfers/clear', { method: 'POST' });
                }}
              >
                Clear Finished
              </button>
              <button className="btn-icon" onClick={() => setIsTransferDrawerOpen(false)}>
                <X size={15} />
              </button>
            </div>
          </div>

          <div className="transfer-items-list">
            {transfers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 30, color: '#64748b', fontSize: 13 }}>
                No active or queued transfers or downloads.
              </div>
            ) : (
              transfers.map(job => (
                <div key={job.id} className="transfer-item-card">
                  <div className="transfer-row-meta">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontWeight: 600, color: '#f8fafc' }}>{job.filename}</span>
                      <span style={{ color: '#94a3b8', fontSize: 11 }}>
                        {job.source_account_name} ➔ {job.target_account_name}
                      </span>
                      {job.encrypt_on_upload && (
                        <span className="enc-badge"><Lock size={10} /> Encrypted</span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 11, color: '#38bdf8' }}>
                        {job.status === 'transferring' ? `${formatBytes(job.speed_bps)}/s` : job.status}
                      </span>
                      <span style={{ fontSize: 11, color: '#94a3b8' }}>
                        {formatBytes(job.bytes_transferred)} / {formatBytes(job.size)}
                      </span>
                      {job.status !== 'completed' && job.status !== 'cancelled' && (
                        <button
                          className="btn-icon"
                          onClick={() => {
                            setTransfers(prev => prev.map(t => t.id === job.id ? { ...t, status: 'cancelled' } : t));
                            fetch(`/api/transfers/${job.id}/cancel`, { method: 'POST' });
                          }}
                        >
                          <X size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="progress-bar-bg">
                    <div
                      className="progress-bar-fill"
                      style={{
                        width: `${job.progress}%`,
                        background: job.status === 'completed' ? '#10b981' : job.status === 'failed' ? '#ef4444' : '#38bdf8'
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      )}

      {/* STATUS BAR */}
      <footer className="bottom-status-bar">
        <div>
          {viewMode === 'single' ? (
            <span>Panel: {leftItems.length} items ({leftSelected.length} selected) | Sorted by {leftSortBy} ({leftSortOrder})</span>
          ) : (
            <span>Left: {leftItems.length} items ({leftSelected.length} selected) | Right: {rightItems.length} items ({rightSelected.length} selected)</span>
          )}
        </div>
        <div>
          OpenMultiExplorer Pro • {viewMode === 'single' ? 'One Panel Mode' : 'Two Panels Mode'} • Client-Side AES-256 Vault Ready
        </div>
      </footer>

      {/* --- DESKTOP CONTEXT MENU --- */}
      {contextMenu.visible && (
        <div
          className="context-menu"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          {contextMenu.item ? (
            <>
              <div
                className="context-menu-item"
                onClick={() => handleOpenItem(contextMenu.item!, contextMenu.pane)}
              >
                <Eye size={15} className="text-cyan-400" />
                <span>{contextMenu.item.is_dir ? 'Open Folder' : 'Open / View'}</span>
                <span className="context-menu-shortcut">Enter</span>
              </div>

              {viewMode === 'dual' && (
                <div
                  className="context-menu-item"
                  onClick={() => {
                    if (contextMenu.pane === 'left') transferLeftToRight(false);
                    else transferRightToLeft(false);
                    setContextMenu(prev => ({ ...prev, visible: false }));
                  }}
                >
                  {contextMenu.pane === 'left' ? <ArrowRight size={15} className="text-blue-400" /> : <ArrowLeft size={15} className="text-blue-400" />}
                  <span>Transfer to {contextMenu.pane === 'left' ? 'Right Pane' : 'Left Pane'}</span>
                  <span className="context-menu-shortcut">F5</span>
                </div>
              )}

              {!contextMenu.item.is_dir && (
                <div
                  className="context-menu-item"
                  onClick={() => {
                    const selected = contextMenu.pane === 'left' ? leftSelected : rightSelected;
                    const items = contextMenu.pane === 'left' ? leftItems : rightItems;
                    const targetItems = selected.length > 0 
                      ? items.filter(i => selected.includes(i.name)) 
                      : [contextMenu.item!];
                    handleMultiDownload(targetItems, contextMenu.pane);
                  }}
                >
                  <Download size={15} className="text-emerald-400" />
                  <span>Download to PC</span>
                </div>
              )}

              {viewMode === 'dual' && (
                <div
                  className="context-menu-item"
                  onClick={() => {
                    if (contextMenu.pane === 'left') transferLeftToRight(true);
                    else transferRightToLeft(true);
                    setContextMenu(prev => ({ ...prev, visible: false }));
                  }}
                >
                  <Shield size={15} className="text-emerald-400" />
                  <span>Encrypt (AES-256) & Transfer</span>
                </div>
              )}

              <div className="context-menu-separator" />

              <div className="context-menu-item" onClick={() => handleCut(contextMenu.pane)}>
                <Scissors size={15} className="text-slate-400" />
                <span>Cut</span>
                <span className="context-menu-shortcut">Ctrl+X</span>
              </div>

              <div className="context-menu-item" onClick={() => handleCopy(contextMenu.pane)}>
                <Copy size={15} className="text-slate-400" />
                <span>Copy</span>
                <span className="context-menu-shortcut">Ctrl+C</span>
              </div>

              <div
                className={`context-menu-item ${!clipboard ? 'disabled' : ''}`}
                onClick={() => handlePaste(contextMenu.pane)}
              >
                <Clipboard size={15} className="text-slate-400" />
                <span>Paste</span>
                <span className="context-menu-shortcut">Ctrl+V</span>
              </div>

              <div className="context-menu-separator" />

              <div
                className="context-menu-item"
                onClick={() => {
                  setRenameModal({
                    open: true,
                    item: contextMenu.item,
                    newName: contextMenu.item!.name,
                    pane: contextMenu.pane
                  });
                  setContextMenu(prev => ({ ...prev, visible: false }));
                }}
              >
                <Edit3 size={15} className="text-amber-400" />
                <span>Rename</span>
                <span className="context-menu-shortcut">F2</span>
              </div>

              <div
                className="context-menu-item danger"
                onClick={() => {
                  handleDeleteSelection(contextMenu.pane);
                  setContextMenu(prev => ({ ...prev, visible: false }));
                }}
              >
                <Trash2 size={15} className="text-red-400" />
                <span>Delete</span>
                <span className="context-menu-shortcut">Del</span>
              </div>

              <div className="context-menu-separator" />

              <div
                className="context-menu-item"
                onClick={() => {
                  const selected = contextMenu.pane === 'left' ? leftSelected : rightSelected;
                  const items = contextMenu.pane === 'left' ? leftItems : rightItems;
                  const targetItems = selected.length > 0 
                    ? items.filter(i => selected.includes(i.name)) 
                    : (contextMenu.item ? [contextMenu.item] : []);
                  handleOpenShareModal(targetItems, contextMenu.pane);
                }}
              >
                <Share2 size={15} className="text-indigo-400" />
                <span>Share Link...</span>
              </div>

              <div
                className="context-menu-item"
                onClick={() => {
                  setShowNewFolderModal({ open: true, pane: contextMenu.pane });
                  setContextMenu(prev => ({ ...prev, visible: false }));
                }}
              >
                <FolderPlus size={15} className="text-amber-400" />
                <span>New Folder</span>
              </div>

              <div className="context-menu-separator" />

              <div
                className="context-menu-item"
                onClick={() => {
                  setPropertiesModal({
                    open: true,
                    item: contextMenu.item,
                    pane: contextMenu.pane
                  });
                  setContextMenu(prev => ({ ...prev, visible: false }));
                }}
              >
                <Info size={15} className="text-sky-400" />
                <span>Properties</span>
                <span className="context-menu-shortcut">Alt+Enter</span>
              </div>
            </>
          ) : (
            <>
              {/* Empty Space Context Menu */}
              <div
                className="context-menu-item"
                onClick={() => {
                  setShowNewFolderModal({ open: true, pane: contextMenu.pane });
                  setContextMenu(prev => ({ ...prev, visible: false }));
                }}
              >
                <FolderPlus size={15} className="text-amber-400" />
                <span>New Folder</span>
              </div>

              <div
                className="context-menu-item"
                onClick={() => {
                  if (contextMenu.pane === 'left') fileInputRefLeft.current?.click();
                  else fileInputRefRight.current?.click();
                  setContextMenu(prev => ({ ...prev, visible: false }));
                }}
              >
                <Upload size={15} className="text-emerald-400" />
                <span>Upload Files</span>
              </div>

              <div
                className={`context-menu-item ${!clipboard ? 'disabled' : ''}`}
                onClick={() => handlePaste(contextMenu.pane)}
              >
                <Clipboard size={15} className="text-slate-400" />
                <span>Paste</span>
                <span className="context-menu-shortcut">Ctrl+V</span>
              </div>

              <div className="context-menu-separator" />

              <div
                className="context-menu-item"
                onClick={() => {
                  if (contextMenu.pane === 'left') refreshLeft(true);
                  else refreshRight(true);
                  setContextMenu(prev => ({ ...prev, visible: false }));
                }}
              >
                <RefreshCw size={15} className="text-cyan-400" />
                <span>Refresh</span>
                <span className="context-menu-shortcut">F5</span>
              </div>
            </>
          )}
        </div>
      )}

      {/* --- MODAL: SHARE LINK (AIR EXPLORER STYLE) --- */}
      {shareModal.open && (
        <div className="modal-overlay" onClick={() => setShareModal({ ...shareModal, open: false })}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 540 }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Share2 size={18} className="text-cyan-400" />
                <span style={{ fontWeight: 600 }}>Share Link</span>
              </div>
              <button className="btn-icon" onClick={() => setShareModal({ ...shareModal, open: false })}>
                <X size={16} />
              </button>
            </div>

            <div className="modal-body" style={{ gap: 14 }}>
              <div style={{
                maxHeight: 90, overflowY: 'auto', background: '#0b0f19',
                borderRadius: 6, padding: '8px 12px', border: '1px solid #1e293b',
                display: 'flex', flexDirection: 'column', gap: 4
              }}>
                {shareModal.items.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                    <File size={15} className="text-cyan-400" />
                    <span style={{ fontWeight: 500, color: '#f8fafc' }}>{item.name}</span>
                    <span style={{ fontSize: 11, color: '#64748b', marginLeft: 'auto' }}>{formatBytes(item.size)}</span>
                  </div>
                ))}
              </div>

              <div className="form-group">
                <textarea
                  readOnly
                  rows={Math.min(6, Math.max(3, shareModal.links.length))}
                  style={{
                    background: '#080d1a', border: '1px solid #334155', borderRadius: 6,
                    padding: '10px 12px', color: '#38bdf8', fontFamily: 'monospace',
                    fontSize: 12, resize: 'none', outline: 'none', lineHeight: 1.6
                  }}
                  value={shareModal.loading ? 'Generating public sharing links from cloud...' : shareModal.links.join('\n')}
                  onFocus={(e) => e.target.select()}
                />
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  className="btn btn-secondary"
                  style={{ flex: 1, justifyContent: 'center', padding: '8px 14px' }}
                  onClick={() => {
                    navigator.clipboard.writeText(shareModal.links.join('\n'));
                    setShareModal(prev => ({ ...prev, copied: true }));
                    notify('Public link(s) copied to clipboard!', 'success');
                    setTimeout(() => setShareModal(prev => ({ ...prev, copied: false })), 3000);
                  }}
                  disabled={shareModal.loading}
                >
                  {shareModal.copied ? <Check size={15} className="text-emerald-400" /> : <Copy size={15} />}
                  <span>{shareModal.copied ? 'Copied to Clipboard!' : 'Copy to Clipboard'}</span>
                </button>

                <button
                  className="btn btn-secondary"
                  style={{ flex: 1, justifyContent: 'center', padding: '8px 14px' }}
                  onClick={() => {
                    const subject = encodeURIComponent(`Shared File: ${shareModal.items.map(i => i.name).join(', ')}`);
                    const body = encodeURIComponent(`Here are the link(s) to download the file(s):\n\n${shareModal.links.join('\n')}\n\nShared via OpenMultiExplorer`);
                    window.location.href = `mailto:?subject=${subject}&body=${body}`;
                  }}
                  disabled={shareModal.loading}
                >
                  <ExternalLink size={15} />
                  <span>Send by email</span>
                </button>
              </div>

              <div style={{ fontSize: 12, color: '#94a3b8' }}>
                Share this link with other people. Anyone with this link will be able to download the file.
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                style={{ minWidth: 80, justifyContent: 'center' }}
                onClick={() => setShareModal({ ...shareModal, open: false })}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL: RENAME --- */}
      {renameModal.open && (
        <div className="modal-overlay" onClick={() => setRenameModal({ open: false, item: null, newName: '', pane: 'left' })}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <div className="modal-header">
              <span style={{ fontWeight: 600 }}>Rename Item</span>
              <button className="btn-icon" onClick={() => setRenameModal({ open: false, item: null, newName: '', pane: 'left' })}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">New Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={renameModal.newName}
                  autoFocus
                  onChange={(e) => setRenameModal({ ...renameModal, newName: e.target.value })}
                  onKeyDown={(e) => e.key === 'Enter' && handleRenameSubmit()}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setRenameModal({ open: false, item: null, newName: '', pane: 'left' })}>Cancel</button>
              <button className="btn btn-primary" onClick={handleRenameSubmit}>Rename</button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL: PROPERTIES --- */}
      {propertiesModal.open && propertiesModal.item && (
        <div className="modal-overlay" onClick={() => setPropertiesModal({ open: false, item: null, pane: 'left' })}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Info size={18} className="text-sky-400" />
                <span style={{ fontWeight: 600 }}>Properties</span>
              </div>
              <button className="btn-icon" onClick={() => setPropertiesModal({ open: false, item: null, pane: 'left' })}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 10, borderBottom: '1px solid #1e293b' }}>
                {propertiesModal.item.is_dir ? <Folder size={32} className="text-amber-400" /> : <File size={32} className="text-slate-400" />}
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{propertiesModal.item.name}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>{propertiesModal.item.is_dir ? 'Directory / Folder' : 'Data File'}</div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>Location / Path:</span>
                  <span style={{ fontFamily: 'monospace', color: '#38bdf8', maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis' }}>{propertiesModal.item.path}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>Account:</span>
                  <span>{accounts.find(a => a.id === (propertiesModal.pane === 'left' ? leftAccountId : rightAccountId))?.name}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>Size:</span>
                  <span>{propertiesModal.item.is_dir ? '—' : `${formatBytes(propertiesModal.item.size)} (${propertiesModal.item.size.toLocaleString()} bytes)`}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>Modified:</span>
                  <span>{propertiesModal.item.modified || 'Unknown'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>Encryption:</span>
                  <span>{propertiesModal.item.is_encrypted ? <span className="enc-badge"><Lock size={10} /> AES-256 Encrypted</span> : 'Standard Plaintext'}</span>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              {!propertiesModal.item.is_dir && (
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    handleDownloadDirect(propertiesModal.item!, propertiesModal.pane);
                    setPropertiesModal({ open: false, item: null, pane: 'left' });
                  }}
                >
                  <Download size={14} />
                  <span>Download File</span>
                </button>
              )}
              <button className="btn btn-secondary" onClick={() => setPropertiesModal({ open: false, item: null, pane: 'left' })}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL: ACCOUNT MANAGER --- */}
      {showAccountModal && (
        <div className="modal-overlay" onClick={() => setShowAccountModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 720 }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Cloud className="text-cyan-400" size={18} />
                <span style={{ fontWeight: 600 }}>Connected Accounts ({accounts.filter(a => a.id !== 'local-pc').length})</span>
              </div>
              <button className="btn-icon" onClick={() => setShowAccountModal(false)}><X size={16} /></button>
            </div>

            <div className="modal-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 180, overflowY: 'auto' }}>
                {accounts.filter(a => a.id !== 'local-pc').map(acc => (
                  <div key={acc.id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '8px 12px', background: '#0b0f19', border: '1px solid #1e293b', borderRadius: 6
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {getProviderIcon(acc.type)}
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{acc.name}</div>
                        <div style={{ fontSize: 11, color: '#64748b' }}>
                          Provider: {acc.type.toUpperCase()} {acc.subtitle ? `• ${acc.subtitle}` : ''}
                        </div>
                      </div>
                    </div>
                    <button className="btn btn-danger btn-icon" onClick={() => handleDeleteAccount(acc.id)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                {accounts.filter(a => a.id !== 'local-pc').length === 0 && (
                  <div style={{ textAlign: 'center', color: '#64748b', padding: 20 }}>
                    No custom accounts added yet. Add an account below.
                  </div>
                )}
              </div>

              <hr style={{ borderColor: '#1e293b' }} />

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <span style={{ fontWeight: 600, fontSize: 13, color: '#38bdf8' }}>+ Add New Cloud Account</span>

                <div className="form-group">
                  <label className="form-label">Select Cloud Service / Protocol</label>
                  <select
                    className="account-select"
                    value={selectedProviderType}
                    onChange={(e) => {
                      setSelectedProviderType(e.target.value);
                      const schema = supportedProviders.find(p => p.type === e.target.value);
                      setAccountFormData({ name: `${schema?.name || 'Cloud'} Account` });
                    }}
                  >
                    {supportedProviders.map(p => (
                      <option key={p.type} value={p.type}>
                        {p.name} {p.verified ? '✓' : ''} — [{p.category}]
                      </option>
                    ))}
                  </select>
                </div>

                {supportedProviders.find(p => p.type === selectedProviderType)?.verified && (
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '4px 10px',
                    background: 'rgba(16, 185, 129, 0.12)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    borderRadius: 6,
                    color: '#34d399',
                    fontSize: 12,
                    fontWeight: 600,
                    width: 'fit-content'
                  }}>
                    <VerifiedShieldIcon size={18} />
                    <span>Verified Provider (Live API Tested & Approved by Developer)</span>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Account Friendly Name (optional)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={accountFormData.name || ''}
                    placeholder="Leave blank to auto-fetch name / email / endpoint"
                    onChange={(e) => setAccountFormData({ ...accountFormData, name: e.target.value })}
                  />
                </div>

                {supportedProviders.find(p => p.type === selectedProviderType)?.fields.map(field => (
                  <div className="form-group" key={field.key}>
                    <label className="form-label">{field.label}</label>
                    <input
                      type={field.type === 'password' ? 'password' : 'text'}
                      className="form-input"
                      value={accountFormData[field.key] || ''}
                      onChange={(e) => setAccountFormData({ ...accountFormData, [field.key]: e.target.value })}
                    />
                  </div>
                ))}

                {/* Verified Badge Notice & Feedback Info */}
                <div style={{
                  marginTop: 14,
                  padding: '10px 14px',
                  background: 'rgba(16, 185, 129, 0.08)',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  borderRadius: 6,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10
                }}>
                  <VerifiedShieldIcon size={22} />
                  <div style={{ fontSize: 12, color: '#cbd5e1', lineHeight: 1.5 }}>
                    <strong style={{ color: '#34d399' }}>Verified Cloud:</strong> Cloud providers marked with this shield icon (such as <strong>MediaFire</strong> and <strong>This PC</strong>) have been directly tested and verified with active accounts by the developer. This app is actively under development — if you encounter any issues or have feature suggestions, please connect on our{' '}
                    <a
                      href="https://github.com/saur8bh/OpenMultiExplorer"
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: '#38bdf8', textDecoration: 'underline', fontWeight: 600 }}
                    >
                      GitHub repository
                    </a>!
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowAccountModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSaveAccount}>Connect Account</button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL: FOLDER SYNCHRONIZATION --- */}
      {showSyncModal && (
        <div className="modal-overlay" onClick={() => setShowSyncModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 680 }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <ArrowLeftRight className="text-emerald-400" size={18} />
                <span style={{ fontWeight: 600 }}>Folder Synchronization Wizard</span>
              </div>
              <button className="btn-icon" onClick={() => setShowSyncModal(false)}><X size={16} /></button>
            </div>

            <div className="modal-body">
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }} className="form-group">
                  <label className="form-label">Source Folder</label>
                  <div style={{ padding: '8px 12px', background: '#0b0f19', border: '1px solid #1e293b', borderRadius: 6, fontSize: 12 }}>
                    <strong>{syncDirection === 'left-to-right' ? accounts.find(a => a.id === leftAccountId)?.name : accounts.find(a => a.id === rightAccountId)?.name}</strong>: {syncDirection === 'left-to-right' ? leftPath : rightPath}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <button
                    className="btn btn-secondary btn-icon"
                    onClick={() => {
                      setSyncDirection(syncDirection === 'left-to-right' ? 'right-to-left' : 'left-to-right');
                      setSyncAnalysis(null);
                    }}
                    title="Swap direction"
                  >
                    <ArrowLeftRight size={16} />
                  </button>
                </div>

                <div style={{ flex: 1 }} className="form-group">
                  <label className="form-label">Target Folder</label>
                  <div style={{ padding: '8px 12px', background: '#0b0f19', border: '1px solid #1e293b', borderRadius: 6, fontSize: 12 }}>
                    <strong>{syncDirection === 'left-to-right' ? accounts.find(a => a.id === rightAccountId)?.name : accounts.find(a => a.id === leftAccountId)?.name}</strong>: {syncDirection === 'left-to-right' ? rightPath : leftPath}
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Sync Mode</label>
                <select
                  className="account-select"
                  value={syncMode}
                  onChange={(e) => { setSyncMode(e.target.value); setSyncAnalysis(null); }}
                >
                  <option value="mirror">Mirror (Make Target identical to Source)</option>
                  <option value="update">Update (Copy new and modified files to Target)</option>
                  <option value="bidirectional">Bidirectional (Two-way synchronization)</option>
                </select>
              </div>

              {!syncAnalysis ? (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <button className="btn btn-primary" onClick={handleAnalyzeSync} disabled={syncAnalyzing}>
                    {syncAnalyzing ? 'Analyzing Folder Differences...' : 'Analyze Differences & Preview'}
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <span style={{ fontWeight: 600 }}>Diff Summary: {syncAnalysis.total_actions} action(s) needed</span>
                    <button className="btn btn-secondary" style={{ padding: '2px 8px', fontSize: 11 }} onClick={handleAnalyzeSync}>
                      Re-scan
                    </button>
                  </div>
                  <div style={{ maxHeight: 180, overflowY: 'auto', background: '#0b0f19', border: '1px solid #1e293b', borderRadius: 6, padding: 8 }}>
                    {syncAnalysis.actions.map((act: any, idx: number) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '4px 0', borderBottom: '1px solid #151d30' }}>
                        <span>{act.direction} <strong>{act.filename}</strong></span>
                        <span style={{ color: act.action.includes('delete') ? '#f87171' : '#34d399' }}>{act.description}</span>
                      </div>
                    ))}
                    {syncAnalysis.actions.length === 0 && (
                      <div style={{ textAlign: 'center', color: '#10b981', padding: 12 }}>
                        Folders are in sync! No actions needed.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowSyncModal(false)}>Close</button>
              {syncAnalysis && syncAnalysis.actions.length > 0 && (
                <button className="btn btn-success" onClick={handleExecuteSync}>
                  Start Synchronization ({syncAnalysis.actions.length} tasks)
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL: MULTI-CLOUD SEARCH --- */}
      {showSearchModal && (
        <div className="modal-overlay" onClick={() => setShowSearchModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 760 }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Search className="text-cyan-400" size={18} />
                <span style={{ fontWeight: 600 }}>Search Across Connected Clouds</span>
              </div>
              <button className="btn-icon" onClick={() => setShowSearchModal(false)}><X size={16} /></button>
            </div>

            <div className="modal-body">
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  className="form-input"
                  style={{ flex: 1 }}
                  placeholder="Enter file name, extension or keyword..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <button className="btn btn-primary" onClick={handleSearch} disabled={searchLoading}>
                  {searchLoading ? 'Searching...' : 'Search'}
                </button>
              </div>

              <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                <table className="file-table">
                  <thead>
                    <tr>
                      <th>Account</th>
                      <th>Filename</th>
                      <th>Path</th>
                      <th>Size</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {searchResults.map((item, idx) => (
                      <tr key={idx} className="file-row">
                        <td>
                          <span style={{ fontSize: 11, background: '#1e293b', padding: '2px 6px', borderRadius: 4 }}>
                            {item.account_name}
                          </span>
                        </td>
                        <td>
                          <div className="file-name-cell">
                            {item.is_dir ? <Folder size={14} className="text-amber-400" /> : <File size={14} className="text-slate-400" />}
                            <span>{item.name}</span>
                          </div>
                        </td>
                        <td style={{ color: '#64748b', fontSize: 11 }}>{item.path}</td>
                        <td>{formatBytes(item.size)}</td>
                        <td>
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '2px 8px', fontSize: 11 }}
                            onClick={() => {
                              selectAccountForActiveTab(item.account_id, 'left');
                              const folder = item.path.split('/').slice(0, -1).join('/') || '/';
                              setLeftTabs(prev => prev.map(t => t.id === activeLeftTabId ? { ...t, path: folder, title: item.name } : t));
                              setShowSearchModal(false);
                            }}
                          >
                            Jump
                          </button>
                        </td>
                      </tr>
                    ))}
                    {searchResults.length === 0 && (
                      <tr>
                        <td colSpan={5} style={{ textAlign: 'center', padding: 30, color: '#64748b' }}>
                          {searchLoading ? 'Searching connected accounts...' : 'No search results yet.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowSearchModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL: CLIENT-SIDE AES-256 VAULT SETTINGS --- */}
      {showCryptoModal && (
        <div className="modal-overlay" onClick={() => setShowCryptoModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 540 }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Shield className="text-emerald-400" size={18} />
                <span style={{ fontWeight: 600 }}>Client-Side Transparent AES-256 Vault</span>
              </div>
              <button className="btn-icon" onClick={() => setShowCryptoModal(false)}><X size={16} /></button>
            </div>

            <div className="modal-body">
              <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.5 }}>
                Encrypt files on the fly before they leave your computer using AES-256-GCM. Cloud providers only receive encrypted binary data and cannot view your content.
              </p>

              <div className="form-group">
                <label className="form-label">Master Encryption Passphrase</label>
                <input
                  type="password"
                  className="form-input"
                  value={passphrase}
                  onChange={(e) => setPassphrase(e.target.value)}
                  placeholder="Enter your strong encryption passphrase"
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#0b0f19', padding: '12px 14px', borderRadius: 6, border: '1px solid #1e293b' }}>
                <input
                  type="checkbox"
                  id="chk-encrypt-default"
                  checked={encryptByDefault}
                  onChange={(e) => setEncryptByDefault(e.target.checked)}
                />
                <label htmlFor="chk-encrypt-default" style={{ fontSize: 13, cursor: 'pointer' }}>
                  <strong>Encrypt all outgoing file transfers & uploads</strong>
                  <div style={{ fontSize: 11, color: '#64748b' }}>Automatically encrypts file contents and obfuscates filenames</div>
                </label>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-primary" onClick={() => {
                notify('Encryption vault passphrase updated!', 'success');
                setShowCryptoModal(false);
              }}>
                Save & Apply Passphrase
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL: NEW FOLDER --- */}
      {showNewFolderModal.open && (
        <div className="modal-overlay" onClick={() => setShowNewFolderModal({ open: false, pane: 'left' })}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <div className="modal-header">
              <span style={{ fontWeight: 600 }}>Create New Directory</span>
              <button className="btn-icon" onClick={() => setShowNewFolderModal({ open: false, pane: 'left' })}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Folder Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="New Folder"
                  autoFocus
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowNewFolderModal({ open: false, pane: 'left' })}>Cancel</button>
              <button className="btn btn-primary" onClick={handleCreateFolder}>Create</button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL: APPLICATION SETTINGS & PREFERENCES --- */}
      {showSettingsModal && (
        <div className="modal-overlay" onClick={() => setShowSettingsModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 580 }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Settings className="text-cyan-400" size={18} />
                <span style={{ fontWeight: 600 }}>Preferences & Customization</span>
              </div>
              <button className="btn-icon" onClick={() => setShowSettingsModal(false)}><X size={16} /></button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Default Sorting Options */}
              <div style={{ background: '#0b0f19', border: '1px solid #1e293b', borderRadius: 8, padding: 14 }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: '#38bdf8', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Sliders size={14} /> Default File Sorting
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">Sort Column By Default</label>
                    <select
                      className="account-select"
                      value={settings.defaultSortBy}
                      onChange={(e) => setSettings({ ...settings, defaultSortBy: e.target.value as any })}
                    >
                      <option value="modified">Last Modified Date (Recommended)</option>
                      <option value="name">File Name (Alphabetical)</option>
                      <option value="size">File Size</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Default Sort Direction</label>
                    <select
                      className="account-select"
                      value={settings.defaultSortOrder}
                      onChange={(e) => setSettings({ ...settings, defaultSortOrder: e.target.value as any })}
                    >
                      <option value="desc">Descending (Newest first / Z-A)</option>
                      <option value="asc">Ascending (Oldest first / A-Z)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Workspace Layout */}
              <div style={{ background: '#0b0f19', border: '1px solid #1e293b', borderRadius: 8, padding: 14 }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: '#38bdf8', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Monitor size={14} /> Default Workspace Layout
                </div>

                <div className="form-group">
                  <label className="form-label">Startup View Mode</label>
                  <select
                    className="account-select"
                    value={settings.defaultViewMode}
                    onChange={(e) => setSettings({ ...settings, defaultViewMode: e.target.value as any })}
                  >
                    <option value="single">One Panel (Single View - Maximized file browsing)</option>
                    <option value="dual">Two Panels (Dual View - Cloud-to-cloud synchronization)</option>
                  </select>
                </div>
              </div>

              {/* Transfer Throttling */}
              <div style={{ background: '#0b0f19', border: '1px solid #1e293b', borderRadius: 8, padding: 14 }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: '#38bdf8', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Download size={14} /> Bandwidth Throttling / Speed Limit
                </div>

                <div className="form-group">
                  <label className="form-label">Transfer Speed Cap</label>
                  <select
                    className="account-select"
                    value={settings.speedLimitKbps}
                    onChange={(e) => setSettings({ ...settings, speedLimitKbps: Number(e.target.value) })}
                  >
                    <option value={0}>Unlimited (Full Line Rate)</option>
                    <option value={50000}>50 MB/s (High Speed)</option>
                    <option value={10000}>10 MB/s (Standard Broadband)</option>
                    <option value={5000}>5 MB/s (Conservative)</option>
                    <option value={1000}>1 MB/s (Low Bandwidth)</option>
                  </select>
                </div>
              </div>

              {/* Developer Notice & GitHub repo */}
              <div style={{
                background: 'rgba(56, 189, 248, 0.06)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                borderRadius: 8,
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10
              }}>
                <ExternalLink size={16} className="text-cyan-400 shrink-0" style={{ marginTop: 2 }} />
                <div style={{ fontSize: 12, color: '#cbd5e1', lineHeight: 1.5 }}>
                  <strong style={{ color: '#38bdf8' }}>OpenMultiExplorer Pro v1.0</strong> (Under Active Development)
                  <br />
                  For feature suggestions, cloud provider requests, or bug reports, please connect with us on the{' '}
                  <a
                    href="https://github.com/saur8bh/OpenMultiExplorer"
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: '#38bdf8', textDecoration: 'underline', fontWeight: 600 }}
                  >
                    GitHub repository
                  </a>.
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowSettingsModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={() => handleSaveSettings(settings)}>Save & Apply Preferences</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
