import React, { useState, useEffect } from 'react';
import { apiClient } from '@/api/apiClient';
import { Megaphone, BookOpen, Banknote, GraduationCap, Calendar, ExternalLink } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatDate } from '@/utils/constants';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import EmptyState from '@/components/shared/EmptyState';

const CATEGORY_ICONS = {
  notice: Megaphone,
  subsidy: Banknote,
  loan: Banknote,
  training: GraduationCap,
  scheme: BookOpen,
};

const SAMPLE_NOTICES = [
  { id: '1', title: "Boro Rice Subsidy Program 2025", category: "subsidy", description: "Government is offering subsidized seeds and fertilizer for Boro season. Eligible small and marginal farmers can apply through local agriculture office.", eligibility: "Farmers with less than 2.5 acres of land", deadline: "2025-03-15", is_active: true },
  { id: '2', title: "Agricultural Loan at 4% Interest", category: "loan", description: "Bangladesh Bank has introduced special agricultural loans at 4% interest rate for crop cultivation. Apply at any scheduled bank.", eligibility: "All registered farmers", deadline: "2025-06-30", is_active: true },
  { id: '3', title: "Modern Farming Training — Rajshahi", category: "training", description: "Free training on modern farming techniques including IPM, organic farming, and mechanized harvesting. Conducted by DAE.", eligibility: "Farmers from Rajshahi Division", deadline: "2025-02-28", is_active: true },
  { id: '4', title: "Digital Agriculture Scheme", category: "scheme", description: "Government initiative to digitize agricultural records and provide smart farming solutions to all farmers.", eligibility: "All farmers", is_active: true },
];

export default function Notices() {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await apiClient.entities.GovernmentNotice.list('-created_date', 50);
        setNotices(data.length > 0 ? data : SAMPLE_NOTICES);
      } catch {
        setNotices(SAMPLE_NOTICES);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const categories = ['all', 'notice', 'subsidy', 'loan', 'training', 'scheme'];

  const renderNotices = (filterCat) => {
    const filtered = filterCat === 'all' ? notices : notices.filter(n => n.category === filterCat);
    if (filtered.length === 0) return <EmptyState icon={Megaphone} title="No notices found" />;

    return (
      <div className="space-y-4">
        {filtered.map(notice => {
          const IconComp = CATEGORY_ICONS[notice.category] || Megaphone;
          return (
            <div key={notice.id} className="p-5 rounded-2xl border border-border bg-card hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <IconComp className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-heading font-semibold text-foreground">{notice.title}</h3>
                    <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium capitalize">{notice.category}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{notice.description}</p>
                  {notice.eligibility && (
                    <p className="text-xs text-muted-foreground mt-2"><strong>যোগ্যতা:</strong> {notice.eligibility}</p>
                  )}
                  <div className="flex items-center gap-4 mt-3">
                    {notice.deadline && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="w-3.5 h-3.5" /> Deadline: {formatDate(notice.deadline)}
                      </span>
                    )}
                    {notice.link && (
                      <a href={notice.link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-primary hover:underline">
                        <ExternalLink className="w-3.5 h-3.5" /> Learn More
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="font-heading font-bold text-2xl text-foreground">সরকারি নোটিশ ও ভর্তুকি</h1>
        <p className="text-muted-foreground text-sm mt-1">কৃষি প্রকল্প, ঋণ ও প্রশিক্ষণের সর্বশেষ খবর জানুন</p>
      </div>

      <Tabs defaultValue="all">
        <TabsList className="flex-wrap">
          {categories.map(cat => (
            <TabsTrigger key={cat} value={cat} className="capitalize">{cat === 'all' ? 'All' : cat}</TabsTrigger>
          ))}
        </TabsList>
        {categories.map(cat => (
          <TabsContent key={cat} value={cat} className="mt-6">
            {renderNotices(cat)}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
