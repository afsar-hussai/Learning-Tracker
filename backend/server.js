const express = require('express');
const cors = require('cors');
const path = require('path');
const Database = require('better-sqlite3');

const app = express();
const PORT = process.env.PORT || 5000;
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'data', 'db.sqlite');

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Initialize database
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ─── Schema ───────────────────────────────────────────────────────────────────

db.exec(`
  CREATE TABLE IF NOT EXISTS dsa_problems (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    leetcode_num INTEGER,
    url TEXT,
    difficulty TEXT DEFAULT 'Medium',
    pattern TEXT,
    hints TEXT DEFAULT '[]',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS dsa_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    problem_id INTEGER REFERENCES dsa_problems(id),
    date TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    notes TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS revision_schedule (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    problem_id INTEGER REFERENCES dsa_problems(id),
    due_date TEXT NOT NULL,
    revision_num INTEGER DEFAULT 1,
    completed INTEGER DEFAULT 0,
    completed_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS assessment_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pattern TEXT NOT NULL UNIQUE,
    level TEXT DEFAULT 'Medium',
    completed INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS assessment_done (
    id INTEGER PRIMARY KEY,
    done INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS skills (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phase INTEGER DEFAULT 1,
    status TEXT DEFAULT 'Not Started',
    confidence INTEGER DEFAULT 0,
    notes TEXT DEFAULT '',
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS certifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    target_month TEXT,
    cost INTEGER DEFAULT 0,
    status TEXT DEFAULT 'Not Started',
    exam_date TEXT,
    score TEXT DEFAULT '',
    notes TEXT DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS milestones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    month_num INTEGER,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    status TEXT DEFAULT 'pending',
    target_date TEXT,
    notes TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS journal_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL UNIQUE,
    learned TEXT DEFAULT '',
    problems_faced TEXT DEFAULT '',
    wins TEXT DEFAULT '',
    mood INTEGER DEFAULT 3,
    energy INTEGER DEFAULT 3,
    phase TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS apex_tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    layer INTEGER NOT NULL,
    layer_name TEXT NOT NULL,
    task_name TEXT NOT NULL,
    completed INTEGER DEFAULT 0,
    completed_at DATETIME,
    notes TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS apex_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    built_today TEXT DEFAULT '',
    blockers TEXT DEFAULT '',
    next_steps TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS apex_info (
    id INTEGER PRIMARY KEY,
    github_url TEXT DEFAULT '',
    live_url TEXT DEFAULT '',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );
`);

// ─── Seed Data ────────────────────────────────────────────────────────────────

function shouldSeed() {
  const count = db.prepare('SELECT COUNT(*) as c FROM dsa_problems').get();
  return count.c === 0;
}

