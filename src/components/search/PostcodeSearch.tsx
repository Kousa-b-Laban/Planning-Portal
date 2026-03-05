'use client';

import { useState, FormEvent } from 'react';

interface PostcodeSearchProps {
  onSearch: (postcode: string) => void;
  isLoading: boolean;
}

export function PostcodeSearch({ onSearch, isLoading }: PostcodeSearchProps) {
  const [postcode, setPostcode] = useState('');

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = postcode.trim();
    if (trimmed) {
      onSearch(trimmed);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md">
      <label htmlFor="postcode" className="block text-sm font-medium text-gray-700 mb-1">
        Enter a postcode
      </label>
      <div className="flex gap-2">
        <input
          id="postcode"
          type="text"
          value={postcode}
          onChange={(e) => setPostcode(e.target.value.toUpperCase())}
          placeholder="e.g. SW1A 1AA"
          className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm placeholder-gray-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          autoComplete="postal-code"
          maxLength={10}
        />
        <button
          type="submit"
          disabled={isLoading || !postcode.trim()}
          className="rounded-lg bg-primary-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Searching...' : 'Search'}
        </button>
      </div>
    </form>
  );
}
