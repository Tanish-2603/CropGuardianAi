const API_BASE = "http://127.0.0.1:8000/api";

export interface FieldItem {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  crop: string;
  crop_stage: string;
  soil_type: string;
  irrigation: string;
  drainage: string;
  latest_risk_score?: number;
  latest_risk_level?: string;
}

export interface WeatherData {
  temperature: number;
  humidity: number;
  precipitation: number;
  rain_probability: number;
  wind: number;
  wetness_proxy: number;
  forecast_change: string;
}

export interface VisualResult {
  class: string;
  confidence: number;
  probabilities: Record<string, number>;
  quality_status: "pass" | "warning" | "fail";
  quality_notes: string[];
}

export interface RiskFactor {
  factor: string;
  contribution: number;
  explanation: string;
}

export interface Recommendation {
  priority: string;
  action: string;
  rationale: string;
  is_completed?: boolean;
}

export interface OutlookItem {
  day_label: string;
  hours_from_now: number;
  risk_score: number;
  risk_level: string;
  temperature: number;
  humidity: number;
  rain_mm: number;
  rain_probability: number;
  condition_summary: string;
}

export interface ScanResult {
  id: string;
  field_id: string;
  crop: string;
  image_url: string;
  created_at: string;
  visual_result: VisualResult;
  weather: WeatherData;
  risk: {
    score: number;
    level: string;
    outlook_hours: number;
    visual_risk_subscore: number;
    weather_risk_subscore: number;
    field_risk_subscore: number;
  };
  drivers: string[];
  risk_factors: RiskFactor[];
  recommendations: Recommendation[];
  outlook_72h: OutlookItem[];
  expert_disclaimer: string;
}

export interface DemoSample {
  id: string;
  title: string;
  badge: string;
  expected_visual: string;
  threat: string;
  image_url: string;
}

export interface SimulationResult {
  risk_score: number;
  risk_level: string;
  visual_subscore: number;
  weather_subscore: number;
  field_subscore: number;
  drivers: string[];
  recommendations: string[];
  outlook_72h: OutlookItem[];
  scenario_summary: string;
}

export const api = {
  async getFields(): Promise<FieldItem[]> {
    const res = await fetch(`${API_BASE}/fields`);
    if (!res.ok) throw new Error("Failed to fetch fields");
    return res.json();
  },

  async createField(data: Partial<FieldItem>): Promise<FieldItem> {
    const res = await fetch(`${API_BASE}/fields`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to create field");
    return res.json();
  },

  async getFieldHistory(fieldId: string) {
    const res = await fetch(`${API_BASE}/fields/${fieldId}/history`);
    if (!res.ok) throw new Error("Failed to fetch history");
    return res.json();
  },

  async getWeather(lat: number, lon: number) {
    const res = await fetch(`${API_BASE}/weather?lat=${lat}&lon=${lon}`);
    if (!res.ok) throw new Error("Failed to fetch weather");
    return res.json();
  },

  async getDemoSamples(): Promise<DemoSample[]> {
    const res = await fetch(`${API_BASE}/demo/samples`);
    if (!res.ok) throw new Error("Failed to load sample leaves");
    return res.json();
  },

  async submitScan(fieldId: string, file?: File | null, sampleKey?: string): Promise<ScanResult> {
    const formData = new FormData();
    formData.append("field_id", fieldId);
    if (file) {
      formData.append("file", file);
    }
    if (sampleKey) {
      formData.append("sample_key", sampleKey);
    }
    const res = await fetch(`${API_BASE}/scans`, {
      method: "POST",
      body: formData,
    });
    if (!res.ok) throw new Error("Failed to run scan");
    return res.json();
  },

  async simulateRisk(params: {
    field_id?: string;
    base_visual_risk: number;
    cv_class?: string;
    crop_stage?: string;
    drainage?: string;
    temperature: number;
    humidity: number;
    rain_24h_mm: number;
    rain_probability: number;
    wind_speed?: number;
  }): Promise<SimulationResult> {
    const res = await fetch(`${API_BASE}/risk/simulate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
    if (!res.ok) throw new Error("Failed to simulate scenario");
    return res.json();
  },

  async submitFeedback(data: { scan_id: string; user_label?: string; expert_label?: string; notes?: string }) {
    const res = await fetch(`${API_BASE}/feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to submit feedback");
    return res.json();
  }
};