const DSA_PROBLEMS = [
  // Sliding Window (12)
  { title: 'Maximum Average Subarray I', leetcode_num: 643, url: 'https://leetcode.com/problems/maximum-average-subarray-i/', difficulty: 'Easy', pattern: 'Sliding Window', hints: '["Use a sliding window of size k","Track running sum"]' },
  { title: 'Minimum Size Subarray Sum', leetcode_num: 209, url: 'https://leetcode.com/problems/minimum-size-subarray-sum/', difficulty: 'Medium', pattern: 'Sliding Window', hints: '["Expand right, shrink left","Track current window sum"]' },
  { title: 'Longest Substring Without Repeating Characters', leetcode_num: 3, url: 'https://leetcode.com/problems/longest-substring-without-repeating-characters/', difficulty: 'Medium', pattern: 'Sliding Window', hints: '["Use a set to track chars","Shrink window when duplicate found"]' },
  { title: 'Permutation in String', leetcode_num: 567, url: 'https://leetcode.com/problems/permutation-in-string/', difficulty: 'Medium', pattern: 'Sliding Window', hints: '["Fixed window size = len(s1)","Compare char frequency maps"]' },
  { title: 'Find All Anagrams in a String', leetcode_num: 438, url: 'https://leetcode.com/problems/find-all-anagrams-in-a-string/', difficulty: 'Medium', pattern: 'Sliding Window', hints: '["Sliding window of size p","Compare frequency counts"]' },
  { title: 'Minimum Window Substring', leetcode_num: 76, url: 'https://leetcode.com/problems/minimum-window-substring/', difficulty: 'Hard', pattern: 'Sliding Window', hints: '["Track char counts with map","Use have/need counters"]' },
  { title: 'Sliding Window Maximum', leetcode_num: 239, url: 'https://leetcode.com/problems/sliding-window-maximum/', difficulty: 'Hard', pattern: 'Sliding Window', hints: '["Use monotonic deque","Keep indices, not values"]' },
  { title: 'Longest Repeating Character Replacement', leetcode_num: 424, url: 'https://leetcode.com/problems/longest-repeating-character-replacement/', difficulty: 'Medium', pattern: 'Sliding Window', hints: '["Track max frequency char","Window valid if len - maxFreq <= k"]' },
  { title: 'Fruit Into Baskets', leetcode_num: 904, url: 'https://leetcode.com/problems/fruit-into-baskets/', difficulty: 'Medium', pattern: 'Sliding Window', hints: '["Sliding window with at most 2 distinct","Use HashMap for counts"]' },
  { title: 'Grumpy Bookstore Owner', leetcode_num: 1052, url: 'https://leetcode.com/problems/grumpy-bookstore-owner/', difficulty: 'Medium', pattern: 'Sliding Window', hints: '["Fixed window for grumpy minutes","Base satisfied + window extra"]' },
  { title: 'Maximum Points You Can Obtain from Cards', leetcode_num: 1423, url: 'https://leetcode.com/problems/maximum-points-you-can-obtain-from-cards/', difficulty: 'Medium', pattern: 'Sliding Window', hints: '["Sliding window of size n-k in middle","Total - min middle window"]' },
  { title: 'Longest Subarray of 1s After Deleting One Element', leetcode_num: 1493, url: 'https://leetcode.com/problems/longest-subarray-of-1s-after-deleting-one-element/', difficulty: 'Medium', pattern: 'Sliding Window', hints: '["Sliding window with at most one 0","Answer is window_size - 1"]' },

  // Two Pointers (12)
  { title: 'Two Sum II - Input Array Is Sorted', leetcode_num: 167, url: 'https://leetcode.com/problems/two-sum-ii-input-array-is-sorted/', difficulty: 'Medium', pattern: 'Two Pointers', hints: '["Left pointer at start, right at end","Move based on sum comparison"]' },
  { title: 'Container With Most Water', leetcode_num: 11, url: 'https://leetcode.com/problems/container-with-most-water/', difficulty: 'Medium', pattern: 'Two Pointers', hints: '["Greedy: move the shorter line","Area = min(h[l],h[r]) * (r-l)"]' },
  { title: '3Sum', leetcode_num: 15, url: 'https://leetcode.com/problems/3sum/', difficulty: 'Medium', pattern: 'Two Pointers', hints: '["Sort first","Fix one, two-pointer for rest","Skip duplicates"]' },
  { title: 'Remove Duplicates from Sorted Array', leetcode_num: 26, url: 'https://leetcode.com/problems/remove-duplicates-from-sorted-array/', difficulty: 'Easy', pattern: 'Two Pointers', hints: '["Slow pointer tracks unique position","Fast pointer scans ahead"]' },
  { title: 'Move Zeroes', leetcode_num: 283, url: 'https://leetcode.com/problems/move-zeroes/', difficulty: 'Easy', pattern: 'Two Pointers', hints: '["Slow pointer for next non-zero position","Swap with fast pointer"]' },
  { title: 'Valid Palindrome', leetcode_num: 125, url: 'https://leetcode.com/problems/valid-palindrome/', difficulty: 'Easy', pattern: 'Two Pointers', hints: '["Left and right pointers","Skip non-alphanumeric chars"]' },
  { title: '3Sum Closest', leetcode_num: 16, url: 'https://leetcode.com/problems/3sum-closest/', difficulty: 'Medium', pattern: 'Two Pointers', hints: '["Sort array","Fix one element, two pointer","Track closest sum"]' },
  { title: '4Sum', leetcode_num: 18, url: 'https://leetcode.com/problems/4sum/', difficulty: 'Medium', pattern: 'Two Pointers', hints: '["Sort, fix two elements","Two pointer for remaining two","Skip duplicates at all levels"]' },
  { title: 'Trapping Rain Water', leetcode_num: 42, url: 'https://leetcode.com/problems/trapping-rain-water/', difficulty: 'Hard', pattern: 'Two Pointers', hints: '["Track max from left and right","Water = min(maxL,maxR) - height[i]"]' },
  { title: 'Sort Colors', leetcode_num: 75, url: 'https://leetcode.com/problems/sort-colors/', difficulty: 'Medium', pattern: 'Two Pointers', hints: '["Dutch National Flag algorithm","Three pointers: low, mid, high"]' },
  { title: 'Squares of a Sorted Array', leetcode_num: 977, url: 'https://leetcode.com/problems/squares-of-a-sorted-array/', difficulty: 'Easy', pattern: 'Two Pointers', hints: '["Fill result from back","Compare absolute values at both ends"]' },
  { title: 'Boats to Save People', leetcode_num: 881, url: 'https://leetcode.com/problems/boats-to-save-people/', difficulty: 'Medium', pattern: 'Two Pointers', hints: '["Sort people","Greedy: pair heaviest with lightest if possible"]' },

  // Fast & Slow Pointers (10)
  { title: 'Linked List Cycle', leetcode_num: 141, url: 'https://leetcode.com/problems/linked-list-cycle/', difficulty: 'Easy', pattern: 'Fast & Slow Pointers', hints: '["Slow moves 1, fast moves 2","If they meet, cycle exists"]' },
  { title: 'Linked List Cycle II', leetcode_num: 142, url: 'https://leetcode.com/problems/linked-list-cycle-ii/', difficulty: 'Medium', pattern: 'Fast & Slow Pointers', hints: '["Detect cycle first","Reset slow to head, move both by 1 to find entry"]' },
  { title: 'Happy Number', leetcode_num: 202, url: 'https://leetcode.com/problems/happy-number/', difficulty: 'Easy', pattern: 'Fast & Slow Pointers', hints: '["Apply digit square sum as next","Floyd cycle detection"]' },
  { title: 'Find the Duplicate Number', leetcode_num: 287, url: 'https://leetcode.com/problems/find-the-duplicate-number/', difficulty: 'Medium', pattern: 'Fast & Slow Pointers', hints: '["Treat array as linked list","nums[i] points to index nums[i]","Floyd cycle = duplicate"]' },
  { title: 'Middle of the Linked List', leetcode_num: 876, url: 'https://leetcode.com/problems/middle-of-the-linked-list/', difficulty: 'Easy', pattern: 'Fast & Slow Pointers', hints: '["Fast moves 2x, slow moves 1x","When fast reaches end, slow is at middle"]' },
  { title: 'Palindrome Linked List', leetcode_num: 234, url: 'https://leetcode.com/problems/palindrome-linked-list/', difficulty: 'Easy', pattern: 'Fast & Slow Pointers', hints: '["Find middle, reverse second half","Compare first and second halves"]' },
  { title: 'Remove Nth Node From End of List', leetcode_num: 19, url: 'https://leetcode.com/problems/remove-nth-node-from-end-of-list/', difficulty: 'Medium', pattern: 'Fast & Slow Pointers', hints: '["Move fast n steps ahead","Move both until fast is null"]' },
  { title: 'Reorder List', leetcode_num: 143, url: 'https://leetcode.com/problems/reorder-list/', difficulty: 'Medium', pattern: 'Fast & Slow Pointers', hints: '["Find middle, reverse second half","Merge two halves alternately"]' },
  { title: 'Circular Array Loop', leetcode_num: 457, url: 'https://leetcode.com/problems/circular-array-loop/', difficulty: 'Medium', pattern: 'Fast & Slow Pointers', hints: '["Fast/slow with modular arithmetic","All elements in cycle must have same direction"]' },
  { title: 'Intersection of Two Linked Lists', leetcode_num: 160, url: 'https://leetcode.com/problems/intersection-of-two-linked-lists/', difficulty: 'Easy', pattern: 'Fast & Slow Pointers', hints: '["Switch lists when reaching end","Both pointers travel same total distance"]' },

  // Binary Search (15)
  { title: 'Binary Search', leetcode_num: 704, url: 'https://leetcode.com/problems/binary-search/', difficulty: 'Easy', pattern: 'Binary Search', hints: '["Classic binary search template","mid = left + (right-left)//2"]' },
  { title: 'Search Insert Position', leetcode_num: 35, url: 'https://leetcode.com/problems/search-insert-position/', difficulty: 'Easy', pattern: 'Binary Search', hints: '["Binary search, return left when not found"]' },
  { title: 'Find Minimum in Rotated Sorted Array', leetcode_num: 153, url: 'https://leetcode.com/problems/find-minimum-in-rotated-sorted-array/', difficulty: 'Medium', pattern: 'Binary Search', hints: '["Compare mid with right","If mid > right, min is in right half"]' },
  { title: 'Search in Rotated Sorted Array', leetcode_num: 33, url: 'https://leetcode.com/problems/search-in-rotated-sorted-array/', difficulty: 'Medium', pattern: 'Binary Search', hints: '["Determine which half is sorted","Check if target is in sorted half"]' },
  { title: 'Find Peak Element', leetcode_num: 162, url: 'https://leetcode.com/problems/find-peak-element/', difficulty: 'Medium', pattern: 'Binary Search', hints: '["Binary search on slope","If nums[mid] < nums[mid+1], peak is right"]' },
  { title: 'Search a 2D Matrix', leetcode_num: 74, url: 'https://leetcode.com/problems/search-a-2d-matrix/', difficulty: 'Medium', pattern: 'Binary Search', hints: '["Treat matrix as flat sorted array","Map index: row = mid//n, col = mid%n"]' },
  { title: 'Kth Smallest Element in a Sorted Matrix', leetcode_num: 378, url: 'https://leetcode.com/problems/kth-smallest-element-in-a-sorted-matrix/', difficulty: 'Medium', pattern: 'Binary Search', hints: '["Binary search on value range","Count elements <= mid in O(n)"]' },
  { title: 'Time Based Key-Value Store', leetcode_num: 981, url: 'https://leetcode.com/problems/time-based-key-value-store/', difficulty: 'Medium', pattern: 'Binary Search', hints: '["Store list of (timestamp, value) per key","Binary search for largest timestamp <= t"]' },
  { title: 'Median of Two Sorted Arrays', leetcode_num: 4, url: 'https://leetcode.com/problems/median-of-two-sorted-arrays/', difficulty: 'Hard', pattern: 'Binary Search', hints: '["Binary search on smaller array partition","Ensure maxLeft <= minRight"]' },
  { title: 'First Bad Version', leetcode_num: 278, url: 'https://leetcode.com/problems/first-bad-version/', difficulty: 'Easy', pattern: 'Binary Search', hints: '["Binary search for first true in boolean array","Save result when isBadVersion is true"]' },
  { title: 'Capacity To Ship Packages Within D Days', leetcode_num: 1011, url: 'https://leetcode.com/problems/capacity-to-ship-packages-within-d-days/', difficulty: 'Medium', pattern: 'Binary Search', hints: '["Binary search on capacity range","Check if current capacity is feasible"]' },
  { title: 'Koko Eating Bananas', leetcode_num: 875, url: 'https://leetcode.com/problems/koko-eating-bananas/', difficulty: 'Medium', pattern: 'Binary Search', hints: '["Binary search on eating speed","For each speed check if h hours sufficient"]' },
  { title: 'Minimum Number of Days to Make m Bouquets', leetcode_num: 1482, url: 'https://leetcode.com/problems/minimum-number-of-days-to-make-m-bouquets/', difficulty: 'Medium', pattern: 'Binary Search', hints: '["Binary search on number of days","Check if enough bouquets in given days"]' },
  { title: 'Find K Closest Elements', leetcode_num: 658, url: 'https://leetcode.com/problems/find-k-closest-elements/', difficulty: 'Medium', pattern: 'Binary Search', hints: '["Binary search for left boundary of window","Compare a[mid] vs a[mid+k] distance to x"]' },
  { title: 'Count of Smaller Numbers After Self', leetcode_num: 315, url: 'https://leetcode.com/problems/count-of-smaller-numbers-after-self/', difficulty: 'Hard', pattern: 'Binary Search', hints: '["Build sorted list from right","Binary search for insertion position"]' },

  // BFS/DFS Graphs (18)
  { title: 'Number of Islands', leetcode_num: 200, url: 'https://leetcode.com/problems/number-of-islands/', difficulty: 'Medium', pattern: 'BFS/DFS Graphs', hints: '["DFS from each unvisited 1","Mark visited cells as 0"]' },
  { title: 'Clone Graph', leetcode_num: 133, url: 'https://leetcode.com/problems/clone-graph/', difficulty: 'Medium', pattern: 'BFS/DFS Graphs', hints: '["BFS with visited hashmap","Map old node to new clone node"]' },
  { title: 'Max Area of Island', leetcode_num: 695, url: 'https://leetcode.com/problems/max-area-of-island/', difficulty: 'Medium', pattern: 'BFS/DFS Graphs', hints: '["DFS returns size of island","Track maximum seen"]' },
  { title: 'Pacific Atlantic Water Flow', leetcode_num: 417, url: 'https://leetcode.com/problems/pacific-atlantic-water-flow/', difficulty: 'Medium', pattern: 'BFS/DFS Graphs', hints: '["BFS from ocean borders inward","Find intersection of reachable sets"]' },
  { title: 'Surrounded Regions', leetcode_num: 130, url: 'https://leetcode.com/problems/surrounded-regions/', difficulty: 'Medium', pattern: 'BFS/DFS Graphs', hints: '["DFS from border O cells, mark safe","Flip remaining O to X"]' },
  { title: 'Rotting Oranges', leetcode_num: 994, url: 'https://leetcode.com/problems/rotting-oranges/', difficulty: 'Medium', pattern: 'BFS/DFS Graphs', hints: '["Multi-source BFS from all rotten oranges","Track minutes and fresh count"]' },
  { title: 'Course Schedule', leetcode_num: 207, url: 'https://leetcode.com/problems/course-schedule/', difficulty: 'Medium', pattern: 'BFS/DFS Graphs', hints: '["Build directed graph","Detect cycle with DFS or Kahn topological sort"]' },
  { title: 'Course Schedule II', leetcode_num: 210, url: 'https://leetcode.com/problems/course-schedule-ii/', difficulty: 'Medium', pattern: 'BFS/DFS Graphs', hints: '["Topological sort with Kahn algorithm","Return order if no cycle"]' },
  { title: 'Number of Connected Components in Undirected Graph', leetcode_num: 323, url: 'https://leetcode.com/problems/number-of-connected-components-in-an-undirected-graph/', difficulty: 'Medium', pattern: 'BFS/DFS Graphs', hints: '["Union-Find or DFS","Count disconnected components"]' },
  { title: 'Word Ladder', leetcode_num: 127, url: 'https://leetcode.com/problems/word-ladder/', difficulty: 'Hard', pattern: 'BFS/DFS Graphs', hints: '["BFS level by level","Replace each char with a-z, check in wordList"]' },
  { title: 'Shortest Path in Binary Matrix', leetcode_num: 1091, url: 'https://leetcode.com/problems/shortest-path-in-binary-matrix/', difficulty: 'Medium', pattern: 'BFS/DFS Graphs', hints: '["BFS from top-left","8-directional movement, track distance"]' },
  { title: 'Network Delay Time', leetcode_num: 743, url: 'https://leetcode.com/problems/network-delay-time/', difficulty: 'Medium', pattern: 'BFS/DFS Graphs', hints: '["Dijkstra from source k","Max of all shortest paths"]' },
  { title: 'Cheapest Flights Within K Stops', leetcode_num: 787, url: 'https://leetcode.com/problems/cheapest-flights-within-k-stops/', difficulty: 'Medium', pattern: 'BFS/DFS Graphs', hints: '["Bellman-Ford with K+1 iterations","BFS with prices array"]' },
  { title: 'Jump Game III', leetcode_num: 1306, url: 'https://leetcode.com/problems/jump-game-iii/', difficulty: 'Medium', pattern: 'BFS/DFS Graphs', hints: '["BFS from start index","Can jump to i+arr[i] or i-arr[i]"]' },
  { title: 'Number of Provinces', leetcode_num: 547, url: 'https://leetcode.com/problems/number-of-provinces/', difficulty: 'Medium', pattern: 'BFS/DFS Graphs', hints: '["DFS from each unvisited city","Count DFS calls = number of provinces"]' },
  { title: 'Keys and Rooms', leetcode_num: 841, url: 'https://leetcode.com/problems/keys-and-rooms/', difficulty: 'Medium', pattern: 'BFS/DFS Graphs', hints: '["DFS from room 0 using keys found","Check if all rooms visited"]' },
  { title: 'Find if Path Exists in Graph', leetcode_num: 1971, url: 'https://leetcode.com/problems/find-if-path-exists-in-graph/', difficulty: 'Easy', pattern: 'BFS/DFS Graphs', hints: '["Union-Find or BFS/DFS","Check if source and destination are connected"]' },
  { title: 'Minimum Number of Vertices to Reach All Nodes', leetcode_num: 1557, url: 'https://leetcode.com/problems/minimum-number-of-vertices-to-reach-all-nodes/', difficulty: 'Medium', pattern: 'BFS/DFS Graphs', hints: '["Nodes with no incoming edges are required","Collect all nodes with in-degree 0"]' },

  // Dynamic Programming (22)
  { title: 'Climbing Stairs', leetcode_num: 70, url: 'https://leetcode.com/problems/climbing-stairs/', difficulty: 'Easy', pattern: 'Dynamic Programming', hints: '["dp[i] = dp[i-1] + dp[i-2]","Fibonacci pattern"]' },
  { title: 'House Robber', leetcode_num: 198, url: 'https://leetcode.com/problems/house-robber/', difficulty: 'Medium', pattern: 'Dynamic Programming', hints: '["dp[i] = max(dp[i-1], dp[i-2]+nums[i])","Cannot rob adjacent houses"]' },
  { title: 'House Robber II', leetcode_num: 213, url: 'https://leetcode.com/problems/house-robber-ii/', difficulty: 'Medium', pattern: 'Dynamic Programming', hints: '["Circular: run House Robber on [0..n-2] and [1..n-1]","Take max of both"]' },
  { title: 'Longest Palindromic Substring', leetcode_num: 5, url: 'https://leetcode.com/problems/longest-palindromic-substring/', difficulty: 'Medium', pattern: 'Dynamic Programming', hints: '["Expand around center for each char","Check odd and even length palindromes"]' },
  { title: 'Coin Change', leetcode_num: 322, url: 'https://leetcode.com/problems/coin-change/', difficulty: 'Medium', pattern: 'Dynamic Programming', hints: '["dp[i] = min coins to make amount i","dp[i] = min(dp[i-coin]+1) for each coin"]' },
  { title: 'Maximum Product Subarray', leetcode_num: 152, url: 'https://leetcode.com/problems/maximum-product-subarray/', difficulty: 'Medium', pattern: 'Dynamic Programming', hints: '["Track max and min at each position","Negative * negative = positive"]' },
  { title: 'Word Break', leetcode_num: 139, url: 'https://leetcode.com/problems/word-break/', difficulty: 'Medium', pattern: 'Dynamic Programming', hints: '["dp[i] = true if s[0..i] can be segmented","Try all words as suffix"]' },
  { title: 'Decode Ways', leetcode_num: 91, url: 'https://leetcode.com/problems/decode-ways/', difficulty: 'Medium', pattern: 'Dynamic Programming', hints: '["dp[i] = ways to decode s[0..i]","Check 1-digit and 2-digit valid decodings"]' },
  { title: 'Unique Paths', leetcode_num: 62, url: 'https://leetcode.com/problems/unique-paths/', difficulty: 'Medium', pattern: 'Dynamic Programming', hints: '["dp[i][j] = dp[i-1][j] + dp[i][j-1]","Can optimize to 1D array"]' },
  { title: 'Jump Game', leetcode_num: 55, url: 'https://leetcode.com/problems/jump-game/', difficulty: 'Medium', pattern: 'Dynamic Programming', hints: '["Track max reachable index","Greedy: update max at each step"]' },
  { title: 'Partition Equal Subset Sum', leetcode_num: 416, url: 'https://leetcode.com/problems/partition-equal-subset-sum/', difficulty: 'Medium', pattern: 'Dynamic Programming', hints: '["0/1 knapsack","dp[j] = can we make sum j","Target = totalSum / 2"]' },
  { title: 'Target Sum', leetcode_num: 494, url: 'https://leetcode.com/problems/target-sum/', difficulty: 'Medium', pattern: 'Dynamic Programming', hints: '["dp[sum] = number of ways to reach sum","Or DFS with memoization"]' },
  { title: 'Longest Common Subsequence', leetcode_num: 1143, url: 'https://leetcode.com/problems/longest-common-subsequence/', difficulty: 'Medium', pattern: 'Dynamic Programming', hints: '["dp[i][j] = LCS of s1[0..i] and s2[0..j]","Match: dp[i-1][j-1]+1, No match: max(dp[i-1][j],dp[i][j-1])"]' },
  { title: 'Edit Distance', leetcode_num: 72, url: 'https://leetcode.com/problems/edit-distance/', difficulty: 'Hard', pattern: 'Dynamic Programming', hints: '["dp[i][j] = min operations to convert word1[0..i] to word2[0..j]","3 operations: insert, delete, replace"]' },
  { title: 'Best Time to Buy and Sell Stock', leetcode_num: 121, url: 'https://leetcode.com/problems/best-time-to-buy-and-sell-stock/', difficulty: 'Easy', pattern: 'Dynamic Programming', hints: '["Track min price seen so far","profit = price - minPrice"]' },
  { title: 'Best Time to Buy and Sell Stock III', leetcode_num: 123, url: 'https://leetcode.com/problems/best-time-to-buy-and-sell-stock-iii/', difficulty: 'Hard', pattern: 'Dynamic Programming', hints: '["At most 2 transactions","Track 4 states: buy1,sell1,buy2,sell2"]' },
  { title: 'Regular Expression Matching', leetcode_num: 10, url: 'https://leetcode.com/problems/regular-expression-matching/', difficulty: 'Hard', pattern: 'Dynamic Programming', hints: '["dp[i][j] = s[0..i] matches p[0..j]","Handle . and * cases separately"]' },
  { title: 'Palindromic Substrings', leetcode_num: 647, url: 'https://leetcode.com/problems/palindromic-substrings/', difficulty: 'Medium', pattern: 'Dynamic Programming', hints: '["Expand around center","Count odd and even length palindromes"]' },
  { title: 'Longest Increasing Subsequence', leetcode_num: 300, url: 'https://leetcode.com/problems/longest-increasing-subsequence/', difficulty: 'Medium', pattern: 'Dynamic Programming', hints: '["dp[i] = LIS ending at index i","O(n log n) with patience sort"]' },
  { title: 'Maximum Subarray', leetcode_num: 53, url: 'https://leetcode.com/problems/maximum-subarray/', difficulty: 'Medium', pattern: 'Dynamic Programming', hints: '["Kadane algorithm","currentSum = max(num, currentSum+num)"]' },
  { title: 'Combination Sum IV', leetcode_num: 377, url: 'https://leetcode.com/problems/combination-sum-iv/', difficulty: 'Medium', pattern: 'Dynamic Programming', hints: '["dp[i] = number of ways to reach target i","Order matters (permutations not combinations)"]' },
  { title: 'Burst Balloons', leetcode_num: 312, url: 'https://leetcode.com/problems/burst-balloons/', difficulty: 'Hard', pattern: 'Dynamic Programming', hints: '["Interval DP","Think of last balloon to burst in interval","dp[l][r] = max coins bursting all balloons in (l,r)"]' },

  // Trees DFS/BFS (16)
  { title: 'Maximum Depth of Binary Tree', leetcode_num: 104, url: 'https://leetcode.com/problems/maximum-depth-of-binary-tree/', difficulty: 'Easy', pattern: 'Trees DFS/BFS', hints: '["DFS: return 1 + max(left, right)","BFS: count levels"]' },
  { title: 'Same Tree', leetcode_num: 100, url: 'https://leetcode.com/problems/same-tree/', difficulty: 'Easy', pattern: 'Trees DFS/BFS', hints: '["Recursively compare nodes","Both null or values equal and subtrees same"]' },
  { title: 'Invert Binary Tree', leetcode_num: 226, url: 'https://leetcode.com/problems/invert-binary-tree/', difficulty: 'Easy', pattern: 'Trees DFS/BFS', hints: '["Swap left and right children","Recursively invert subtrees"]' },
  { title: 'Binary Tree Maximum Path Sum', leetcode_num: 124, url: 'https://leetcode.com/problems/binary-tree-maximum-path-sum/', difficulty: 'Hard', pattern: 'Trees DFS/BFS', hints: '["DFS returns max gain through node","Path sum = node + max(left,0) + max(right,0)"]' },
  { title: 'Binary Tree Level Order Traversal', leetcode_num: 102, url: 'https://leetcode.com/problems/binary-tree-level-order-traversal/', difficulty: 'Medium', pattern: 'Trees DFS/BFS', hints: '["BFS with queue","Process all nodes at current level before next"]' },
  { title: 'Serialize and Deserialize Binary Tree', leetcode_num: 297, url: 'https://leetcode.com/problems/serialize-and-deserialize-binary-tree/', difficulty: 'Hard', pattern: 'Trees DFS/BFS', hints: '["Preorder with null markers","Use index to track position during deserialization"]' },
  { title: 'Subtree of Another Tree', leetcode_num: 572, url: 'https://leetcode.com/problems/subtree-of-another-tree/', difficulty: 'Easy', pattern: 'Trees DFS/BFS', hints: '["For each node check if subtrees match","Use isSameTree helper"]' },
  { title: 'Construct Binary Tree from Preorder and Inorder', leetcode_num: 105, url: 'https://leetcode.com/problems/construct-binary-tree-from-preorder-and-inorder-traversal/', difficulty: 'Medium', pattern: 'Trees DFS/BFS', hints: '["First preorder element is root","Find root in inorder to split left/right"]' },
  { title: 'Validate Binary Search Tree', leetcode_num: 98, url: 'https://leetcode.com/problems/validate-binary-search-tree/', difficulty: 'Medium', pattern: 'Trees DFS/BFS', hints: '["Pass valid range (min,max) to each node","In-order traversal should be strictly increasing"]' },
  { title: 'Kth Smallest Element in a BST', leetcode_num: 230, url: 'https://leetcode.com/problems/kth-smallest-element-in-a-bst/', difficulty: 'Medium', pattern: 'Trees DFS/BFS', hints: '["In-order traversal gives sorted order","Count k elements, return k-th"]' },
  { title: 'Lowest Common Ancestor of BST', leetcode_num: 235, url: 'https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-search-tree/', difficulty: 'Medium', pattern: 'Trees DFS/BFS', hints: '["If both p,q < root, go left","If both > root, go right, else root is LCA"]' },
  { title: 'Lowest Common Ancestor of Binary Tree', leetcode_num: 236, url: 'https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-tree/', difficulty: 'Medium', pattern: 'Trees DFS/BFS', hints: '["If node is p or q, return it","LCA is where both left and right return non-null"]' },
  { title: 'Binary Tree Right Side View', leetcode_num: 199, url: 'https://leetcode.com/problems/binary-tree-right-side-view/', difficulty: 'Medium', pattern: 'Trees DFS/BFS', hints: '["BFS, take last node at each level","Or DFS right first, add first node of each depth"]' },
  { title: 'Count Good Nodes in Binary Tree', leetcode_num: 1448, url: 'https://leetcode.com/problems/count-good-nodes-in-binary-tree/', difficulty: 'Medium', pattern: 'Trees DFS/BFS', hints: '["DFS tracking max value on path","Node is good if its value >= max on path from root"]' },
  { title: 'Path Sum II', leetcode_num: 113, url: 'https://leetcode.com/problems/path-sum-ii/', difficulty: 'Medium', pattern: 'Trees DFS/BFS', hints: '["DFS backtracking","Add to result when leaf reached with targetSum"]' },
  { title: 'Symmetric Tree', leetcode_num: 101, url: 'https://leetcode.com/problems/symmetric-tree/', difficulty: 'Easy', pattern: 'Trees DFS/BFS', hints: '["Check if left and right subtrees are mirrors","isMirror: left.left vs right.right and left.right vs right.left"]' },

  // Heaps & Priority Queue (11)
  { title: 'Kth Largest Element in an Array', leetcode_num: 215, url: 'https://leetcode.com/problems/kth-largest-element-in-an-array/', difficulty: 'Medium', pattern: 'Heaps & Priority Queue', hints: '["Min-heap of size k","Pop if size > k, top is kth largest"]' },
  { title: 'Top K Frequent Elements', leetcode_num: 347, url: 'https://leetcode.com/problems/top-k-frequent-elements/', difficulty: 'Medium', pattern: 'Heaps & Priority Queue', hints: '["Count frequencies","Min-heap of size k on frequencies"]' },
  { title: 'Find Median from Data Stream', leetcode_num: 295, url: 'https://leetcode.com/problems/find-median-from-data-stream/', difficulty: 'Hard', pattern: 'Heaps & Priority Queue', hints: '["Max-heap for lower half, min-heap for upper half","Balance sizes, median = tops"]' },
  { title: 'Task Scheduler', leetcode_num: 621, url: 'https://leetcode.com/problems/task-scheduler/', difficulty: 'Medium', pattern: 'Heaps & Priority Queue', hints: '["Most frequent task determines idle time","Formula: (maxFreq-1)*(n+1) + countOfMaxFreq"]' },
  { title: 'K Closest Points to Origin', leetcode_num: 973, url: 'https://leetcode.com/problems/k-closest-points-to-origin/', difficulty: 'Medium', pattern: 'Heaps & Priority Queue', hints: '["Max-heap of size k on distance","Or quickselect O(n) average"]' },
  { title: 'Merge K Sorted Lists', leetcode_num: 23, url: 'https://leetcode.com/problems/merge-k-sorted-lists/', difficulty: 'Hard', pattern: 'Heaps & Priority Queue', hints: '["Min-heap with (val, listIndex)","Pop min, push next from same list"]' },
  { title: 'Find K Pairs with Smallest Sums', leetcode_num: 373, url: 'https://leetcode.com/problems/find-k-pairs-with-smallest-sums/', difficulty: 'Medium', pattern: 'Heaps & Priority Queue', hints: '["Min-heap starting with (nums1[i], nums2[0])","Push (nums1[i], nums2[j+1]) after popping (i,j)"]' },
  { title: 'Kth Largest Element in a Stream', leetcode_num: 703, url: 'https://leetcode.com/problems/kth-largest-element-in-a-stream/', difficulty: 'Easy', pattern: 'Heaps & Priority Queue', hints: '["Min-heap of size k","Top of heap is kth largest"]' },
  { title: 'Last Stone Weight', leetcode_num: 1046, url: 'https://leetcode.com/problems/last-stone-weight/', difficulty: 'Easy', pattern: 'Heaps & Priority Queue', hints: '["Max-heap simulation","Pop two heaviest, push difference if any"]' },
  { title: 'Design Twitter', leetcode_num: 355, url: 'https://leetcode.com/problems/design-twitter/', difficulty: 'Medium', pattern: 'Heaps & Priority Queue', hints: '["Store tweets with timestamp","Merge top 10 from all followed users with heap"]' },
  { title: 'IPO', leetcode_num: 502, url: 'https://leetcode.com/problems/ipo/', difficulty: 'Hard', pattern: 'Heaps & Priority Queue', hints: '["Min-heap on capital for available projects","Max-heap on profit for affordable projects","Pick k times"]' },

  // Backtracking (12)
  { title: 'Subsets', leetcode_num: 78, url: 'https://leetcode.com/problems/subsets/', difficulty: 'Medium', pattern: 'Backtracking', hints: '["At each index: include or exclude","Or iteratively add each number to all existing subsets"]' },
  { title: 'Combination Sum', leetcode_num: 39, url: 'https://leetcode.com/problems/combination-sum/', difficulty: 'Medium', pattern: 'Backtracking', hints: '["Can reuse elements, not move back","Backtrack if sum exceeds target"]' },
  { title: 'Combination Sum II', leetcode_num: 40, url: 'https://leetcode.com/problems/combination-sum-ii/', difficulty: 'Medium', pattern: 'Backtracking', hints: '["Sort, skip duplicates at same level","Cannot reuse same element"]' },
  { title: 'Permutations', leetcode_num: 46, url: 'https://leetcode.com/problems/permutations/', difficulty: 'Medium', pattern: 'Backtracking', hints: '["Swap current with each index ahead","Backtrack by swapping back"]' },
  { title: 'Word Search', leetcode_num: 79, url: 'https://leetcode.com/problems/word-search/', difficulty: 'Medium', pattern: 'Backtracking', hints: '["DFS from each cell matching first char","Mark visited, unmark on backtrack"]' },
  { title: 'Palindrome Partitioning', leetcode_num: 131, url: 'https://leetcode.com/problems/palindrome-partitioning/', difficulty: 'Medium', pattern: 'Backtracking', hints: '["At each index try all palindrome substrings","Backtrack after adding valid palindrome"]' },
  { title: 'Letter Combinations of a Phone Number', leetcode_num: 17, url: 'https://leetcode.com/problems/letter-combinations-of-a-phone-number/', difficulty: 'Medium', pattern: 'Backtracking', hints: '["Map digits to letters","Backtrack: add each letter for current digit"]' },
  { title: 'N-Queens', leetcode_num: 51, url: 'https://leetcode.com/problems/n-queens/', difficulty: 'Hard', pattern: 'Backtracking', hints: '["Place one queen per row","Track cols, diagonals, anti-diagonals in sets"]' },
  { title: 'Restore IP Addresses', leetcode_num: 93, url: 'https://leetcode.com/problems/restore-ip-addresses/', difficulty: 'Medium', pattern: 'Backtracking', hints: '["Try 1, 2, 3 digit segments","Validate each segment (0-255, no leading zeros)"]' },
  { title: 'Generate Parentheses', leetcode_num: 22, url: 'https://leetcode.com/problems/generate-parentheses/', difficulty: 'Medium', pattern: 'Backtracking', hints: '["open < n: add open","close < open: add close","Stop when length = 2n"]' },
  { title: 'Subsets II', leetcode_num: 90, url: 'https://leetcode.com/problems/subsets-ii/', difficulty: 'Medium', pattern: 'Backtracking', hints: '["Sort array","Skip duplicates at same tree level","Include/exclude pattern"]' },
  { title: 'Permutations II', leetcode_num: 47, url: 'https://leetcode.com/problems/permutations-ii/', difficulty: 'Medium', pattern: 'Backtracking', hints: '["Sort, use visited array","Skip if current == previous and previous not visited"]' },

  // Monotonic Stack (10)
  { title: 'Daily Temperatures', leetcode_num: 739, url: 'https://leetcode.com/problems/daily-temperatures/', difficulty: 'Medium', pattern: 'Monotonic Stack', hints: '["Decreasing monotonic stack of indices","Pop when current temp > stack top temp"]' },
  { title: 'Car Fleet', leetcode_num: 853, url: 'https://leetcode.com/problems/car-fleet/', difficulty: 'Medium', pattern: 'Monotonic Stack', hints: '["Sort by position descending","Push time to reach target, pop if <= previous"]' },
  { title: 'Largest Rectangle in Histogram', leetcode_num: 84, url: 'https://leetcode.com/problems/largest-rectangle-in-histogram/', difficulty: 'Hard', pattern: 'Monotonic Stack', hints: '["Increasing stack of indices","Pop when shorter bar found, compute area"]' },
  { title: 'Next Greater Element I', leetcode_num: 496, url: 'https://leetcode.com/problems/next-greater-element-i/', difficulty: 'Easy', pattern: 'Monotonic Stack', hints: '["Monotonic stack on nums2","Build hashmap of element to next greater"]' },
  { title: 'Next Greater Element II', leetcode_num: 503, url: 'https://leetcode.com/problems/next-greater-element-ii/', difficulty: 'Medium', pattern: 'Monotonic Stack', hints: '["Circular array: traverse 2n indices with mod","Decreasing stack of indices"]' },
  { title: 'Online Stock Span', leetcode_num: 901, url: 'https://leetcode.com/problems/online-stock-span/', difficulty: 'Medium', pattern: 'Monotonic Stack', hints: '["Stack of (price, span) pairs","Pop while stack top price <= current, add spans"]' },
  { title: 'Sum of Subarray Minimums', leetcode_num: 907, url: 'https://leetcode.com/problems/sum-of-subarray-minimums/', difficulty: 'Medium', pattern: 'Monotonic Stack', hints: '["For each element find left and right bounds where it is minimum","Contribution = arr[i] * left * right"]' },
  { title: 'Asteroid Collision', leetcode_num: 735, url: 'https://leetcode.com/problems/asteroid-collision/', difficulty: 'Medium', pattern: 'Monotonic Stack', hints: '["Push positive asteroids","Negative: pop smaller positives, destroy if equal"]' },
  { title: 'Remove K Digits', leetcode_num: 402, url: 'https://leetcode.com/problems/remove-k-digits/', difficulty: 'Medium', pattern: 'Monotonic Stack', hints: '["Greedy: remove digit if it is greater than next","Monotonic increasing stack"]' },
  { title: '132 Pattern', leetcode_num: 456, url: 'https://leetcode.com/problems/132-pattern/', difficulty: 'Medium', pattern: 'Monotonic Stack', hints: '["Traverse right to left","Stack tracks potential 3 (largest so far that was popped)"]' },

  // Arrays & Hashing (12)
  { title: 'Two Sum', leetcode_num: 1, url: 'https://leetcode.com/problems/two-sum/', difficulty: 'Easy', pattern: 'Arrays & Hashing', hints: '["HashMap: store value -> index","Check if complement exists"]' },
  { title: 'Valid Anagram', leetcode_num: 242, url: 'https://leetcode.com/problems/valid-anagram/', difficulty: 'Easy', pattern: 'Arrays & Hashing', hints: '["Count char frequencies","Both strings must have same counts"]' },
  { title: 'Group Anagrams', leetcode_num: 49, url: 'https://leetcode.com/problems/group-anagrams/', difficulty: 'Medium', pattern: 'Arrays & Hashing', hints: '["Key = sorted word or char count tuple","Group words with same key"]' },
  { title: 'Product of Array Except Self', leetcode_num: 238, url: 'https://leetcode.com/problems/product-of-array-except-self/', difficulty: 'Medium', pattern: 'Arrays & Hashing', hints: '["Prefix products from left","Suffix products from right","No division needed"]' },
  { title: 'Valid Sudoku', leetcode_num: 36, url: 'https://leetcode.com/problems/valid-sudoku/', difficulty: 'Medium', pattern: 'Arrays & Hashing', hints: '["Check rows, cols, 3x3 boxes","Box index = (r//3)*3 + c//3"]' },
  { title: 'Longest Consecutive Sequence', leetcode_num: 128, url: 'https://leetcode.com/problems/longest-consecutive-sequence/', difficulty: 'Medium', pattern: 'Arrays & Hashing', hints: '["Add all to set","Start sequence only if n-1 not in set","Count up from start"]' },
  { title: 'Contains Duplicate', leetcode_num: 217, url: 'https://leetcode.com/problems/contains-duplicate/', difficulty: 'Easy', pattern: 'Arrays & Hashing', hints: '["Add to set, return true if already in set"]' },
  { title: 'Find All Numbers Disappeared in an Array', leetcode_num: 448, url: 'https://leetcode.com/problems/find-all-numbers-disappeared-in-an-array/', difficulty: 'Easy', pattern: 'Arrays & Hashing', hints: '["Negate value at index nums[i]-1","Numbers with positive values at their index are missing"]' },
  { title: 'Subarray Sum Equals K', leetcode_num: 560, url: 'https://leetcode.com/problems/subarray-sum-equals-k/', difficulty: 'Medium', pattern: 'Arrays & Hashing', hints: '["Prefix sum + hashmap","count += map[prefixSum - k]"]' },
  { title: 'Majority Element', leetcode_num: 169, url: 'https://leetcode.com/problems/majority-element/', difficulty: 'Easy', pattern: 'Arrays & Hashing', hints: '["Boyer-Moore voting algorithm","Count +1 for candidate, -1 for others"]' },
  { title: 'Encode and Decode Strings', leetcode_num: 271, url: 'https://leetcode.com/problems/encode-and-decode-strings/', difficulty: 'Medium', pattern: 'Arrays & Hashing', hints: '["Encode: prepend length and delimiter","Decode: read length, skip delimiter, extract string"]' },
  { title: 'Intersection of Two Arrays II', leetcode_num: 350, url: 'https://leetcode.com/problems/intersection-of-two-arrays-ii/', difficulty: 'Easy', pattern: 'Arrays & Hashing', hints: '["Count frequencies in first array","For each in second, if count > 0 add to result"]' },
];

