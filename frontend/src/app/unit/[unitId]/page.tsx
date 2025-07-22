"use client";
import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import ImageSlider from "../../../components/ImageSlider";
import UnitDetails from "../../../components/UnitDetails";
import AmenitiesSection from "../../../components/AmentiesSection";
import RentSidebarCard from "../../../components/RentSidebarCard";
import Navbar from "../../../components/Navbar";
import { apiService, Unit } from "../../../services/api";

export default function UnitDetailPage() {
  const params = useParams();
  const unitId = params.unitId as string;

  const [unit, setUnit] = useState<Unit | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUnit = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await apiService.getUnitById(unitId);
        setUnit(response);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch unit details"
        );
        console.error("Error fetching unit:", err);
      } finally {
        setLoading(false);
      }
    };

    if (unitId) {
      fetchUnit();
    }
  }, [unitId]);

  if (loading) {
    return (
      <div
        dir="rtl"
        className="bg-gradient-to-br from-orange-50 to-amber-50 min-h-screen"
      >
        <Navbar />
        <div className="pt-20">
          <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              <div className="h-96 bg-gray-300 animate-pulse"></div>
              <div className="p-6 lg:p-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 space-y-8">
                    <div className="space-y-4">
                      <div className="h-8 bg-gray-300 rounded animate-pulse"></div>
                      <div className="h-4 bg-gray-300 rounded w-2/3 animate-pulse"></div>
                      <div className="h-20 bg-gray-300 rounded animate-pulse"></div>
                    </div>
                  </div>
                  <div className="lg:col-span-1">
                    <div className="h-64 bg-gray-300 rounded animate-pulse"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        dir="rtl"
        className="bg-gradient-to-br from-orange-50 to-amber-50 min-h-screen"
      >
        <Navbar />
        <div className="pt-20">
          <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden p-8 text-center">
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
              <button
                onClick={() => window.location.reload()}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              >
                إعادة المحاولة
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!unit) {
    return (
      <div
        dir="rtl"
        className="bg-gradient-to-br from-orange-50 to-amber-50 min-h-screen"
      >
        <Navbar />
        <div className="pt-20">
          <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden p-8 text-center">
              <p className="text-gray-500">الوحدة غير موجودة</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Transform amenities to match the component's expected format
  const transformedAmenities = [
    { icon: "Check", label: `${unit.numRooms} غرف` },
    { icon: "Check", label: `${unit.space} متر مربع` },
    ...(unit.hasAC ? [{ icon: "Check", label: "تكييف" }] : []),
    ...(unit.hasWifi ? [{ icon: "Check", label: "إنترنت" }] : []),
    ...(unit.hasTV ? [{ icon: "Check", label: "تلفزيون" }] : []),
    ...(unit.hasKitchenware ? [{ icon: "Check", label: "أدوات مطبخ" }] : []),
    ...(unit.hasHeating ? [{ icon: "Check", label: "تدفئة" }] : []),
    ...(unit.hasPool ? [{ icon: "Check", label: "مسبح" }] : []),
    ...(unit.isFurnished ? [{ icon: "Check", label: "مفروش" }] : []),
  ];

  // Create a location string
  const location = [unit.address, unit.city, unit.governorate]
    .filter(Boolean)
    .join(", ");

  // Get owner information
  const ownerInfo = typeof unit.ownerId === "object" ? unit.ownerId : null;

  return (
    <div
      dir="rtl"
      className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-gray-900 dark:to-gray-800 min-h-screen text-gray-900 dark:text-white"
    >
      <Navbar />
      <div className="pt-14">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <ImageSlider
              images={
                unit?.images && unit.images.length > 0
                  ? unit.images
                  : ["/placeholder-image.jpg"]
              }
            />
            <div className="p-6 lg:p-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                  <UnitDetails
                    title={unit?.name}
                    // rating={4.5}
                    reviews={0}
                    location={location}
                    description={unit?.description}
                  />
                  <div className="border-t border-gray-200 pt-8">
                    <AmenitiesSection amenities={transformedAmenities} />
                  </div>
                </div>
                <div className="lg:col-span-1">
                  <div className="sticky top-24">
                    <RentSidebarCard
                      unitId={unit?._id}
                      rent={unit?.pricePerMonth}
                      leaseDuration="١٢ شهر"
                      securityDeposit={unit?.securityDeposit || unit?.pricePerMonth}
                      availableFrom={unit?.status === "available" ? "متاح الآن" : "غير متاح"}
                      manager={{
                        name: ownerInfo?.name || "المالك",
                        phone: ownerInfo?.phone || "",
                        email: ownerInfo?.email || "",
                        landlordId: ownerInfo?._id || undefined,
                      }}
                      onBookingSuccess={() => {
                        if (unitId) {
                          apiService.getUnitById(unitId).then(setUnit);
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
