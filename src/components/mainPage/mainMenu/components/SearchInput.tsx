const SearchInput = () => (
  <div className="flex items-center w-[20vw] max-w-md bg-white/70 rounded-full px-9 py-2 shadow-sm gap-2">
    <svg
      className="w-5 h-5 text-gray-700 mr-2"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="8" strokeWidth="5" stroke="currentColor" fill="none"/>
      <line x1="16.5" y1="16.5" x2="24" y2="24" strokeWidth="3" stroke="currentColor"/>
    </svg>
    <input
      type="text"
      placeholder="Search Soundify"
      className="bg-transparent outline-none w-full pt-1 text-gray-700 placeholder-gray-600"
    />
  </div>
);

export default SearchInput;