const SKILLS = [
  { name: 'Linux & Bash Scripting', phase: 1 },
  { name: 'Docker Advanced (multi-stage builds, Compose, networking)', phase: 1 },
  { name: 'Kubernetes (Pods, Deployments, Services, Ingress, Minikube)', phase: 1 },
  { name: 'Git & GitHub Advanced + GitHub Actions CI/CD', phase: 1 },
  { name: 'Networking Basics (TCP/IP, DNS, Load Balancers, Nginx)', phase: 1 },
  { name: 'AWS Core (EC2, S3, VPC, IAM, RDS, EKS, ECR, CloudWatch)', phase: 2 },
  { name: 'Terraform (state management, modules, workspaces)', phase: 2 },
  { name: 'Prometheus + Grafana (PromQL, dashboards)', phase: 2 },
  { name: 'Helm Charts', phase: 2 },
  { name: 'Python for DevOps (Boto3, automation scripting)', phase: 2 },
  { name: 'ML Fundamentals Light (scikit-learn, train/test split)', phase: 3 },
  { name: 'MLflow (experiment tracking, model registry)', phase: 3 },
  { name: 'Kubeflow / ZenML (ML pipeline orchestration)', phase: 3 },
  { name: 'DVC (data + model versioning)', phase: 3 },
  { name: 'Feature Stores & Model Serving (FastAPI, BentoML, Feast)', phase: 3 },
  { name: 'Airflow / Prefect (pipeline orchestration)', phase: 3 },
  { name: 'LangChain / LangGraph (chains, agents, orchestration)', phase: 4 },
  { name: 'Vector Databases (Pinecone, Weaviate, ChromaDB, RAG)', phase: 4 },
  { name: 'vLLM / TensorRT-LLM (LLM inference at scale)', phase: 4 },
  { name: 'LangFuse / LangSmith (LLM observability, cost monitoring)', phase: 4 },
  { name: 'DevSecOps (Trivy, Falco, OPA/Gatekeeper)', phase: 4 },
  { name: 'System Design (distributed systems, microservices at scale)', phase: 4 },
];

