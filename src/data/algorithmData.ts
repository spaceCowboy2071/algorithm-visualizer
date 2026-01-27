import type { ComplexityInfo, AlgorithmMode } from '../types/visualization';

// ============================================
// SORTING ALGORITHMS
// ============================================

export const BUBBLE_SORT_INFO: ComplexityInfo = {
  name: "Bubble Sort",
  timeComplexity: {
    best: "O(n)",
    average: "O(n²)",
    worst: "O(n²)"
  },
  spaceComplexity: "O(1)",
  explanations: {
    how: "Bubble Sort repeatedly steps through the array, compares adjacent elements, and swaps them if they're in the wrong order. The largest values 'bubble up' to the end with each pass. This continues until no more swaps are needed, meaning the array is sorted.",
    when: "Use Bubble Sort for small datasets (< 50 elements) or when the data is nearly sorted. It's also useful for educational purposes to understand basic sorting concepts. However, it's rarely used in production due to poor performance on large datasets.",
    where: "Bubble Sort is typically found in educational codebases, embedded systems with memory constraints, or as a subroutine in hybrid sorting algorithms. You might see it in interview questions or algorithm courses, but rarely in production applications.",
    why: "Choose Bubble Sort when: (1) the dataset is very small, (2) simplicity is more important than performance, (3) you need a stable sort with O(1) space complexity, or (4) the data is already nearly sorted, where it can achieve O(n) performance."
  },
  code: {
    javascript: `function bubbleSort(arr) {
  const n = arr.length;

  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - i - 1; j++) {
      if (arr[j] > arr[j + 1]) {
        // Swap elements
        const temp = arr[j];
        arr[j] = arr[j + 1];
        arr[j + 1] = temp;
      }
    }
  }

  return arr;
}`,
    python: `def bubble_sort(arr):
    n = len(arr)

    for i in range(n - 1):
        for j in range(n - i - 1):
            if arr[j] > arr[j + 1]:
                # Swap elements
                arr[j], arr[j + 1] = arr[j + 1], arr[j]

    return arr`
  }
};

export const QUICK_SORT_INFO: ComplexityInfo = {
  name: "Quick Sort",
  timeComplexity: {
    best: "O(n log n)",
    average: "O(n log n)",
    worst: "O(n²)"
  },
  spaceComplexity: "O(log n)",
  explanations: {
    how: "Quick Sort picks a 'pivot' element and partitions the array so all elements smaller than the pivot come before it, and all larger elements come after. It then recursively sorts the sub-arrays on either side of the pivot. This divide-and-conquer approach is very efficient.",
    when: "Use Quick Sort for general-purpose sorting of large datasets. It's one of the fastest sorting algorithms in practice, though it has poor worst-case performance. Ideal when average-case performance matters more than worst-case, and when you want in-place sorting with minimal memory overhead.",
    where: "Quick Sort is found in many standard library implementations (like C's qsort), database systems, and situations requiring fast in-place sorting. It's commonly used in production systems where performance is critical and the data isn't adversarially arranged.",
    why: "Choose Quick Sort when: (1) you need fast average-case performance, (2) memory is limited (in-place sorting), (3) you're working with large datasets, or (4) you want a practical, battle-tested algorithm. It's often faster than Merge Sort due to better cache locality."
  },
  code: {
    javascript: `function quickSort(arr, low = 0, high = arr.length - 1) {
  if (low < high) {
    const pivotIndex = partition(arr, low, high);

    quickSort(arr, low, pivotIndex - 1);
    quickSort(arr, pivotIndex + 1, high);
  }
  return arr;
}

function partition(arr, low, high) {
  const pivot = arr[high];
  let i = low - 1;

  for (let j = low; j < high; j++) {
    if (arr[j] < pivot) {
      i++;
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }
  [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]];
  return i + 1;
}`,
    python: `def quick_sort(arr, low=0, high=None):
    if high is None:
        high = len(arr) - 1

    if low < high:
        pivot_index = partition(arr, low, high)

        quick_sort(arr, low, pivot_index - 1)
        quick_sort(arr, pivot_index + 1, high)

    return arr

def partition(arr, low, high):
    pivot = arr[high]
    i = low - 1

    for j in range(low, high):
        if arr[j] < pivot:
            i += 1
            arr[i], arr[j] = arr[j], arr[i]

    arr[i + 1], arr[high] = arr[high], arr[i + 1]
    return i + 1`
  }
};

