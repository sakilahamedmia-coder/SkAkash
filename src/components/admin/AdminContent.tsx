import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Image as ImageIcon,
  Play,
  MessageCircle,
  Send,
  Plus,
  Trash2,
  Edit2,
  Save,
  Check,
  Megaphone,
  X,
  Building2,
  FileCheck2,
  Upload,
  ShieldCheck
} from 'lucide-react';
import { Banner, VideoBanner, CompanyLicenseDocument, CompanyProfileInfo } from '../../types';

function compressImageToDataUrl(file: File, maxDim = 1280): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || '');
      const img = new window.Image();
      img.onload = () => {
        const scale = Math.min(1, maxDim / Math.max(img.width || 1, img.height || 1));
        const targetW = Math.max(1, Math.round(img.width * scale));
        const targetH = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(dataUrl);
          return;
        }
        ctx.drawImage(img, 0, 0, targetW, targetH);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    };
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.readAsDataURL(file);
  });
}

export const AdminContent: React.FC = () => {
  const {
    banners,
    videoBanners,
    settings,
    updateBanners,
    updateVideoBanners,
    updateSettings,
    addToast
  } = useApp();

  // Social & Announcement states
  const [whatsappLink, setWhatsappLink] = useState(settings?.whatsappLink || '');
  const [telegramLink, setTelegramLink] = useState(settings?.telegramLink || '');
  const [announcement, setAnnouncement] = useState(settings?.announcement || '');

  // Company Info & License Documents states
  const [companyInfo, setCompanyInfo] = useState<CompanyProfileInfo>(() => ({
    companyName: settings?.companyInfo?.companyName || 'CryptoEarnGo Global Technologies Ltd.',
    registrationNumber: settings?.companyInfo?.registrationNumber || 'CEG-REG-2024-88412',
    jurisdiction: settings?.companyInfo?.jurisdiction || 'Singapore · ACRA Registered FinTech Entity',
    foundedYear: settings?.companyInfo?.foundedYear || '2024',
    headquarters: settings?.companyInfo?.headquarters || '10 Marina Boulevard, Marina Bay Financial Centre, Singapore',
    officialEmail: settings?.companyInfo?.officialEmail || 'support@cryptoearngo.com',
    officialWebsite: settings?.companyInfo?.officialWebsite || 'https://cryptoearngo.com',
    description:
      settings?.companyInfo?.description ||
      'CryptoEarnGo is a transparent Web3 cloud compute and USDT reward ecosystem operating automated BEP-20 settlements, verified partner payouts, and 24/7 user support.',
    licenses: settings?.companyInfo?.licenses || []
  }));
  const [isSavingCompany, setIsSavingCompany] = useState(false);
  const [editingLicense, setEditingLicense] = useState<Partial<CompanyLicenseDocument> | null>(null);
  const [isCompressingImage, setIsCompressingImage] = useState(false);
  const licenseFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (settings?.companyInfo) {
      setCompanyInfo({
        companyName: settings.companyInfo.companyName || '',
        registrationNumber: settings.companyInfo.registrationNumber || '',
        jurisdiction: settings.companyInfo.jurisdiction || '',
        foundedYear: settings.companyInfo.foundedYear || '',
        headquarters: settings.companyInfo.headquarters || '',
        officialEmail: settings.companyInfo.officialEmail || '',
        officialWebsite: settings.companyInfo.officialWebsite || '',
        description: settings.companyInfo.description || '',
        licenses: settings.companyInfo.licenses || []
      });
    }
  }, [settings?.companyInfo]);

  // Banner editing
  const [editingBanner, setEditingBanner] = useState<Partial<Banner> | null>(null);

  // Video editing
  const [editingVideo, setEditingVideo] = useState<Partial<VideoBanner> | null>(null);

  const handleSaveCompanyInfo = async (e?: React.FormEvent, nextOverride?: CompanyProfileInfo) => {
    e?.preventDefault();
    const payload = nextOverride || companyInfo;
    setIsSavingCompany(true);
    const ok = await updateSettings({ companyInfo: payload });
    setIsSavingCompany(false);
    if (ok) {
      addToast('Company profile & license documents published to all users!', 'success');
    }
  };

  const handleLicenseFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      addToast('Please select a valid image file (PNG, JPG, WebP).', 'error');
      return;
    }
    try {
      setIsCompressingImage(true);
      const dataUrl = await compressImageToDataUrl(file);
      setEditingLicense((prev) => ({
        ...(prev || {}),
        imageUrl: dataUrl
      }));
      addToast('License document picture loaded cleanly!', 'success');
    } catch {
      addToast('Could not read the selected image.', 'error');
    } finally {
      setIsCompressingImage(false);
      e.target.value = '';
    }
  };

  const handleSaveLicenseDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLicense?.imageUrl?.trim()) {
      addToast('Please upload a license document picture or provide an image URL.', 'warning');
      return;
    }
    const cleanDoc: CompanyLicenseDocument = {
      id: editingLicense.id || `lic-${Date.now()}`,
      title: (editingLicense.title || 'Company License Certificate').trim(),
      documentNumber: editingLicense.documentNumber?.trim() || undefined,
      issuingAuthority: editingLicense.issuingAuthority?.trim() || undefined,
      imageUrl: editingLicense.imageUrl.trim(),
      uploadedAt: editingLicense.uploadedAt || new Date().toISOString()
    };
    const nextLicenses = editingLicense.id
      ? companyInfo.licenses.map((doc) => (doc.id === editingLicense.id ? cleanDoc : doc))
      : [cleanDoc, ...companyInfo.licenses];

    const updatedInfo: CompanyProfileInfo = {
      ...companyInfo,
      licenses: nextLicenses
    };
    setCompanyInfo(updatedInfo);
    setEditingLicense(null);
    await handleSaveCompanyInfo(undefined, updatedInfo);
  };

  const handleDeleteLicenseDoc = async (docId: string) => {
    const updatedInfo: CompanyProfileInfo = {
      ...companyInfo,
      licenses: companyInfo.licenses.filter((d) => d.id !== docId)
    };
    setCompanyInfo(updatedInfo);
    await handleSaveCompanyInfo(undefined, updatedInfo);
  };

  const handleSaveLinks = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateSettings({
      whatsappLink: whatsappLink.trim(),
      telegramLink: telegramLink.trim(),
      announcement: announcement.trim()
    });
  };

  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBanner) return;

    let updatedList: Banner[];
    if (editingBanner.id) {
      updatedList = banners.map(b => (b.id === editingBanner.id ? (editingBanner as Banner) : b));
    } else {
      const newBanner: Banner = {
        id: `ban-${Date.now()}`,
        title: editingBanner.title || 'Special Promotion',
        subtitle: editingBanner.subtitle || '',
        imageUrl: editingBanner.imageUrl || 'https://images.unsplash.com/photo-1621416894569-0f39ed31d247?auto=format&fit=crop&w=1200&q=80',
        badge: editingBanner.badge || 'NEW',
        linkUrl: editingBanner.linkUrl || '/earn'
      };
      updatedList = [...banners, newBanner];
    }

    await updateBanners(updatedList);
    setEditingBanner(null);
  };

  const handleDeleteBanner = async (id: string) => {
    const updated = banners.filter(b => b.id !== id);
    await updateBanners(updated);
  };

  const handleSaveVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVideo) return;

    let updatedList: VideoBanner[];
    if (editingVideo.id) {
      updatedList = videoBanners.map(v => (v.id === editingVideo.id ? (editingVideo as VideoBanner) : v));
    } else {
      const newVideo: VideoBanner = {
        id: `vid-${Date.now()}`,
        title: editingVideo.title || 'How to Earn USDT on BEP-20',
        description: editingVideo.description || 'Quick visual tutorial.',
        videoUrl: editingVideo.videoUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        thumbnail: editingVideo.thumbnail || 'https://images.unsplash.com/photo-1642543492481-44e81e3914a7?auto=format&fit=crop&w=800&q=80',
        duration: editingVideo.duration || '2:00'
      };
      updatedList = [...videoBanners, newVideo];
    }

    await updateVideoBanners(updatedList);
    setEditingVideo(null);
  };

  const handleDeleteVideo = async (id: string) => {
    const updated = videoBanners.filter(v => v.id !== id);
    await updateVideoBanners(updated);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight flex items-center space-x-2">
          <ImageIcon className="w-6 h-6 text-amber-400" />
          <span>Dynamic Media & Community Content Management</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Admins can change promotional banners, instructional videos, and support links without releasing a new Android APK.
        </p>
      </div>

      {/* 1. ANNOUNCEMENTS & SOCIAL LINKS */}
      <form onSubmit={handleSaveLinks} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <Megaphone className="w-5 h-5 text-amber-400" />
            <h2 className="text-sm font-black text-white">Homepage Announcement & Support Links</h2>
          </div>
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 flex items-center space-x-1.5 transition-all"
          >
            <Save className="w-4 h-4" />
            <span>Save Links & Broadcast</span>
          </button>
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-400 block">
            Homepage Announcement Bar Text:
          </label>
          <input
            type="text"
            value={announcement}
            onChange={(e) => setAnnouncement(e.target.value)}
            placeholder="Announce promotions, network upgrades, or rewards..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-emerald-400 flex items-center space-x-1">
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Official WhatsApp Support Link:</span>
            </label>
            <input
              type="text"
              value={whatsappLink}
              onChange={(e) => setWhatsappLink(e.target.value)}
              placeholder="https://wa.me/1555..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-sky-400 flex items-center space-x-1">
              <Send className="w-3.5 h-3.5 -rotate-12" />
              <span>Official Telegram Channel / Group Link:</span>
            </label>
            <input
              type="text"
              value={telegramLink}
              onChange={(e) => setTelegramLink(e.target.value)}
              placeholder="https://t.me/CryptoEarnGo_Official"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
            />
          </div>
        </div>
      </form>

      {/* 1B. COMPANY INFORMATION & LICENSE DOCUMENTS MANAGER */}
      <form
        onSubmit={(e) => handleSaveCompanyInfo(e)}
        className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <Building2 className="w-5 h-5 text-emerald-400" />
            <div>
              <h2 className="text-sm font-black text-white">
                Company Profile &amp; License Documents ({companyInfo.licenses.length})
              </h2>
              <p className="text-[11px] text-slate-400">
                Upload company registration certificates and licenses for regular users to inspect inside Profile.
              </p>
            </div>
          </div>
          <button
            type="submit"
            disabled={isSavingCompany}
            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-md shadow-emerald-500/20 flex items-center space-x-1.5 transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSavingCompany ? 'Saving...' : 'Save Company Info'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-400 block">Company Legal Name</label>
            <input
              type="text"
              required
              value={companyInfo.companyName}
              onChange={(e) => setCompanyInfo({ ...companyInfo, companyName: e.target.value })}
              placeholder="CryptoEarnGo Global Technologies Ltd."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-400 block">Registration / License Number</label>
            <input
              type="text"
              value={companyInfo.registrationNumber || ''}
              onChange={(e) => setCompanyInfo({ ...companyInfo, registrationNumber: e.target.value })}
              placeholder="CEG-REG-2024-88412"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-400 block">Jurisdiction / Country</label>
            <input
              type="text"
              value={companyInfo.jurisdiction || ''}
              onChange={(e) => setCompanyInfo({ ...companyInfo, jurisdiction: e.target.value })}
              placeholder="Singapore · ACRA Registered"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-400 block">Founded Year</label>
            <input
              type="text"
              value={companyInfo.foundedYear || ''}
              onChange={(e) => setCompanyInfo({ ...companyInfo, foundedYear: e.target.value })}
              placeholder="2024"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-400 block">Official Support Email</label>
            <input
              type="email"
              value={companyInfo.officialEmail || ''}
              onChange={(e) => setCompanyInfo({ ...companyInfo, officialEmail: e.target.value })}
              placeholder="support@cryptoearngo.com"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-400 block">Official Website</label>
            <input
              type="text"
              value={companyInfo.officialWebsite || ''}
              onChange={(e) => setCompanyInfo({ ...companyInfo, officialWebsite: e.target.value })}
              placeholder="https://cryptoearngo.com"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-400 block">Headquarters Address</label>
            <input
              type="text"
              value={companyInfo.headquarters || ''}
              onChange={(e) => setCompanyInfo({ ...companyInfo, headquarters: e.target.value })}
              placeholder="10 Marina Boulevard, Singapore"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-400 block">Company Overview &amp; Compliance Summary</label>
            <textarea
              rows={2}
              value={companyInfo.description || ''}
              onChange={(e) => setCompanyInfo({ ...companyInfo, description: e.target.value })}
              placeholder="Describe your company mission, compliance, and operations..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* License Document Pictures Gallery */}
        <div className="pt-3 border-t border-slate-800 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center space-x-2">
              <FileCheck2 className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold text-white">
                Uploaded License Document Pictures ({companyInfo.licenses.length})
              </span>
            </div>
            <button
              type="button"
              onClick={() =>
                setEditingLicense({
                  title: '',
                  documentNumber: '',
                  issuingAuthority: '',
                  imageUrl: ''
                })
              }
              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center space-x-1.5 shadow-md"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload License Picture</span>
            </button>
          </div>

          {companyInfo.licenses.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {companyInfo.licenses.map((doc) => (
                <div
                  key={doc.id}
                  className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden flex flex-col justify-between shadow-md"
                >
                  <div>
                    <div className="relative h-36 bg-slate-900 border-b border-slate-800">
                      <img
                        src={doc.imageUrl}
                        alt={doc.title}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute top-2 left-2 text-[9px] font-bold px-2 py-0.5 rounded bg-emerald-500 text-slate-950 flex items-center space-x-1">
                        <ShieldCheck className="w-3 h-3" />
                        <span>Verified Doc</span>
                      </span>
                    </div>
                    <div className="p-3 space-y-1">
                      <h4 className="text-xs font-bold text-white truncate">{doc.title}</h4>
                      {doc.documentNumber && (
                        <p className="text-[10px] font-mono text-amber-400 truncate">
                          No: {doc.documentNumber}
                        </p>
                      )}
                      {doc.issuingAuthority && (
                        <p className="text-[10px] text-slate-400 truncate">{doc.issuingAuthority}</p>
                      )}
                    </div>
                  </div>
                  <div className="px-3 pb-3 flex justify-end space-x-2">
                    <button
                      type="button"
                      onClick={() => setEditingLicense(doc)}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg border border-slate-700"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteLicenseDoc(doc.id)}
                      className="p-1.5 bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 rounded-lg"
                      title="Remove Document"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-700 bg-slate-950/60 p-5 text-center space-y-2">
              <FileCheck2 className="w-7 h-7 text-slate-500 mx-auto" />
              <p className="text-xs text-slate-400">
                No license document pictures uploaded yet. Click &ldquo;Upload License Picture&rdquo; to attach your business registration or compliance certificates.
              </p>
            </div>
          )}
        </div>
      </form>

      {/* 2. IMAGE BANNERS CAROUSEL MANAGER */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-sm font-black text-white">
              Promotional Image Carousel Banners ({banners.length})
            </h2>
            <p className="text-xs text-slate-400">
              Rotates on the top of the Android home screen.
            </p>
          </div>
          <button
            onClick={() =>
              setEditingBanner({
                title: '',
                subtitle: '',
                badge: 'FEATURED',
                imageUrl: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&w=1200&q=80',
                linkUrl: '/earn'
              })
            }
            className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center space-x-1.5 shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Add Banner</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {banners.map((ban) => (
            <div
              key={ban.id}
              className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-md flex flex-col justify-between"
            >
              <div>
                <div className="relative h-32 w-full bg-slate-900">
                  <img src={ban.imageUrl} alt={ban.title} className="w-full h-full object-cover" />
                  {ban.badge && (
                    <span className="absolute top-2 left-2 text-[9px] font-bold px-2 py-0.5 rounded bg-amber-500 text-slate-950 uppercase">
                      {ban.badge}
                    </span>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="text-xs font-bold text-white leading-snug">{ban.title}</h3>
                  {ban.subtitle && (
                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">{ban.subtitle}</p>
                  )}
                </div>
              </div>

              <div className="p-3 pt-0 flex justify-end space-x-2">
                <button
                  onClick={() => setEditingBanner(ban)}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg border border-slate-700"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteBanner(ban.id)}
                  className="p-1 bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 rounded-lg"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. PROMOTIONAL VIDEO BANNERS MANAGER */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-sm font-black text-white">
              Promotional Video Guides ({videoBanners.length})
            </h2>
            <p className="text-xs text-slate-400">
              Users can watch video walkthroughs on Android without app store updates.
            </p>
          </div>
          <button
            onClick={() =>
              setEditingVideo({
                title: '',
                description: '',
                videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
                thumbnail: 'https://images.unsplash.com/photo-1642543492481-44e81e3914a7?auto=format&fit=crop&w=800&q=80',
                duration: '1:30'
              })
            }
            className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center space-x-1.5 shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Add Video</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {videoBanners.map((vid) => (
            <div
              key={vid.id}
              className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden p-3 flex space-x-3 items-center justify-between"
            >
              <div className="flex items-center space-x-3 min-w-0">
                <div className="relative w-24 h-16 rounded-lg overflow-hidden bg-slate-900 shrink-0">
                  <img src={vid.thumbnail} alt={vid.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <Play className="w-4 h-4 text-white fill-white" />
                  </div>
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-white truncate">{vid.title}</h4>
                  <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{vid.description}</p>
                  <span className="text-[10px] text-amber-400 font-mono mt-1 inline-block">
                    {vid.duration}
                  </span>
                </div>
              </div>

              <div className="flex space-x-1.5 shrink-0">
                <button
                  onClick={() => setEditingVideo(vid)}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg border border-slate-700"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteVideo(vid.id)}
                  className="p-1 bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 rounded-lg"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* EDIT BANNER MODAL */}
      {editingBanner && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-sm font-bold text-white">Edit Banner</h3>
              <button onClick={() => setEditingBanner(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveBanner} className="space-y-3 text-xs">
              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">Banner Title</label>
                <input
                  type="text"
                  required
                  value={editingBanner.title || ''}
                  onChange={(e) => setEditingBanner({ ...editingBanner, title: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">Subtitle</label>
                <input
                  type="text"
                  value={editingBanner.subtitle || ''}
                  onChange={(e) => setEditingBanner({ ...editingBanner, subtitle: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">Badge Tag</label>
                <input
                  type="text"
                  value={editingBanner.badge || ''}
                  onChange={(e) => setEditingBanner({ ...editingBanner, badge: e.target.value })}
                  placeholder="e.g. HOT, FEATURED, 10% BONUS"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">Image URL</label>
                <input
                  type="text"
                  required
                  value={editingBanner.imageUrl || ''}
                  onChange={(e) => setEditingBanner({ ...editingBanner, imageUrl: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingBanner(null)}
                  className="flex-1 py-2 bg-slate-800 text-slate-300 font-bold rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs shadow-md"
                >
                  Save & Publish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT VIDEO MODAL */}
      {editingVideo && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-sm font-bold text-white">Edit Video Guide</h3>
              <button onClick={() => setEditingVideo(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveVideo} className="space-y-3 text-xs">
              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">Video Title</label>
                <input
                  type="text"
                  required
                  value={editingVideo.title || ''}
                  onChange={(e) => setEditingVideo({ ...editingVideo, title: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">Description</label>
                <input
                  type="text"
                  value={editingVideo.description || ''}
                  onChange={(e) => setEditingVideo({ ...editingVideo, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">Direct MP4 Video URL</label>
                <input
                  type="text"
                  required
                  value={editingVideo.videoUrl || ''}
                  onChange={(e) => setEditingVideo({ ...editingVideo, videoUrl: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">Thumbnail Image URL</label>
                <input
                  type="text"
                  required
                  value={editingVideo.thumbnail || ''}
                  onChange={(e) => setEditingVideo({ ...editingVideo, thumbnail: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingVideo(null)}
                  className="flex-1 py-2 bg-slate-800 text-slate-300 font-bold rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs shadow-md"
                >
                  Save & Publish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* UPLOAD / EDIT COMPANY LICENSE DOCUMENT MODAL */}
      {editingLicense && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <FileCheck2 className="w-4 h-4 text-emerald-400" />
                <span>{editingLicense.id ? 'Edit License Document' : 'Upload Company License Picture'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingLicense(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveLicenseDoc} className="space-y-3 text-xs">
              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">
                  Document Title
                </label>
                <input
                  type="text"
                  required
                  value={editingLicense.title || ''}
                  onChange={(e) => setEditingLicense({ ...editingLicense, title: e.target.value })}
                  placeholder="e.g., Certificate of Incorporation / MSB License"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-bold text-slate-400 block mb-1">
                    License / Doc No.
                  </label>
                  <input
                    type="text"
                    value={editingLicense.documentNumber || ''}
                    onChange={(e) =>
                      setEditingLicense({ ...editingLicense, documentNumber: e.target.value })
                    }
                    placeholder="REG-2024-001"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-400 block mb-1">
                    Issuing Authority
                  </label>
                  <input
                    type="text"
                    value={editingLicense.issuingAuthority || ''}
                    onChange={(e) =>
                      setEditingLicense({ ...editingLicense, issuingAuthority: e.target.value })
                    }
                    placeholder="ACRA / FinCEN"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Device File Uploader */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 block">
                  License Picture (Upload from Device or Paste URL)
                </label>
                <input
                  ref={licenseFileRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLicenseFileChange}
                  className="hidden"
                />
                <button
                  type="button"
                  disabled={isCompressingImage}
                  onClick={() => licenseFileRef.current?.click()}
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-400 font-bold text-xs flex items-center justify-center space-x-2 transition-colors disabled:opacity-50"
                >
                  <Upload className="w-4 h-4" />
                  <span>
                    {isCompressingImage
                      ? 'Processing Image...'
                      : 'Choose License Image from Gallery / Device'}
                  </span>
                </button>

                <input
                  type="text"
                  value={editingLicense.imageUrl || ''}
                  onChange={(e) => setEditingLicense({ ...editingLicense, imageUrl: e.target.value })}
                  placeholder="Or paste direct HTTPS image URL..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              {editingLicense.imageUrl && (
                <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
                  <img
                    src={editingLicense.imageUrl}
                    alt="License Document Preview"
                    className="w-full max-h-44 object-contain bg-slate-950"
                  />
                </div>
              )}

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingLicense(null)}
                  className="flex-1 py-2 bg-slate-800 text-slate-300 font-bold rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs shadow-md"
                >
                  Save &amp; Publish License
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
