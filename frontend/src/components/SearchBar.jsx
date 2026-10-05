import { Search, X } from "lucide-react";

/*
  SearchBar - a single reusable search input used across Categories,
  Products, Stock, and All Members. Filtering itself happens locally in
  each page (useMemo over the already-fetched list) rather than hitting
  the backend on every keystroke - these lists are small enough (a
  store's own catalog/staff, not millions of rows) that a network round
  trip per keystroke would only add lag for no real benefit.
*/
const SearchBar = ({ value, onChange, placeholder = "Search..." }) => {
    return (
        <div className="relative w-full sm:w-72">
            <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full rounded-lg border border-slate-200 pl-9 pr-8 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition"
            />
            {value && (
                <button
                    type="button"
                    onClick={() => onChange("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500"
                >
                    <X size={14} />
                </button>
            )}
        </div>
    );
};

export default SearchBar;