export const MERGE_SORT_INFO: ComplexityInfo = {
  name: "Merge Sort",
  timeComplexity: {
    best: "O(n log n)",
    average: "O(n log n)",
    worst: "O(n log n)"
  },
  spaceComplexity: "O(n)",
  explanations: {
    how: "Merge Sort divides the array into two halves, recursively sorts each half, then merges the sorted halves back together. The merge step combines two sorted arrays into one sorted array by repeatedly taking the smallest element from either array.",
    when: "Use Merge Sort when you need guaranteed O(n log n) performance and stability (preserving order of equal elements). Ideal for sorting linked lists, external sorting (data too large for memory), and when worst-case performance matters more than space efficiency.",
    where: "Merge Sort is used in Java's Arrays.sort() for objects, Python's sorted() and list.sort(), and many database systems for sorting large datasets. It's commonly used in external sorting algorithms and parallel sorting implementations.",
    why: "Choose Merge Sort when: (1) you need stable sorting, (2) guaranteed O(n log n) time is required, (3) working with linked lists (no random access needed), or (4) data is too large to fit in memory. Trade-off: requires O(n) extra space unlike in-place sorts."
  },
  code: {
    javascript: `function mergeSort(arr, left = 0, right = arr.length - 1) {
  if (left < right) {
    const mid = Math.floor((left + right) / 2);

    mergeSort(arr, left, mid);
    mergeSort(arr, mid + 1, right);

    merge(arr, left, mid, right);
  }
  return arr;
}

function merge(arr, left, mid, right) {
  const leftArr = arr.slice(left, mid + 1);
  const rightArr = arr.slice(mid + 1, right + 1);

  let i = 0, j = 0, k = left;

  while (i < leftArr.length && j < rightArr.length) {
    if (leftArr[i] <= rightArr[j]) {
      arr[k++] = leftArr[i++];
    } else {
      arr[k++] = rightArr[j++];
    }
  }

  while (i < leftArr.length) {
    arr[k++] = leftArr[i++];
  }

  while (j < rightArr.length) {
    arr[k++] = rightArr[j++];
  }
}`,
    python: `def merge_sort(arr, left=0, right=None):
    if right is None:
        right = len(arr) - 1

    if left < right:
        mid = (left + right) // 2

        merge_sort(arr, left, mid)
        merge_sort(arr, mid + 1, right)

        merge(arr, left, mid, right)

    return arr

def merge(arr, left, mid, right):
    left_arr = arr[left:mid + 1]
    right_arr = arr[mid + 1:right + 1]

    i = j = 0
    k = left

    while i < len(left_arr) and j < len(right_arr):
        if left_arr[i] <= right_arr[j]:
            arr[k] = left_arr[i]
            i += 1
        else:
            arr[k] = right_arr[j]
            j += 1
        k += 1

    while i < len(left_arr):
        arr[k] = left_arr[i]
        i += 1
        k += 1

    while j < len(right_arr):
        arr[k] = right_arr[j]
        j += 1
        k += 1`
  }
};

// ============================================
// SEARCHING ALGORITHMS
// ============================================

