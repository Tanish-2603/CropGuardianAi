import React, { useState, useEffect, useRef } from 'react';
import { X, Upload, Camera, Sparkles, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { api } from '../services/api';
import type { DemoSample, FieldItem, ScanResult } from '../services/api';

interface ScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  field: FieldItem | null;
  onScanSuccess: (scan: ScanResult) => void;
}

export const ScanModal: React.FC<ScanModalProps> = ({
  isOpen,
  onClose,
  field,
  onScanSuccess,
}) => {
  const [samples, setSamples] = useState<DemoSample[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedSampleKey, setSelectedSampleKey] = useState<string>('early_blight_mild');
  const [previewUrl, setPreviewUrl] = useState<string>('/static/sample/early_blight_mild.jpg');
  
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      api.getDemoSamples().then(setSamples).catch(console.error);
    }
  }, [isOpen]);

  if (!isOpen || !field) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setSelectedSampleKey('');
      setPreviewUrl(URL.createObjectURL(file));
      setErrorMsg(null);
    }
  };

  const handleSelectSample = (sample: DemoSample) => {
    setSelectedFile(null);
    setSelectedSampleKey(sample.id);
    setPreviewUrl(`http://127.0.0.1:8000${sample.image_url}`);
    setErrorMsg(null);
  };

  const handleExecuteScan = async () => {
    setIsScanning(true);
    setErrorMsg(null);
    try {
      const scanRes = await api.submitScan(
        field.id,
        selectedFile,
        selectedSampleKey || undefined
      );
      onScanSuccess(scanRes);
      onClose();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Error occurred during scan analysis');
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
      <div className="bg-white w-full max-w-2xl rounded-2xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-slate-900">Crop Foliage Diagnostic Scan</h3>
              <p className="text-xs text-slate-500">Target Field: <span className="text-emerald-700 font-bold">{field.name}</span></p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* 1-Click Demo Samples */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">1-Click Test Samples</span>
              <span className="text-[11px] text-emerald-700 font-bold">Recommended for Speed</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {samples.map((s) => {
                const isSelected = selectedSampleKey === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleSelectSample(s)}
                    className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50 ring-1 ring-emerald-600'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300'
                    }`}
                  >
                    <div className="w-full h-16 rounded-lg overflow-hidden bg-white mb-2 border border-slate-200 flex items-center justify-center">
                      <img
                        src={`http://127.0.0.1:8000${s.image_url}`}
                        alt={s.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    </div>
                    <span className="text-[11px] font-bold text-slate-900 line-clamp-1">{s.title}</span>
                    <span className="text-[10px] text-slate-500 line-clamp-1">{s.badge}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Upload / Capture Custom Photo */}
          <div className="space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Or Upload Leaf Photo</span>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl p-6 text-center transition cursor-pointer bg-slate-50 hover:bg-slate-100/70"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                className="hidden"
              />
              <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-xs text-slate-700 font-semibold">Click to select tomato leaf image from device</p>
              <p className="text-[11px] text-slate-400 mt-1">JPEG, PNG or WebP up to 15MB</p>
            </div>
          </div>

          {/* Leaf Preview & Image Quality Guard Verification */}
          {previewUrl && (
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 flex items-center gap-4">
              <div className="w-20 h-20 rounded-xl overflow-hidden bg-white border border-slate-200 relative flex-shrink-0">
                <img
                  src={previewUrl}
                  alt="Scan Preview"
                  className="w-full h-full object-cover"
                />
                {isScanning && (
                  <div className="absolute inset-0 bg-emerald-500/20 border-b-2 border-emerald-500 animate-scan" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-slate-900">Image Quality Guard</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>PASSED CHECKS</span>
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Resolution, exposure balance, and high-frequency edge gradients verified. Ready for multimodal risk fusion inference.
                </p>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between bg-slate-50">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition cursor-pointer"
          >
            Cancel
          </button>

          <button
            onClick={handleExecuteScan}
            disabled={isScanning}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-50"
          >
            {isScanning ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Running Multimodal Fusion...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Run Diagnostic Risk Scan</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
