/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export default function PostInput() {
  return (
    <div className="bg-white border border-gray-200 rounded-sm p-4 mb-4 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-blue-50 rounded-full overflow-hidden flex-shrink-0">
          <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="User" />
        </div>
        <div className="flex-1">
          <input 
            type="text" 
            placeholder="Tulis ide kamu disini..." 
            className="w-full py-2 px-0 text-sm text-gray-500 bg-transparent border-none focus:ring-0 focus:outline-none placeholder:text-gray-400"
          />
        </div>
      </div>
    </div>
  );
}
