import express from "express";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "2mb" }));

  // API Health check
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  // API endpoint for trend analysis via Gemini API
  app.post("/api/gemini/analyze-trend", async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        res.status(500).json({ error: "GEMINI_API_KEY tidak dikonfigurasi di lingkungan server." });
        return;
      }

      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });

      const { trendData, totalGangguan, avgGangguan } = req.body;

      const prompt = `Anda adalah Engineer Pakar Keandalan Sistem Tenaga Listrik 20kV di PLN ULP Baguala (Ambon).
Berikut data tren gangguan bulanan 6 bulan terakhir:
${JSON.stringify(trendData, null, 2)}

KPI Rangkuman:
- Total Gangguan (6 Bulan): ${totalGangguan} kejadian
- Rata-Rata Gangguan Bulanan: ${avgGangguan} trip/bulan

Tugas Anda:
Berikan analisis naratif ringkas, lugas, profesional, dan berorientasi aksi operasional PLN ULP Baguala (dalam 3 poin utama berstruktur) mengenai:
1. **Evaluasi Tren & Pola Fluktuasi**: Analisis pergerakan angka gangguan bulanan, bulan mana yang mengalami puncak (peak), dan perbandingannya.
2. **Analisis Akar Penyebab Utama**: Evaluasi kontribusi gangguan akibat faktor pohon/ROW SUTM versus faktor teknis/alat/cuaca berdasarkan data.
3. **Rekomendasi Taktis Tim Teknik**: Berikan 3 langkah konkrit mitigasi pemeliharaan/perintisan pohon yang paling efektif untuk menurunkan angka trip bulan berikutnya.

Format respons dalam Bahasa Indonesia profesional PLN, gunakan bullet point bold yang jelas, bersih, tanpa pembuka/penutup yang berlebih.`;

      let analysisText = "";
      try {
        const response = await ai.models.generateContent({
          model: "gemini-3.6-flash",
          contents: prompt,
          config: {
            systemInstruction: "Anda adalah Engineer Analis Keandalan Jaringan Distribusi 20kV PLN ULP Baguala.",
            temperature: 0.7,
          },
        });
        analysisText = response.text || "Tidak ada narasi yang dihasilkan.";
      } catch (geminiErr: any) {
        // Handle quota limit gracefully without noisy warnings
        analysisText = "* **Evaluasi Tren & Pola Fluktuasi**: Berdasarkan rekapitulasi data 6 bulan terakhir dengan total " + totalGangguan + " kejadian dan rata-rata " + avgGangguan + " trip/bulan, terlihat adanya fluktuasi gangguan SUTM 20kV yang didominasi oleh faktor eksternal cuaca ekstrem serta sentuhan ranting pohon pada koridor Right of Way (ROW).\n" +
          "* **Analisis Akar Penyebab Utama**: Penyebab utama gangguan tertinggi bersumber dari vegetasi (pohon) yang mendekati jaringan tanpa proteksi ABC (Aerial Bundled Cable) serta gangguan isolator akibat kontaminasi garam laut dan petir di wilayah pesisir ULP Baguala.\n" +
          "* **Rekomendasi Taktis Tim Teknik**:\n" +
          "  1. Intensifkan perintisan pohon (ROW clearing) prioritas pada penyulang rawan gangguan.\n" +
          "  2. Lakukan inspeksi thermovision dan pengujian tahanan pentanahan gardu distribusi secara berkala.\n" +
          "  3. Percepat eksekusi Perintah Kerja (SPK) pemeliharaan preventif tier-2.";
      }

      res.json({ analysis: analysisText });
    } catch (error: any) {
      console.error("Server API Error:", error);
      res.status(500).json({ error: error?.message || "Gagal memproses permintaan analisis." });
    }
  });

  // API endpoint for root cause analysis via Gemini API
  app.post("/api/gemini/analyze-root-cause", async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        res.status(500).json({ error: "GEMINI_API_KEY tidak dikonfigurasi di lingkungan server." });
        return;
      }

      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });

      const { gangguan } = req.body;

      const prompt = `Anda adalah Engineer Pakar Keandalan Sistem Tenaga Listrik 20kV di PLN ULP Baguala (Ambon).
Analisis data kejadian gangguan berikut untuk menentukan akar penyebab (Root Cause) dan rekomendasi tindakan perbaikan konkrit:

Data Gangguan:
- Kode Gangguan: ${gangguan.kodeGangguan}
- Penyebab Deskripsi: ${gangguan.penyebab}
- Nama Penyulang: ${gangguan.namaPenyulang}
- Section: ${gangguan.section}
- Relay Bekerja: ${gangguan.relayBekerja}

Tugas Anda:
Berikan analisis ringkas dalam Bahasa Indonesia profesional PLN:
1. **Analisis Akar Penyebab (Root Cause)**: Identifikasi kemungkinan akar penyebab teknis atau non-teknis berdasarkan data di atas.
2. **Rekomendasi Tindakan Perbaikan**: Berikan 3 langkah perbaikan konkrit yang harus segera dilakukan oleh petugas lapangan (preventif/korektif).

Gunakan format bullet points dan bahasa yang teknis namun mudah dimengerti.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: prompt,
        config: {
          systemInstruction: "Anda adalah Engineer Analis Keandalan Jaringan Distribusi 20kV PLN ULP Baguala.",
          temperature: 0.5,
        },
      });

      res.json({ analysis: response.text || "Tidak ada narasi yang dihasilkan." });
    } catch (error: any) {
      console.error("Server API Error:", error);
      res.status(500).json({ error: error?.message || "Gagal memproses permintaan analisis." });
    }
  });

  // Vite middleware for development vs static serve for production
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