export const BINARY_SEARCH_INFO: ComplexityInfo = {
  name: "Binary Search",
  timeComplexity: {
    best: "O(1)",
    average: "O(log n)",
    worst: "O(log n)"
  },
  spaceComplexity: "O(1)",
  explanations: {
    how: "Binary Search repeatedly divides the search interval in half. It compares the target value to the middle element of the sorted array. If they're not equal, it eliminates the half where the target cannot lie and continues searching the remaining half until the target is found or the interval is empty.",
    when: "Use Binary Search when working with sorted arrays and you need fast lookups. It's ideal for large datasets where linear search would be too slow. The data must be sorted for binary search to work correctly.",
    where: "Binary Search is found everywhere: database indexing, dictionary lookups, spell checkers, version control (git bisect), finding bugs in sorted logs, and any system that needs efficient lookups in sorted data.",
    why: "Choose Binary Search when: (1) the array is sorted, (2) you need O(log n) search time instead of O(n), (3) you're searching frequently in a static dataset, or (4) the data is too large for linear search to be practical."
  },
  code: {
    javascript: `function binarySearch(arr, target) {
  let left = 0;
  let right = arr.length - 1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);

    if (arr[mid] === target) {
      return mid;
    }

    if (arr[mid] < target) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }

  return -1;
}`,
    python: `def binary_search(arr, target):
    left = 0
    right = len(arr) - 1

    while left <= right:
        mid = (left + right) // 2

        if arr[mid] == target:
            return mid

        if arr[mid] < target:
            left = mid + 1
        else:
            right = mid - 1

    return -1`
  }
};

export const LINEAR_SEARCH_INFO: ComplexityInfo = {
  name: "Linear Search",
  timeComplexity: {
    best: "O(1)",
    average: "O(n)",
    worst: "O(n)"
  },
  spaceComplexity: "O(1)",
  explanations: {
    how: "Linear Search sequentially checks each element in the array from the beginning until it finds the target or reaches the end. It compares each element one by one with the target value.",
    when: "Use Linear Search when the data is unsorted, the dataset is small, you only need to search once, or when simplicity is more important than performance. It's also useful when elements are likely to be near the beginning.",
    where: "Linear Search is used in small datasets, unsorted collections, finding the first occurrence of an element, and situations where the overhead of sorting isn't justified. Common in scripts, small utilities, and prototypes.",
    why: "Choose Linear Search when: (1) the array is unsorted and sorting isn't worth it, (2) the dataset is small (< 100 elements), (3) you're only searching once, or (4) you need to find all occurrences of a value."
  },
  code: {
    javascript: `function linearSearch(arr, target) {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] === target) {
      return i;
    }
  }

  return -1;
}`,
    python: `def linear_search(arr, target):
    for i in range(len(arr)):
        if arr[i] == target:
            return i

    return -1`
  }
};

export const JUMP_SEARCH_INFO: ComplexityInfo = {
  name: "Jump Search",
  timeComplexity: {
    best: "O(1)",
    average: "O(√n)",
    worst: "O(√n)"
  },
  spaceComplexity: "O(1)",
  explanations: {
    how: "Jump Search works on sorted arrays by jumping ahead by fixed steps (typically √n) until finding a block where the target might exist. Then it performs a linear search within that block. It combines the benefits of linear and binary search.",
    when: "Use Jump Search when binary search's random access is expensive (like linked lists) but you still want better than linear time. It's a good middle ground when you need something faster than linear search but simpler than binary search.",
    where: "Jump Search is used in systems where jumping back is costly, searching in linked lists where random access is expensive, and educational settings to demonstrate search algorithm trade-offs.",
    why: "Choose Jump Search when: (1) you have a sorted array, (2) jumping forward is cheap but random access is expensive, (3) you want O(√n) time complexity, or (4) you need a simpler alternative to binary search for certain data structures."
  },
  code: {
    javascript: `function jumpSearch(arr, target) {
  const n = arr.length;
  const step = Math.floor(Math.sqrt(n));
  let prev = 0;

  while (arr[Math.min(step, n) - 1] < target) {
    prev = step;
    step += Math.floor(Math.sqrt(n));
    if (prev >= n) return -1;
  }

  while (arr[prev] < target) {
    prev++;
    if (prev === Math.min(step, n)) return -1;
  }

  if (arr[prev] === target) return prev;
  return -1;
}`,
    python: `def jump_search(arr, target):
    n = len(arr)
    step = int(n ** 0.5)
    prev = 0

    while arr[min(step, n) - 1] < target:
        prev = step
        step += int(n ** 0.5)
        if prev >= n:
            return -1

    while arr[prev] < target:
        prev += 1
        if prev == min(step, n):
            return -1

    if arr[prev] == target:
        return prev
    return -1`
  }
};

