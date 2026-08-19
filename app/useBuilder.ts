'use client';
import { useCallback, useMemo, useState } from 'react';
import { toEmbedUrl, parseUrl } from '@/lib/embed';
import {
  CLASS_THEME, DEFAULT_SESSION_DURATION, FEATURE_ORDER, MAX_SESSION_DURATION,
  MAX_TEXT_LENGTH, MAX_URL_LENGTH, MAX_WATERMARK_LENGTH, MIN_SESSION_DURATION,
  featureFlags, type FeatureName, type PortalConfig,
} from '@/lib/types';

export interface FeatureMeta { name: FeatureName; label: string; blurb: string; def: boolean }

export const FEATURES: FeatureMeta[] = [
  { name: 'copyProtect',       label: 'Copy / Paste Protection', blurb: 'Block clipboard operations, text selection, dragging and right-click', def: true },
  { name: 'screenshotProtect', label: 'Screenshot Protection',   blurb: 'Blank the content while the tab is hidden or the window is in the background', def: true },
  { name: 'printBlock',        label: 'Print Blocking',          blurb: 'Suppress printed output and intercept the print shortcut', def: true },
  { name: 'devtoolsDetect',    label: 'DevTools Detection',      blurb: 'Hide the document while developer tools are open; restores when they close', def: true },
  { name: 'watermark',         label: 'Watermark Overlay',       blurb: 'Semi-transparent repeating watermark across the document', def: true },
  { name: 'idleLock',          label: 'Idle Auto-Lock',          blurb: 'Lock after 5 minutes idle; extended while the document itself is focused', def: true },
  { name: 'sessionTimer',      label: 'Session Timer',           blurb: 'Wall-clock countdown that expires the session', def: true },
  { name: 'frameGuard',        label: 'Toolbar Guard',           blurb: "Cover the viewer's built-in download / print / pop-out controls", def: true },
  { name: 'xorEncrypt',        label: 'Obfuscate Source URL',    blurb: 'XOR-encode the document link with a per-portal random key', def: true },
  { name: 'frameSandbox',      label: 'Strict Frame Sandbox',    blurb: "Blocks in-viewer downloads, but Google's viewer can load slowly or not at all under it", def: false },
];

export function useBuilder() {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [owner, setOwner] = useState('');
  const [classification, setClassification] = useState('Confidential');
  const [access, setAccess] = useState('View Only');
  const [session, setSession] = useState(String(DEFAULT_SESSION_DURATION));
  const [watermark, setWatermark] = useState('CONFIDENTIAL • VIEW ONLY');
  const [flags, setFlags] = useState<Record<string, boolean>>(
    () => Object.fromEntries(FEATURES.map((f) => [f.name, f.def])),
  );

  const toggle = useCallback((name: string) => {
    setFlags((f) => ({ ...f, [name]: !f[name] }));
  }, []);

  const embedUrl = useMemo(() => (parseUrl(url) ? toEmbedUrl(url) : ''), [url]);

  const errors = useMemo(() => {
    const e: Record<string, string> = {};
    const u = url.trim();
    if (u) {
      if (u.length > MAX_URL_LENGTH) e.url = `URL must not exceed ${MAX_URL_LENGTH} characters.`;
      else if (!parseUrl(u)) e.url = 'Enter a valid http:// or https:// URL.';
    }
    if (title.trim().length > MAX_TEXT_LENGTH) e.title = `Title must not exceed ${MAX_TEXT_LENGTH} characters.`;
    if (owner.trim().length > MAX_TEXT_LENGTH) e.owner = `Owner must not exceed ${MAX_TEXT_LENGTH} characters.`;
    if (watermark.trim().length > MAX_WATERMARK_LENGTH) e.watermark = `Watermark must not exceed ${MAX_WATERMARK_LENGTH} characters.`;
    return e;
  }, [url, title, owner, watermark]);

  const ready = !!parseUrl(url) && title.trim().length > 0 && owner.trim().length > 0
    && Object.keys(errors).length === 0;

  const clampSession = useCallback(() => {
    let n = parseInt(session, 10);
    if (!isFinite(n)) n = DEFAULT_SESSION_DURATION;
    n = Math.min(MAX_SESSION_DURATION, Math.max(MIN_SESSION_DURATION, n));
    setSession(String(n));
    return n;
  }, [session]);

  const config = useCallback((): PortalConfig => {
    let n = parseInt(session, 10);
    if (!isFinite(n)) n = DEFAULT_SESSION_DURATION;
    n = Math.min(MAX_SESSION_DURATION, Math.max(MIN_SESSION_DURATION, n));
    return {
      u: toEmbedUrl(url.trim()),
      t: title.trim(),
      o: owner.trim(),
      c: CLASS_THEME[classification] ? classification : 'Confidential',
      a: access,
      s: n,
      w: watermark.trim(),
      f: featureFlags(flags),
    };
  }, [url, title, owner, classification, access, session, watermark, flags]);

  return {
    url, setUrl, title, setTitle, owner, setOwner,
    classification, setClassification, access, setAccess,
    session, setSession, clampSession, watermark, setWatermark,
    flags, toggle, embedUrl, errors, ready, config,
    classNames: Object.keys(CLASS_THEME),
    featureOrder: FEATURE_ORDER,
  };
}