const CERTIFICATIONS = [
  { name: 'CKA — Certified Kubernetes Administrator', target_month: 'Month 2-3', cost: 395 },
  { name: 'AWS Solutions Architect Associate', target_month: 'Month 3-4', cost: 150 },
  { name: 'HashiCorp Terraform Associate', target_month: 'Month 4', cost: 70 },
  { name: 'AWS DevOps Engineer Professional', target_month: 'Month 6-7', cost: 300 },
  { name: 'CKAD — Certified Kubernetes Application Developer', target_month: 'Month 5', cost: 395 },
  { name: 'GCP Professional ML Engineer', target_month: 'Month 9-10', cost: 200 },
];

const MILESTONES = [
  { month_num: 1, title: 'Foundation Basics', description: 'Linux solid, Docker advanced, K8s basics, CI/CD pipeline, Resume updated, 60 LC problems, Apex Bank Dockerized', target_date: '2026-06-14' },
  { month_num: 2, title: 'K8s Advanced + CKA Prep', description: 'K8s advanced, CKA prep started, Helm charts mastered, 50 LC problems, Apex Bank deployed on K8s', target_date: '2026-07-14' },
  { month_num: 3, title: 'CKA Certified + Cloud Basics', description: 'CKA CERTIFIED, AWS basics, Terraform intro, Prometheus+Grafana, first job applications, Apex Bank on AWS EKS', target_date: '2026-08-14' },
  { month_num: 4, title: 'AWS SA Certified + IaC', description: 'AWS SA Associate CERTIFIED, Full IaC project, Terraform cert, 10 applications/week, Apex Bank CI/CD + ArgoCD live', target_date: '2026-09-14' },
  { month_num: 5, title: 'CKAD + MLOps Entry', description: 'Python for DevOps, CKAD certified, MLflow, DVC, System Design started, Apex Bank fraud model v1', target_date: '2026-10-14' },
  { month_num: 6, title: 'MLOps Core + Mock Interviews', description: 'Kubeflow pipeline, FastAPI model serving, Airflow DAG, mock interviews started, Apex Bank MLflow integrated', target_date: '2026-11-14' },
  { month_num: 7, title: 'MLOps Complete + Job Hunt', description: 'MLOps capstone complete, AWS DevOps Pro prep, Evidently AI, active job hunt, Apex Bank drift monitoring', target_date: '2026-12-14' },
  { month_num: 8, title: 'AWS DevOps Pro + LLMOps Entry', description: 'AWS DevOps Pro CERTIFIED, LangChain basics, vector DB intro, system design 2x/week', target_date: '2027-01-14' },
  { month_num: 9, title: 'RAG Systems + GCP Prep', description: 'RAG chatbot on K8s, LangFuse monitoring, GCP ML cert prep, Apex Bank chatbot live', target_date: '2027-02-14' },
  { month_num: 10, title: 'GCP Certified + DevSecOps', description: 'GCP ML Engineer CERTIFIED, vLLM server, DevSecOps added, Apex Bank DevSecOps hardened', target_date: '2027-03-14' },
  { month_num: 11, title: 'Full Capstone + 500 LC', description: 'Open source contribution, full capstone documented, 500+ LC, Apex Bank fully complete + documented', target_date: '2027-04-14' },
  { month_num: 12, title: '🎯 JOB OFFER', description: 'Land 18+ LPA DevOps/MLOps/LLMOps offer — 20–50 LPA / $100K–160K US Remote', target_date: '2027-05-14' },
];

