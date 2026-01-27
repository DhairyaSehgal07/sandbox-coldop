import { createFileRoute } from '@tanstack/react-router';
import { useBearStore } from '@/stores/useBearStore';

export const Route = createFileRoute('/zustand/')({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-md space-y-6">
        <h2 className="text-xl font-semibold text-gray-800 text-center">
          Hello "/zustand/"!
        </h2>

        <BearCounter />
        <Controls />
      </div>
    </div>
  );
}

// --------------------
// Components
// --------------------

function BearCounter() {
  const bears = useBearStore((state) => state.bears);

  return (
    <div className="text-center">
      <h1 className="text-3xl font-bold text-gray-900">{bears}</h1>
      <p className="text-sm text-gray-500">bears around here...</p>
    </div>
  );
}

function Controls() {
  const increasePopulation = useBearStore((state) => state.increasePopulation);
  const removeAllBears = useBearStore((state) => state.removeAllBears);

  return (
    <div className="flex gap-3">
      <button
        onClick={increasePopulation}
        className="flex-1 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition"
      >
        Add bear
      </button>

      <button
        onClick={removeAllBears}
        className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition"
      >
        Remove all
      </button>
    </div>
  );
}