export const INTERPOLATION_SEARCH_INFO: ComplexityInfo = {
  name: "Interpolation Search",
  timeComplexity: {
    best: "O(1)",
    average: "O(log log n)",
    worst: "O(n)"
  },
  spaceComplexity: "O(1)",
  explanations: {
    how: "Interpolation Search improves on binary search by estimating the position of the target based on its value relative to the values at the boundaries. Instead of always going to the middle, it calculates a probe position that's likely closer to the target if values are uniformly distributed.",
    when: "Use Interpolation Search when the data is sorted AND uniformly distributed. It performs exceptionally well when values are evenly spread across the range. For non-uniform distributions, it can degrade to linear time.",
    where: "Interpolation Search is used in databases with uniformly distributed keys, phone directories, dictionaries with evenly spaced entries, and any scenario where the data distribution is known to be uniform.",
    why: "Choose Interpolation Search when: (1) the array is sorted, (2) values are uniformly distributed, (3) you want potentially faster than O(log n) average case, or (4) you're working with large datasets where the distribution is predictable."
  },
  code: {
    javascript: `function interpolationSearch(arr, target) {
  let low = 0;
  let high = arr.length - 1;

  while (low <= high && target >= arr[low] && target <= arr[high]) {
    if (low === high) {
      if (arr[low] === target) return low;
      return -1;
    }

    const pos = low + Math.floor(
      ((target - arr[low]) * (high - low)) /
      (arr[high] - arr[low])
    );

    if (arr[pos] === target) return pos;
    if (arr[pos] < target) low = pos + 1;
    else high = pos - 1;
  }

  return -1;
}`,
    python: `def interpolation_search(arr, target):
    low = 0
    high = len(arr) - 1

    while low <= high and target >= arr[low] and target <= arr[high]:
        if low == high:
            if arr[low] == target:
                return low
            return -1

        pos = low + int(
            ((target - arr[low]) * (high - low)) /
            (arr[high] - arr[low])
        )

        if arr[pos] == target:
            return pos
        if arr[pos] < target:
            low = pos + 1
        else:
            high = pos - 1

    return -1`
  }
};

// ============================================
// ALGORITHM REGISTRY
// ============================================

export const SORTING_ALGORITHMS: Record<string, ComplexityInfo> = {
  'Bubble Sort': BUBBLE_SORT_INFO,
  'Quick Sort': QUICK_SORT_INFO,
  'Merge Sort': MERGE_SORT_INFO,
};

export const SEARCHING_ALGORITHMS: Record<string, ComplexityInfo> = {
  'Binary Search': BINARY_SEARCH_INFO,
  'Linear Search': LINEAR_SEARCH_INFO,
  'Jump Search': JUMP_SEARCH_INFO,
  'Interpolation Search': INTERPOLATION_SEARCH_INFO,
};

export const getAlgorithmInfo = (mode: AlgorithmMode, name: string): ComplexityInfo | null => {
  const algorithms = mode === 'sorting' ? SORTING_ALGORITHMS : SEARCHING_ALGORITHMS;
  return algorithms[name] || null;
};

export const getAlgorithmNames = (mode: AlgorithmMode): string[] => {
  const algorithms = mode === 'sorting' ? SORTING_ALGORITHMS : SEARCHING_ALGORITHMS;
  return Object.keys(algorithms);
};