const APEX_TASKS = [
  // Layer 1 — Application
  { layer: 1, layer_name: 'Application (MERN Stack)', task_name: 'User authentication (JWT + refresh tokens)' },
  { layer: 1, layer_name: 'Application (MERN Stack)', task_name: 'Account management (create, view, update accounts)' },
  { layer: 1, layer_name: 'Application (MERN Stack)', task_name: 'Transaction system (deposit, withdraw, transfer)' },
  { layer: 1, layer_name: 'Application (MERN Stack)', task_name: 'Transaction history with filters' },
  { layer: 1, layer_name: 'Application (MERN Stack)', task_name: 'Admin dashboard' },
  { layer: 1, layer_name: 'Application (MERN Stack)', task_name: 'REST API fully documented (Swagger/Postman)' },
  { layer: 1, layer_name: 'Application (MERN Stack)', task_name: 'Unit tests written (Jest)' },
  { layer: 1, layer_name: 'Application (MERN Stack)', task_name: 'Frontend responsive UI complete' },
  // Layer 2 — DevOps
  { layer: 2, layer_name: 'DevOps & Infrastructure', task_name: 'Dockerized (multi-stage builds, docker-compose for local)' },
  { layer: 2, layer_name: 'DevOps & Infrastructure', task_name: 'Kubernetes manifests (Deployments, Services, Ingress, ConfigMaps, Secrets)' },
  { layer: 2, layer_name: 'DevOps & Infrastructure', task_name: 'Helm chart created for the full app' },
  { layer: 2, layer_name: 'DevOps & Infrastructure', task_name: 'GitHub Actions CI pipeline (lint, test, build, push image to registry)' },
  { layer: 2, layer_name: 'DevOps & Infrastructure', task_name: 'GitHub Actions CD pipeline (auto-deploy to K8s on merge to main)' },
  { layer: 2, layer_name: 'DevOps & Infrastructure', task_name: 'ArgoCD GitOps setup (sync K8s cluster from Git)' },
  { layer: 2, layer_name: 'DevOps & Infrastructure', task_name: 'Terraform IaC for cloud infra (AWS EKS + RDS + VPC)' },
  { layer: 2, layer_name: 'DevOps & Infrastructure', task_name: 'Deployed on AWS EKS via Terraform' },
  { layer: 2, layer_name: 'DevOps & Infrastructure', task_name: 'Nginx ingress + SSL/TLS configured' },
  { layer: 2, layer_name: 'DevOps & Infrastructure', task_name: 'Horizontal Pod Autoscaler configured' },
  // Layer 3 — Monitoring
  { layer: 3, layer_name: 'Monitoring & Observability', task_name: 'Prometheus scraping app metrics' },
  { layer: 3, layer_name: 'Monitoring & Observability', task_name: 'Grafana dashboard (transactions/sec, error rate, latency, pod health)' },
  { layer: 3, layer_name: 'Monitoring & Observability', task_name: 'Alerting rules configured (PagerDuty/Slack webhook)' },
  { layer: 3, layer_name: 'Monitoring & Observability', task_name: 'Centralized logging (EFK stack or Loki)' },
  { layer: 3, layer_name: 'Monitoring & Observability', task_name: 'Distributed tracing (Jaeger or OpenTelemetry)' },
  // Layer 4 — MLOps
  { layer: 4, layer_name: 'MLOps Features', task_name: 'Fraud detection ML model (scikit-learn, trained on synthetic data)' },
  { layer: 4, layer_name: 'MLOps Features', task_name: 'MLflow experiment tracking for fraud model' },
  { layer: 4, layer_name: 'MLOps Features', task_name: 'Model served via FastAPI microservice' },
  { layer: 4, layer_name: 'MLOps Features', task_name: 'DVC for dataset versioning' },
  { layer: 4, layer_name: 'MLOps Features', task_name: 'Model integrated into transaction pipeline (real-time scoring)' },
  { layer: 4, layer_name: 'MLOps Features', task_name: 'Model drift monitoring with Evidently AI' },
  { layer: 4, layer_name: 'MLOps Features', task_name: 'Kubeflow pipeline for model retraining' },
  // Layer 5 — LLMOps
  { layer: 5, layer_name: 'LLMOps Features', task_name: 'Banking assistant chatbot (LangChain + RAG)' },
  { layer: 5, layer_name: 'LLMOps Features', task_name: 'Vector DB for banking knowledge base (ChromaDB/Pinecone)' },
  { layer: 5, layer_name: 'LLMOps Features', task_name: 'LangFuse monitoring for chatbot (cost, latency, quality)' },
  { layer: 5, layer_name: 'LLMOps Features', task_name: 'Chatbot deployed as K8s microservice' },
  // Layer 6 — DevSecOps
  { layer: 6, layer_name: 'DevSecOps', task_name: 'Trivy image vulnerability scanning in CI pipeline' },
  { layer: 6, layer_name: 'DevSecOps', task_name: 'OPA/Gatekeeper policies on K8s cluster' },
  { layer: 6, layer_name: 'DevSecOps', task_name: 'Falco runtime security monitoring' },
  { layer: 6, layer_name: 'DevSecOps', task_name: 'Secrets management (HashiCorp Vault or AWS Secrets Manager)' },
];

