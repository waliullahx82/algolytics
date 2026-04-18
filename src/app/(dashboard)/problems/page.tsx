'use client';

import { useState, useMemo } from 'react';
import { Plus, Search, StickyNote, ExternalLink, Code, Cloud, ChevronLeft, ChevronRight, TrendingUp, RefreshCw } from 'lucide-react';
import { useSync } from '@/lib/SyncContext';

const TOPICS = ['All', 'Dynamic Programming', 'Graphs', 'Greedy', 'Math', 'Strings', 'Trees', 'Arrays'];
const PLATFORMS = ['All', 'codeforces', 'leetcode', 'hackerrank', 'manual'];
const DIFFICULTIES = ['All', 'Easy', 'Medium', 'Hard'];

function toValidDate(value: unknown): Date | null {
  if (!value) return null;

  const parsed = new Date(value as string | number | Date);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function toIsoDate(value: unknown): string {
  const date = toValidDate(value);
  if (!date) return 'N/A';
  return date.toISOString().slice(0, 10);
}

export default function ProblemsPage() {
  const { problems, loading, syncing } = useSync();
  
  const [filter, setFilter] = useState('All Solved');
  const [selectedTopic, setSelectedTopic] = useState('All');
  const [selectedPlatform, setSelectedPlatform] = useState('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const problemsPerPage = 10;

  const filteredProblems = useMemo(() => {
    return problems.filter(problem => {
      const matchesSearch = problem.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTopic = selectedTopic === 'All' || 
        problem.tags.some(tag => tag.toLowerCase().includes(selectedTopic.toLowerCase()));
      const matchesPlatform = selectedPlatform === 'All' || problem.platform === selectedPlatform;
      const matchesDifficulty = selectedDifficulty === 'All' || problem.difficulty === selectedDifficulty;
      
      return matchesSearch && matchesTopic && matchesPlatform && matchesDifficulty;
    }).sort((a, b) => {
      const aTime = toValidDate(a.solvedAt)?.getTime() || 0;
      const bTime = toValidDate(b.solvedAt)?.getTime() || 0;
      return bTime - aTime;
    });
  }, [problems, searchQuery, selectedTopic, selectedPlatform, selectedDifficulty]);

  const paginatedProblems = useMemo(() => {
    const start = (currentPage - 1) * problemsPerPage;
    return filteredProblems.slice(start, start + problemsPerPage);
  }, [filteredProblems, currentPage]);

  const totalPages = Math.ceil(filteredProblems.length / problemsPerPage);

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case 'Easy': return 'bg-[#00e3fd]/10 text-[#00d4ec] border-[#00d4ec]/20';
      case 'Medium': return 'bg-[#506600]/20 text-[#c3f400] border-[#c3f400]/20';
      case 'Hard': return 'bg-[#9f0519]/20 text-[#ff716c] border-[#ff716c]/20';
      default: return 'bg-[#1f262e] text-[#a7abb2] border-[#43484e]/20';
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'leetcode': return { icon: Code, color: '#81ecff' };
      case 'codeforces': return { icon: Cloud, color: '#ff716c' };
      case 'hackerrank': return { icon: Cloud, color: '#c3f400' };
      default: return { icon: Code, color: '#a7abb2' };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-100">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-8 h-8 text-[#81ecff] animate-spin" />
          <p className="text-[#a7abb2]">Loading problems...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black tracking-tight text-[#eaeef5]">Problem Archive</h2>
          <p className="text-[#a7abb2] mt-2 max-w-lg">
            {filteredProblems.length > 0 
              ? `Showing ${filteredProblems.length} problems`
              : problems.length === 0 
                ? 'Sync your platforms to see problems here'
                : 'No problems match your filters'
            }
          </p>
        </div>
        <div className="flex gap-4">
          <div className="bg-[#141a20] rounded-lg p-1 flex gap-1">
            {['All Solved', 'Favorites', 'By Topic'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-1.5 text-xs rounded font-bold transition-colors ${
                  filter === f
                    ? 'bg-[#1f262e] text-[#81ecff] shadow-sm'
                    : 'text-[#a7abb2] hover:text-[#eaeef5]'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Search */}
        <div className="md:col-span-4 bg-[#0e1419] p-4 rounded-xl">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a7abb2]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              placeholder="Search by problem title..."
              className="w-full bg-[#000000] border border-transparent rounded-lg pl-10 pr-4 py-2 text-sm text-[#eaeef5] placeholder-[#a7abb2]/40 focus:outline-none focus:border-[#81ecff]/40 focus:ring-1 focus:ring-[#81ecff]/40 transition-all"
            />
          </div>
        </div>

        {/* Topic Filter */}
        <div className="bg-[#0e1419] p-4 rounded-xl">
          <label className="block text-xs font-bold text-[#a7abb2] uppercase tracking-widest mb-3">Topic</label>
          <div className="flex flex-wrap gap-2">
            {TOPICS.map((topic) => (
              <button
                key={topic}
                onClick={() => { setSelectedTopic(topic); setCurrentPage(1); }}
                className={`px-3 py-1 text-xs rounded-full border cursor-pointer transition-colors ${
                  selectedTopic === topic
                    ? 'bg-[#81ecff]/10 text-[#81ecff] border-[#81ecff]/20'
                    : 'bg-[#1f262e] text-[#eaeef5] border-[#43484e]/10 hover:border-[#81ecff]/40'
                }`}
              >
                {topic}
              </button>
            ))}
          </div>
        </div>

        {/* Platform Filter */}
        <div className="bg-[#0e1419] p-4 rounded-xl">
          <label className="block text-xs font-bold text-[#a7abb2] uppercase tracking-widest mb-3">Platform</label>
          <div className="flex flex-wrap gap-2">
            {PLATFORMS.map((platform) => (
              <button
                key={platform}
                onClick={() => { setSelectedPlatform(platform); setCurrentPage(1); }}
                className={`px-3 py-1 text-xs rounded-full border cursor-pointer transition-colors capitalize ${
                  selectedPlatform === platform
                    ? 'bg-[#81ecff]/10 text-[#81ecff] border-[#81ecff]/20'
                    : 'bg-[#1f262e] text-[#eaeef5] border-[#43484e]/10 hover:border-[#81ecff]/40'
                }`}
              >
                {platform === 'All' ? 'All' : platform}
              </button>
            ))}
          </div>
        </div>

        {/* Difficulty Filter */}
        <div className="bg-[#0e1419] p-4 rounded-xl">
          <label className="block text-xs font-bold text-[#a7abb2] uppercase tracking-widest mb-3">Difficulty</label>
          <div className="flex flex-wrap gap-2">
            {DIFFICULTIES.map((diff) => (
              <button
                key={diff}
                onClick={() => { setSelectedDifficulty(diff); setCurrentPage(1); }}
                className={`px-3 py-1 text-xs rounded-full border cursor-pointer transition-colors ${
                  selectedDifficulty === diff
                    ? 'bg-[#81ecff]/10 text-[#81ecff] border-[#81ecff]/20'
                    : 'bg-[#1f262e] text-[#eaeef5] border-[#43484e]/10 hover:border-[#81ecff]/40'
                }`}
              >
                {diff}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Problem Table */}
      {paginatedProblems.length > 0 ? (
        <div className="bg-[#141a20] rounded-2xl overflow-hidden border border-[#43484e]/5">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#1a2027]/50 border-b border-[#43484e]/10">
                <th className="px-6 py-4 text-xs font-bold text-[#a7abb2] uppercase tracking-wider">Problem Name</th>
                <th className="px-6 py-4 text-xs font-bold text-[#a7abb2] uppercase tracking-wider">Platform</th>
                <th className="px-6 py-4 text-xs font-bold text-[#a7abb2] uppercase tracking-wider text-center">Difficulty</th>
                <th className="px-6 py-4 text-xs font-bold text-[#a7abb2] uppercase tracking-wider">Date Solved</th>
                <th className="px-6 py-4 text-xs font-bold text-[#a7abb2] uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#43484e]/5">
              {paginatedProblems.map((problem) => {
                const platformInfo = getPlatformIcon(problem.platform);
                const Icon = platformInfo.icon;
                
                return (
                  <tr
                    key={problem.id}
                    className="group hover:bg-[#252d35]/30 transition-colors"
                  >
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className="text-[#eaeef5] font-semibold hover:text-[#81ecff] transition-colors text-sm cursor-pointer">
                          {problem.title}
                        </span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {problem.tags.slice(0, 3).map((tag, i) => (
                            <span key={i} className="text-[10px] text-[#a7abb2] bg-[#1f262e] px-2 py-0.5 rounded">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4" style={{ color: platformInfo.color }} />
                        <span className="text-sm text-[#eaeef5] capitalize">{problem.platform}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex justify-center">
                        <span className={`px-3 py-1 text-[10px] font-bold rounded uppercase tracking-wider border ${getDifficultyColor(problem.difficulty)}`}>
                          {problem.difficulty || 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-sm text-[#a7abb2] font-mono">{toIsoDate(problem.solvedAt)}</span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex justify-end gap-3">
                        <button className="text-[#a7abb2] hover:text-[#d277ff] transition-colors" title="Add Notes">
                          <StickyNote className="w-4 h-4" />
                        </button>
                        {problem.problemUrl && (
                          <a href={problem.problemUrl} target="_blank" rel="noopener noreferrer" className="text-[#a7abb2] hover:text-[#81ecff] transition-colors">
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 bg-[#0e1419] border-t border-[#43484e]/10 flex items-center justify-between">
              <span className="text-xs text-[#a7abb2] font-medium">
                Showing <span className="text-[#eaeef5]">{(currentPage - 1) * problemsPerPage + 1}-{Math.min(currentPage * problemsPerPage, filteredProblems.length)}</span> of {filteredProblems.length}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 text-[#a7abb2] hover:text-[#eaeef5] disabled:opacity-30"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`px-3 py-1 text-xs rounded ${currentPage === i + 1 ? 'bg-[#1f262e] text-[#81ecff] font-bold' : 'text-[#a7abb2] hover:text-[#eaeef5]'}`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 text-[#a7abb2] hover:text-[#eaeef5] disabled:opacity-30"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-[#141a20] rounded-2xl p-12 text-center">
          <Cloud className="w-12 h-12 text-[#43484e] mx-auto mb-4" />
          <h3 className="text-xl font-bold text-[#eaeef5] mb-2">No Problems Found</h3>
          <p className="text-[#a7abb2]">
            {problems.length === 0 
              ? 'Add and sync your platforms to see your solved problems here'
              : 'Try adjusting your filters'
            }
          </p>
        </div>
      )}

      {/* Floating Action Button */}
      <button className="fixed bottom-8 right-8 w-14 h-14 bg-linear-to-br from-[#81ecff] to-[#00e3fd] rounded-xl shadow-2xl flex items-center justify-center text-[#003840] hover:scale-110 active:scale-95 transition-all duration-200 z-50">
        <Plus className="w-7 h-7" />
      </button>
    </div>
  );
}
