"use client";

import { EvidenceQuality, ConfidenceBar, QualityDot } from "@/components/medical/EvidenceQuality";
import { ConfidenceIndicator } from "@/components/medical/ConfidenceIndicator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function QualityDemo() {
  return (
    <div className="container mx-auto p-8 space-y-8">
      <h1 className="text-3xl font-bold text-center">Enhanced Quality Rating System</h1>
      <p className="text-center text-gray-600">New star-free evidence quality indicators</p>
      
      {/* Evidence Quality Cards */}
      <Card>
        <CardHeader>
          <CardTitle>Evidence Quality Cards (Full)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <EvidenceQuality level="HIGH" studyType="Meta-Analysis" />
          <EvidenceQuality level="MODERATE" studyType="Registry Study" />
          <EvidenceQuality level="LOW" studyType="Case Series" />
          <EvidenceQuality level="VERY LOW" studyType="Expert Opinion" />
        </CardContent>
      </Card>

      {/* Compact Evidence Quality */}
      <Card>
        <CardHeader>
          <CardTitle>Compact Evidence Quality</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <EvidenceQuality level="HIGH" compact />
            <EvidenceQuality level="MODERATE" compact />
            <EvidenceQuality level="LOW" compact />
            <EvidenceQuality level="VERY LOW" compact />
          </div>
        </CardContent>
      </Card>

      {/* Quality Dots */}
      <Card>
        <CardHeader>
          <CardTitle>Quality Indicator Dots</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <QualityDot level="HIGH" size="lg" />
              <span>HIGH Quality</span>
            </div>
            <div className="flex items-center gap-2">
              <QualityDot level="MODERATE" size="md" />
              <span>MODERATE Quality</span>
            </div>
            <div className="flex items-center gap-2">
              <QualityDot level="LOW" size="sm" />
              <span>LOW Quality</span>
            </div>
            <div className="flex items-center gap-2">
              <QualityDot level="VERY LOW" size="sm" />
              <span>VERY LOW Quality</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Confidence Bars */}
      <Card>
        <CardHeader>
          <CardTitle>Confidence Progress Bars</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ConfidenceBar level="HIGH" />
          <ConfidenceBar level="MODERATE" />
          <ConfidenceBar level="LOW" />
          <ConfidenceBar level="VERY LOW" />
        </CardContent>
      </Card>

      {/* Circular Confidence Indicators */}
      <Card>
        <CardHeader>
          <CardTitle>Circular Confidence Indicators</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <ConfidenceIndicator percentage={95} label="High Quality" />
            <ConfidenceIndicator percentage={80} label="Moderate Quality" />
            <ConfidenceIndicator percentage={60} label="Low Quality" />
            <ConfidenceIndicator percentage={30} label="Very Low Quality" />
          </div>
        </CardContent>
      </Card>

      {/* Usage in Citation Context */}
      <Card>
        <CardHeader>
          <CardTitle>In Citation Card Context</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 border-l-4 border-l-blue-500 bg-blue-50/50 rounded">
            <div className="flex items-start gap-3">
              <div className="flex items-center gap-2 flex-1">
                <span className="text-sm font-medium">
                  "Brugada syndrome: report of the second consensus conference"
                </span>
              </div>
              <div className="flex items-center gap-2">
                <QualityDot level="HIGH" />
                <EvidenceQuality level="HIGH" compact />
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-600">
              Antzelevitch C, Brugada P, Borggrefe M. • Circulation, 2005 • HIGH confidence (95%+)
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