const ASSESSMENT_PATTERNS = [
  'Arrays', 'Strings', 'LinkedList', 'Trees', 'Graphs',
  'Dynamic Programming', 'Recursion', 'Sorting', 'Binary Search', 'Heaps'
];

function seedDatabase() {
  if (!shouldSeed()) {
    console.log('[Seed] Data already exists — skipping seed.');
    return;
  }
  console.log('[Seed] First run detected — seeding database...');

  const insertProblem = db.prepare(`
    INSERT INTO dsa_problems (title, leetcode_num, url, difficulty, pattern, hints)
    VALUES (@title, @leetcode_num, @url, @difficulty, @pattern, @hints)
  `);
  const seedProblems = db.transaction(() => {
    for (const p of DSA_PROBLEMS) insertProblem.run(p);
  });
  seedProblems();

  const insertSkill = db.prepare(`INSERT INTO skills (name, phase) VALUES (@name, @phase)`);
  const seedSkills = db.transaction(() => {
    for (const s of SKILLS) insertSkill.run(s);
  });
  seedSkills();

  const insertCert = db.prepare(`INSERT INTO certifications (name, target_month, cost) VALUES (@name, @target_month, @cost)`);
  const seedCerts = db.transaction(() => {
    for (const c of CERTIFICATIONS) insertCert.run(c);
  });
  seedCerts();

  const insertMilestone = db.prepare(`INSERT INTO milestones (month_num, title, description, target_date) VALUES (@month_num, @title, @description, @target_date)`);
  const seedMilestones = db.transaction(() => {
    for (const m of MILESTONES) insertMilestone.run(m);
  });
  seedMilestones();

  const insertTask = db.prepare(`INSERT INTO apex_tasks (layer, layer_name, task_name) VALUES (@layer, @layer_name, @task_name)`);
  const seedTasks = db.transaction(() => {
    for (const t of APEX_TASKS) insertTask.run(t);
  });
  seedTasks();

  db.prepare(`INSERT OR IGNORE INTO apex_info (id, github_url, live_url) VALUES (1, '', '')`).run();

  const insertAssessment = db.prepare(`INSERT OR IGNORE INTO assessment_results (pattern, level) VALUES (@pattern, @level)`);
  const seedAssessment = db.transaction(() => {
    for (const p of ASSESSMENT_PATTERNS) insertAssessment.run({ pattern: p, level: 'Medium' });
  });
  seedAssessment();

  db.prepare(`INSERT OR IGNORE INTO assessment_done (id, done) VALUES (1, 0)`).run();

  console.log('[Seed] Database seeded successfully!');
}

