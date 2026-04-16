'use client';

import { MessageCircle, Mail, Github, Book, ExternalLink } from 'lucide-react';

export default function SupportPage() {
  const resources = [
    {
      icon: Book,
      title: 'Documentation',
      description: 'Setup and usage references for your workflow',
      link: 'https://nextjs.org/docs',
    },
    {
      icon: MessageCircle,
      title: 'Community Discord',
      description: 'Discuss progress and ask implementation questions',
      link: 'https://discord.com/invite/nextjs',
    },
    {
      icon: Mail,
      title: 'Contact Support',
      description: 'Get help from our team',
      link: 'mailto:support@algolytics.dev',
    },
    {
      icon: Github,
      title: 'GitHub',
      description: 'Report issues and contribute',
      link: 'https://github.com/topics/competitive-programming',
    },
  ];

  const faqs = [
    {
      q: 'How do I connect my Codeforces account?',
      a: 'Go to Settings > Platforms and enter your Codeforces handle. We will automatically sync your submission history.',
    },
    {
      q: 'Is my data private?',
      a: 'Yes, your data is private and only accessible to you. We use Firebase for secure authentication and data storage.',
    },
    {
      q: 'How does streak tracking work?',
      a: 'Streaks are calculated based on daily problem-solving activity. You need to solve at least one problem per day to maintain your streak.',
    },
    {
      q: 'Can I export my data?',
      a: 'Yes, you can export all your data from Settings > Data & Privacy > Export Data.',
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-4xl font-black tracking-tight text-[#eaeef5]">Support</h2>
        <p className="text-[#a7abb2] mt-2">
          Get help and connect with the Algolytics community.
        </p>
      </div>

      {/* Resources Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {resources.map((resource, index) => {
          const Icon = resource.icon;
          return (
            <a
              key={index}
              href={resource.link}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#141a20] p-6 rounded-xl border border-[#43484e]/10 hover:border-[#81ecff]/40 hover:bg-[#1a2027] transition-all group"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-[#1f262e] rounded-lg flex items-center justify-center group-hover:bg-[#81ecff]/10 transition-colors">
                  <Icon className="w-6 h-6 text-[#81ecff]" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-[#eaeef5]">{resource.title}</h3>
                    <ExternalLink className="w-4 h-4 text-[#a7abb2] opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <p className="text-sm text-[#a7abb2] mt-1">{resource.description}</p>
                </div>
              </div>
            </a>
          );
        })}
      </div>

      {/* FAQs */}
      <div className="bg-[#141a20] rounded-xl p-8">
        <h3 className="text-xl font-bold text-[#eaeef5] mb-6">Frequently Asked Questions</h3>
        <div className="space-y-6">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="border-b border-[#43484e]/10 pb-6 last:border-0 last:pb-0"
            >
              <h4 className="font-semibold text-[#eaeef5] mb-2">{faq.q}</h4>
              <p className="text-sm text-[#a7abb2] leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Contact Card */}
      <div className="bg-gradient-to-br from-[#81ecff]/10 to-[#00e3fd]/10 rounded-xl p-8 border border-[#81ecff]/20">
        <h3 className="text-xl font-bold text-[#eaeef5] mb-2">Need more help?</h3>
        <p className="text-[#a7abb2] mb-4">
          If you have questions or feedback, we would love to hear from you.
        </p>
        <div className="flex items-center gap-2">
          <Mail className="w-5 h-5 text-[#81ecff]" />
          <span className="font-mono text-[#81ecff]">support@algolytics.dev</span>
        </div>
      </div>
    </div>
  );
}
