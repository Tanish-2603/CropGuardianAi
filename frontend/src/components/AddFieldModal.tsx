import React, { useState } from 'react';
import { X, MapPin, Sprout, Plus } from 'lucide-react';
import { api } from '../services/api';
import type { FieldItem } from '../services/api';

interface AddFieldModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFieldCreated: (field: FieldItem) => void;
}

const PRESET_LOCATIONS = [
  { name: "Salinas Valley, CA", lat: 36.6777, lon: -121.6555, desc: "Coastal Tomato Hub" },
  { name: "Nashik Belt, India", lat: 19.9975, lon: 73.7898, desc: "High Monsoon Humidity" },
  { name: "Almería, Spain", lat: 36.8381, lon: -2.4597, desc: "Intensive Greenhouses" },
  { name: "Sicily, Italy", lat: 37.0755, lon: 14.5482, desc: "Mediterranean Solanaceae" }
];

export const AddFieldModal: React.FC<AddFieldModalProps> = ({
  isOpen,
  onClose,
  onFieldCreated,
}) => {
  const [name, setName] = useState<string>('Tomato Field C - South Ridge');
  const [lat, setLat] = useState<number>(36.6777);
  const [lon, setLon] = useState<number>(-121.6555);
  const [cropStage, setCropStage] = useState<string>('Flowering');
  const [soilType, setSoilType] = useState<string>('Loamy');
  const [irrigation, setIrrigation] = useState<string>('Drip');
  const [drainage, setDrainage] = useState<string>('Moderate');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSelectPreset = (preset: typeof PRESET_LOCATIONS[0]) => {
    setLat(preset.lat);
    setLon(preset.lon);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const created = await api.createField({
        name,
        latitude: lat,
        longitude: lon,
        crop: 'tomato',
        crop_stage: cropStage,
        soil_type: soilType,
        irrigation,
        drainage,
      });
      onFieldCreated(created);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
      <div className="bg-white w-full max-w-lg rounded-2xl border border-slate-200 shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Sprout className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-slate-900">Create New Field Profile</h3>
              <p className="text-xs text-slate-500">Configure agronomic context & GPS coordinates</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Field Name / Plot Identifier</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Location presets */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">Geographic Location & Weather Presets</label>
            <div className="grid grid-cols-2 gap-2 mb-2">
              {PRESET_LOCATIONS.map((p) => {
                const isSelected = lat === p.lat && lon === p.lon;
                return (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => handleSelectPreset(p)}
                    className={`p-2 rounded-xl border text-left text-xs transition cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-50 border-emerald-600 text-emerald-800'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300'
                    }`}
                  >
                    <div className="font-bold flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-emerald-600" />
                      <span>{p.name}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 block">{p.desc}</span>
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-[10px] text-slate-500 block mb-0.5">Latitude</span>
                <input
                  type="number"
                  step="0.0001"
                  required
                  value={lat}
                  onChange={(e) => setLat(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
                />
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block mb-0.5">Longitude</span>
                <input
                  type="number"
                  step="0.0001"
                  required
                  value={lon}
                  onChange={(e) => setLon(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
                />
              </div>
            </div>
          </div>

          {/* Agronomic settings */}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200">
            <div>
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">Growth Stage</label>
              <select
                value={cropStage}
                onChange={(e) => setCropStage(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none"
              >
                <option value="Seedling">Seedling</option>
                <option value="Vegetative">Vegetative</option>
                <option value="Flowering">Flowering</option>
                <option value="Fruiting">Fruiting</option>
                <option value="Harvest">Harvest</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">Soil Type</label>
              <select
                value={soilType}
                onChange={(e) => setSoilType(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none"
              >
                <option value="Loamy">Loamy</option>
                <option value="Sandy Loam">Sandy Loam</option>
                <option value="Clay">Clay</option>
                <option value="Silt">Silt</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">Irrigation Method</label>
              <select
                value={irrigation}
                onChange={(e) => setIrrigation(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none"
              >
                <option value="Drip">Drip (Targeted)</option>
                <option value="Furrow">Furrow</option>
                <option value="Sprinkler">Sprinkler (Overhead)</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">Row Drainage</label>
              <select
                value={drainage}
                onChange={(e) => setDrainage(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none"
              >
                <option value="Good">Good</option>
                <option value="Moderate">Moderate</option>
                <option value="Poor">Poor</option>
              </select>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{isSubmitting ? 'Saving...' : 'Save Field Profile'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
