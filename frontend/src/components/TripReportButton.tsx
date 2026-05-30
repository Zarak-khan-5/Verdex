'use client';

import React, { useState } from 'react';
import { getTripReport } from '@/services/api';

interface TripReportButtonProps {
  userId: string;
  userName: string;
}

export default function TripReportButton({ userId, userName }: TripReportButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    try {
      // 1. Fetch trip report statistics and raw history
      const reportData = await getTripReport(userId);
      if (reportData.status !== 'success') {
        throw new Error('API returned unsuccessful status');
      }

      const { trips, summary } = reportData;

      // 2. Dynamic Import of jsPDF and jsPDF-AutoTable to avoid SSR issues
      const { jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default;

      // 3. Initialize A4 Document (210mm x 297mm)
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      // 4. Render Document Title & Subtitle (starting below the 30mm header bar area)
      doc.setTextColor(3, 6, 5); // #030605 - Theme background color for strong text
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      doc.text('Eco-Impact & Mobility Report', 15, 42);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Personalized environmental transit breakdown for ${userName}`, 15, 48);

      // 5. Draw KPI Summary Cards in 2x2 Grid Layout
      // Theme colors: #081611 (RGB 8, 22, 17) for card background and #0b5e43 (RGB 11, 94, 67) for border/accent.
      const renderCard = (x: number, y: number, w: number, h: number, label: string, value: string) => {
        // Background fill
        doc.setFillColor(8, 22, 17);
        doc.rect(x, y, w, h, 'F');
        // Border outline
        doc.setDrawColor(11, 94, 67);
        doc.setLineWidth(0.4);
        doc.rect(x, y, w, h, 'S');

        // Card Content
        doc.setTextColor(16, 185, 129); // Accent light green for values
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text(value, x + 5, y + 9);

        doc.setTextColor(200, 200, 200); // Lighter text for labels
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.text(label, x + 5, y + 4);
      };

      // Top Row Cards
      renderCard(15, 54, 85, 13, 'TOTAL CO₂ OFFSET SAVED', `${summary.total_co2_saved_kg.toFixed(1)} kg`);
      renderCard(110, 54, 85, 13, 'TOTAL COMPLETED TRIPS', `${summary.total_trips} trips`);

      // Bottom Row Cards
      renderCard(15, 71, 85, 13, 'GREEN CARBON CREDITS', `${summary.carbon_credits_earned} credits`);
      renderCard(110, 71, 85, 13, 'CARS REMOVED (ANNUAL EQUIV.)', `${summary.cars_removed.toFixed(4)} cars`);

      // 6. Draw Horizontal Transit Mode Breakdown Chart
      doc.setTextColor(11, 94, 67); // #0b5e43 Accent Bottle Green
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.text('Transit Mode Breakdown', 15, 96);

      const modes = Object.keys(summary.mode_breakdown);
      const maxTrips = Math.max(...Object.values(summary.mode_breakdown), 1);

      let currentY = 103;
      if (modes.length === 0) {
        doc.setTextColor(100, 100, 100);
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(9);
        doc.text('No transit mode metrics recorded yet.', 15, currentY);
        currentY += 8;
      } else {
        modes.forEach((modeName) => {
          const count = summary.mode_breakdown[modeName];
          const percentage = ((count / summary.total_trips) * 100).toFixed(0);

          doc.setTextColor(3, 6, 5);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8.5);
          doc.text(modeName.toUpperCase(), 15, currentY + 3);

          doc.setTextColor(100, 100, 100);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8);
          doc.text(`${count} trips (${percentage}%)`, 195, currentY + 3, { align: 'right' });

          // Background Bar
          doc.setFillColor(240, 248, 245);
          doc.rect(15, currentY + 4.5, 180, 3, 'F');

          // Foreground filled bar
          const filledWidth = 180 * (count / maxTrips);
          doc.setFillColor(11, 94, 67);
          doc.rect(15, currentY + 4.5, filledWidth, 3, 'F');

          currentY += 12;
        });
      }

      // 7. Render Recent Commutes Table using jsPDF-AutoTable
      doc.setTextColor(11, 94, 67);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.text('Recent Commute History Log', 15, currentY + 3);

      const formattedTrips = trips.map((t) => [
        new Date(t.created_at).toLocaleDateString(undefined, { dateStyle: 'medium' }),
        t.mode.toUpperCase(),
        `${t.total_time_mins} mins`,
        `${Number(t.co2_saved_kg).toFixed(2)} kg`,
      ]);

      (autoTable as any)(doc, {
        startY: currentY + 7,
        margin: { top: 35, bottom: 25, left: 15, right: 15 },
        head: [['Date', 'Commute Mode', 'Duration', 'CO₂ Savings (kg)']],
        body: formattedTrips,
        theme: 'striped',
        headStyles: {
          fillColor: [11, 94, 67], // #0b5e43 Header color
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 9,
        },
        alternateRowStyles: {
          fillColor: [240, 248, 245], // Bottle green light tint row
        },
        styles: {
          font: 'helvetica',
          fontSize: 8.5,
          cellPadding: 3,
        },
      });

      // 8. Header & Footer Layers (Overlayed in a final post-render loop on all pages)
      const totalPages = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);

        // Header Bar (y=0 to y=30)
        doc.setFillColor(11, 94, 67);
        doc.rect(0, 0, 210, 30, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(18);
        doc.text('VERDEX', 15, 19);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.text(`DATE GENERATED: ${new Date().toLocaleDateString()}`, 195, 19, { align: 'right' });

        // Footer divider line (y=280)
        doc.setDrawColor(11, 94, 67);
        doc.setLineWidth(0.4);
        doc.line(15, 280, 195, 280);

        // Footer Text (SDG 11 / 13 & page counts)
        doc.setTextColor(120, 120, 120);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.text('Verdex AI Mobility Agent • SDG 11: Sustainable Cities • SDG 13: Climate Action', 15, 286);
        doc.text(`Page ${i} of ${totalPages}`, 195, 286, { align: 'right' });
      }

      // 9. Save PDF to trigger browser download
      const cleanUsername = userName.toLowerCase().replace(/\s+/g, '-');
      doc.save(`verdex-report-${cleanUsername}.pdf`);
    } catch (error) {
      console.error('Failed to generate PDF Report:', error);
      alert('Failed to generate PDF Report. Please check the backend connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      className="px-4 py-2.5 bg-[rgba(11,94,67,0.12)] hover:bg-[rgba(11,94,67,0.28)] disabled:bg-[rgba(7,65,46,0.1)] border border-[rgba(16,133,96,0.25)] hover:border-[rgba(16,133,96,0.55)] text-emerald-400 hover:text-white font-sans font-semibold text-xs tracking-wider rounded-xl shadow-[0_4px_12px_rgba(11,94,67,0.15)] hover:shadow-[0_6px_20px_rgba(11,94,67,0.35)] transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0.5 flex items-center gap-2.5 cursor-pointer backdrop-blur-md uppercase"
    >
      {loading ? (
        <>
          <span className="animate-spin inline-block w-3.5 h-3.5 border-2 border-t-transparent border-emerald-400 rounded-full"></span>
          <span>Generating...</span>
        </>
      ) : (
        <>
          <span className="material-symbols-outlined text-[16px] text-emerald-400 group-hover:text-white transition-colors duration-200">picture_as_pdf</span>
          <span>Download Report</span>
        </>
      )}
    </button>
  );
}