seedDatabase();

// ─── Routes ───────────────────────────────────────────────────────────────────

app.use('/api/dsa', require('./routes/dsa')(db));
app.use('/api/revision', require('./routes/revision')(db));
app.use('/api/skills', require('./routes/skills')(db));
app.use('/api/goals', require('./routes/goals')(db));
app.use('/api/journal', require('./routes/journal')(db));
app.use('/api/apexbank', require('./routes/apexbank')(db));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// Export all data as JSON
app.get('/api/export/json', (req, res) => {
  const data = {
    dsa_problems: db.prepare('SELECT * FROM dsa_problems').all(),
    dsa_sessions: db.prepare('SELECT * FROM dsa_sessions').all(),
    revision_schedule: db.prepare('SELECT * FROM revision_schedule').all(),
    assessment_results: db.prepare('SELECT * FROM assessment_results').all(),
    skills: db.prepare('SELECT * FROM skills').all(),
    certifications: db.prepare('SELECT * FROM certifications').all(),
    milestones: db.prepare('SELECT * FROM milestones').all(),
    journal_entries: db.prepare('SELECT * FROM journal_entries').all(),
    apex_tasks: db.prepare('SELECT * FROM apex_tasks').all(),
    apex_logs: db.prepare('SELECT * FROM apex_logs').all(),
    apex_info: db.prepare('SELECT * FROM apex_info').get(),
    exported_at: new Date().toISOString(),
  };
  res.json(data);
});

// Import JSON backup
app.post('/api/import/json', (req, res) => {
  try {
    const data = req.body;
    if (data.dsa_sessions) {
      const ins = db.prepare(`INSERT OR IGNORE INTO dsa_sessions (problem_id, date, status, notes) VALUES (?, ?, ?, ?)`);
      db.transaction(() => { data.dsa_sessions.forEach(r => ins.run(r.problem_id, r.date, r.status, r.notes)); })();
    }
    if (data.skills) {
      const upd = db.prepare(`UPDATE skills SET status=?, confidence=?, notes=? WHERE name=?`);
      db.transaction(() => { data.skills.forEach(r => upd.run(r.status, r.confidence, r.notes, r.name)); })();
    }
    if (data.journal_entries) {
      const ins = db.prepare(`INSERT OR IGNORE INTO journal_entries (date, learned, problems_faced, wins, mood, energy, phase) VALUES (?,?,?,?,?,?,?)`);
      db.transaction(() => { data.journal_entries.forEach(r => ins.run(r.date, r.learned, r.problems_faced, r.wins, r.mood, r.energy, r.phase)); })();
    }
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[Server] Learning OS backend running on port ${PORT}`);
});
