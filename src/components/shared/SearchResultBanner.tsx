interface SearchResultBannerProps {
  result: 'found' | 'not-found';
  target: number;
  foundIndex: number | null;
}

function SearchResultBanner({ result, target, foundIndex }: SearchResultBannerProps) {
  return (
    <div
      className={`px-4 py-2 rounded-lg mb-4 text-center font-semibold ${
        result === 'found'
          ? 'bg-green-900/50 text-green-400 border border-green-500'
          : 'bg-red-900/50 text-red-400 border border-red-500'
      }`}
    >
      {result === 'found'
        ? `Target ${target} found at index ${foundIndex}!`
        : `Target ${target} not found in array`}
    </div>
  );
}

export default SearchResultBanner;
