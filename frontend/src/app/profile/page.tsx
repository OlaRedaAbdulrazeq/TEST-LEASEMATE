"use client";

import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import React, { useEffect, useState } from 'react';
import { apiService } from '@/services/api';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import ProtectedRoute from '@/components/ProtectedRoute';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function ProfilePage() {
  const { user, isLoading } = useAuth();
  const [reviews, setReviews] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?._id) {
      setLoadingReviews(true);
      apiService.getReviewsForUser(user._id)
        .then((res: any) => {
          setReviews(res.data || []);
          setLoadingReviews(false);
        })
        .catch((err: any) => {
          setError(err.message || 'Failed to load reviews');
          setLoadingReviews(false);
        });
    }
  }, [user?._id]);

  // Calculate sentiment distribution based on database sentiment field
  let positive = 0;
  let negative = 0;
  let neutral = 0;
  
  reviews.forEach((r) => {
    // Use sentiment from database, fallback to rating only if sentiment is null/undefined
    let actualSentiment = r.sentiment;
    
    if (!actualSentiment || actualSentiment === null || actualSentiment === undefined) {
      // Fallback to rating-based sentiment only if no sentiment from database
      if (r.rating >= 4) {
        actualSentiment = 'ايجابي';
      } else if (r.rating <= 2) {
        actualSentiment = 'سلبية';
      } else {
        actualSentiment = 'محايد';
      }
    }
    
    if (actualSentiment === 'ايجابي') {
      positive++;
    } else if (actualSentiment === 'سلبية') {
      negative++;
    } else {
      neutral++;
    }
  });

  const chartData = {
    labels: ['إيجابي', 'محايد', 'سلبية'],
    datasets: [
      {
        label: 'عدد المراجعات',
        data: [positive, neutral, negative],
        backgroundColor: [
          '#22c55e', // positive - green
          '#fbbf24', // neutral - yellow
          '#ef4444', // negative - red
        ],
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: 'Review Rating Distribution',
      },
    },
    scales: {
      y: { beginAtZero: true, precision: 0 },
    },
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-orange-50 dark:bg-stone-900">
        <span className="text-gray-700 dark:text-gray-200 text-lg">جاري التحميل ...</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-orange-50 dark:bg-stone-900">
        <span className="text-red-600 dark:text-red-300 text-lg">يجب تسجيل الدخول لعرض الصفحة الشخصية .</span>
      </div>
    );
  }

  return (
    <ProtectedRoute>
         <div className="min-h-screen bg-orange-50 dark:bg-stone-900">
      <Navbar />
      <div className="flex pt-24 items-center justify-center min-h-[calc(100vh-80px)]">{/* Adjust height for navbar */}
        <main className="max-w-2xl w-full p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-xl">
          <div className="flex flex-col items-center gap-4 mb-8">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt="الصورة الشخصية" className="w-24 h-24 rounded-full object-cover border-4 border-orange-200 dark:border-orange-700" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center text-4xl text-orange-500 font-bold">
                {user.name?.charAt(0) || '?'}
              </div>
            )}
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{user.name}</h1>
            <span className="text-gray-600 dark:text-gray-300">{user.role === 'landlord' ? 'مالك عقار' : user.role === 'tenant' ? 'مستأجر' : user.role}</span>          </div>
          <div className="space-y-4">
            {/* {user.email && (
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-700 dark:text-gray-200">Email:</span>
                <span className="text-gray-900 dark:text-white">{user.email}</span>
              </div>
            )} */}
            {user.phone && (
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-700 dark:text-gray-200">رقم الهاتف :</span>
                <span className="text-gray-900 dark:text-white">{user.phone}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-700 dark:text-gray-200">حالة التحقق :</span>
              <span className={
                user.verificationStatus?.status === 'approved'
                  ? 'text-green-600 dark:text-green-400'
                  : user.verificationStatus?.status === 'pending'
                  ? 'text-yellow-600 dark:text-yellow-400'
                  : 'text-red-600 dark:text-red-400'
              }>
                {user.verificationStatus?.status === 'approved'
                  ? 'تم التحقق'
                  : user.verificationStatus?.status === 'pending'
                  ? 'قيد الانتظار'
                  : user.verificationStatus?.status === 'rejected'
                  ? 'مرفوض'
                  :'غير معروف'}
              </span>
            </div>
            {/* Reviews Section */}
            <div className="mt-12" dir="rtl">
              <h2 className="text-2xl font-extrabold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                <span className="border-r-4 border-orange-400 pr-3">المراجعات عنك</span>
              </h2>
              {loadingReviews ? (
                <div className="text-gray-700 dark:text-gray-200">جاري تحميل المراجعات...</div>
              ) : error ? (
                <div className="text-red-600 dark:text-red-300">{error}</div>
              ) : (
                <>
                  <div className="mb-8 animate-fade-in">
                    <Bar data={{
                      ...chartData,
                      labels: ['إيجابي', 'محايد', 'سلبية'],
                      datasets: [{
                        ...chartData.datasets[0],
                        label: 'عدد المراجعات',
                      }],
                    }} options={{
                      ...chartOptions,
                      plugins: {
                        ...chartOptions.plugins,
                        title: { ...chartOptions.plugins.title, text: 'توزيع تقييمات المراجعات' },
                      },
                    }} />
                    <div className="flex gap-4 mt-4 justify-center">
                      <span className="text-green-600 dark:text-green-400 font-semibold bg-green-50 dark:bg-green-900 px-3 py-1 rounded-full">إيجابي: {positive}</span>
                      <span className="text-yellow-600 dark:text-yellow-400 font-semibold bg-yellow-50 dark:bg-yellow-900 px-3 py-1 rounded-full">محايد: {neutral}</span>
                      <span className="text-red-600 dark:text-red-400 font-semibold bg-red-50 dark:bg-red-900 px-3 py-1 rounded-full">سلبي: {negative}</span>
                    </div>
                  </div>
                  <div className="border-t border-orange-200 dark:border-orange-700 mb-8"></div>
                  <div className="bg-orange-50/60 dark:bg-stone-800 rounded-2xl p-4">
                    {reviews.length === 0 ? (
                      <div className="text-gray-500 dark:text-gray-400 text-center py-8">لا توجد مراجعات بعد.</div>
                    ) : (
                      <ul className="grid gap-6">
                        {reviews.map((review) => {
                          // Sentiment badge - use rating as fallback if sentiment is null
                          let sentimentColor = 'bg-gray-200 text-gray-700';
                          let sentimentIcon = '😐';
                          let sentimentText = 'محايد';
                          
                          // Determine sentiment from review.sentiment or fallback to rating
                          let actualSentiment = review.sentiment;
                          
                          // If no sentiment from backend, use rating to determine sentiment
                          if (!actualSentiment || actualSentiment === null || actualSentiment === undefined) {
                            if (review.rating >= 4) {
                              actualSentiment = 'ايجابي';
                            } else if (review.rating <= 2) {
                              actualSentiment = 'سلبية';
                            } else {
                              actualSentiment = 'محايد';
                            }
                          }
                          
                          console.log('Review rating:', review.rating, 'Backend sentiment:', review.sentiment, 'Final sentiment:', actualSentiment);
                          
                          if (actualSentiment === 'ايجابي') {
                            sentimentColor = 'bg-green-100 text-green-700';
                            sentimentIcon = '😊';
                            sentimentText = 'ايجابي';
                          } else if (actualSentiment === 'سلبية') {
                            sentimentColor = 'bg-red-100 text-red-700';
                            sentimentIcon = '😞';
                            sentimentText = 'سلبية';
                          }
                          // Avatar or initials
                          const avatar = review.reviewerId?.avatarUrl ? (
                            <img src={review.reviewerId.avatarUrl} alt="الصورة الشخصية" className="w-10 h-10 rounded-full object-cover border-2 border-orange-300" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-orange-200 flex items-center justify-center text-lg font-bold text-orange-700">
                              {review.reviewerId?.name?.charAt(0) || '?'}
                            </div>
                          );
                          return (
                            <li key={review._id} className="transition-shadow hover:shadow-xl bg-white dark:bg-gray-900 rounded-xl p-6 flex gap-4 items-start shadow-md">
                              {avatar}
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-semibold text-gray-900 dark:text-gray-100 text-lg">{review.reviewerId?.name || 'مجهول'}</span>
                                  <span className="text-xs text-gray-500 dark:text-gray-400">({new Date(review.createdAt).toLocaleDateString('ar-EG')})</span>
                                  <span className={`mr-2 px-2 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1 ${sentimentColor}`}>{sentimentIcon} {sentimentText}</span>
                                </div>
                                <div className="flex items-center gap-1 mb-2">
                                  {[...Array(5)].map((_, i) => (
                                    <span key={i} className={i < review.rating ? 'text-yellow-400 text-xl' : 'text-gray-300 text-xl'}>★</span>
                                  ))}
                                </div>
                                <div className="text-gray-700 dark:text-gray-200 text-base leading-relaxed">{review.comment || <span className="italic text-gray-400">لا يوجد تعليق</span>}</div>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
    </ProtectedRoute>
   
  );
} 
