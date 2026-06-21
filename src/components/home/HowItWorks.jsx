import React from 'react';
import { UserPlus, ListPlus, Handshake, Banknote } from 'lucide-react';

export default function HowItWorks() {
  const steps = [
    { icon: UserPlus, step: "০১", title: 'নিবন্ধন করুন', desc: 'আপনার প্রয়োজন অনুযায়ী কৃষক, ক্রেতা অথবা সেবাদাতা হিসেবে অ্যাকাউন্ট খুলুন।' },
    { icon: ListPlus, step: "০২", title: 'তালিকা দিন বা খুঁজুন', desc: 'ফসল, কৃষিযন্ত্র ও পরিবহন সেবা প্রকাশ করুন অথবা প্রয়োজনীয় সেবা খুঁজে নিন।' },
    { icon: Handshake, step: "০৩", title: 'যোগাযোগ ও দর প্রস্তাব', desc: 'সরাসরি যোগাযোগ করুন, বিড দিন এবং উভয় পক্ষের সম্মতিতে ন্যায্য দাম নির্ধারণ করুন।' },
    { icon: Banknote, step: "০৪", title: 'লেনদেন সম্পন্ন করুন', desc: 'অর্ডার নিশ্চিত করে পেমেন্ট রেকর্ড, বুকিং এবং ডেলিভারির অগ্রগতি অনুসরণ করুন।' },
  ];

  return (
    <section className="py-16 md:py-20 bg-secondary/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <h2 className="font-heading font-bold text-3xl text-foreground">কীভাবে কাজ করে</h2>
          <p className="text-muted-foreground mt-3">সহজ চারটি ধাপে কৃষক-সেবা বিডি ব্যবহার করুন</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((s, i) => (
            <div key={i} className="text-center">
              <div className="relative mx-auto w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mb-4 shadow-lg shadow-primary/20">
                <s.icon className="w-7 h-7 text-primary-foreground" />
                <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-accent text-accent-foreground text-xs font-bold flex items-center justify-center">
                  {s.step}
                </span>
              </div>
              <h3 className="font-heading font-semibold text-foreground mb-1">{s.title}</h3>
              <p className="text-sm text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
