const CODEFORCES_API = 'https://codeforces.com/api';

export interface CodeforcesSubmission {
  id: number;
  contestId: number;
  problem: {
    contestId: number;
    index: string;
    name: string;
    type: string;
    rating?: number;
    tags: string[];
  };
  verdict: string;
  testset: string;
  lang: string;
  timeConsumedMillis: number;
  memoryConsumedBytes: number;
  creationTimeSeconds: number;
}

export interface CodeforcesUserInfo {
  handle: string;
  rating?: number;
  rank?: string;
  maxRating?: number;
  maxRank?: string;
  lastName: string;
  firstName?: string;
  country?: string;
  city?: string;
  organization?: string;
  contribution: number;
  avatar: string;
  titlePhoto: string;
}

export async function fetchCodeforcesData(handle: string) {
  try {
    const [userInfoRes, submissionsRes] = await Promise.all([
      fetch(`${CODEFORCES_API}/user.info?handles=${handle}`),
      fetch(`${CODEFORCES_API}/user.status?handle=${handle}`),
    ]);

    const userInfoData = await userInfoRes.json();
    const submissionsData = await submissionsRes.json();

    if (userInfoData.status !== 'OK') {
      throw new Error('User not found on Codeforces');
    }

    const userInfo: CodeforcesUserInfo = userInfoData.result[0];
    
    const submissions: CodeforcesSubmission[] = submissionsData.status === 'OK' 
      ? submissionsData.result 
      : [];

    const solvedProblems = new Map<string, CodeforcesSubmission>();
    
    submissions.forEach((sub) => {
      if (sub.verdict === 'OK') {
        const key = `${sub.problem.contestId}-${sub.problem.index}`;
        if (!solvedProblems.has(key)) {
          solvedProblems.set(key, sub);
        }
      }
    });

    const solvedList = Array.from(solvedProblems.values()).map((sub) => ({
      id: `${sub.problem.contestId}${sub.problem.index}`,
      contestId: sub.problem.contestId,
      index: sub.problem.index,
      title: sub.problem.name,
      rating: sub.problem.rating,
      tags: sub.problem.tags,
      solvedAt: sub.creationTimeSeconds ? new Date(sub.creationTimeSeconds * 1000).toISOString() : null,
      difficulty: sub.problem.rating ? (sub.problem.rating < 1200 ? 'Easy' : sub.problem.rating < 1900 ? 'Medium' : 'Hard') : 'Medium',
      lastSubmission: {
        lang: sub.lang,
        time: sub.timeConsumedMillis,
        memory: sub.memoryConsumedBytes,
      },
    }));

    const stats = {
      totalSolved: solvedList.length,
      rating: userInfo.rating || null,
      rank: userInfo.rank || null,
      maxRating: userInfo.maxRating || null,
      maxRank: userInfo.maxRank || null,
      avatar: userInfo.avatar,
      titlePhoto: userInfo.titlePhoto,
    };

    return {
      success: true,
      stats,
      solvedProblems: solvedList,
      recentSubmissions: submissions.slice(0, 20).map((sub) => ({
        id: sub.id,
        problem: {
          name: sub.problem.name,
          index: sub.problem.index,
        },
        verdict: sub.verdict,
        lang: sub.lang,
        time: sub.timeConsumedMillis,
        memory: sub.memoryConsumedBytes,
        timestamp: new Date((sub.creationTimeSeconds || 0) * 1000).toISOString(),
      })),
    };
  } catch (error) {
    console.error('Codeforces helper error:', error);
    throw error;
  }
}
