export default function OfflinePage() {
  return (
    <main className="min-h-screen p-6 flex items-center justify-center">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-semibold mb-2">You’re offline</h1>
        <p className="text-sm text-gray-600">
          This app works offline for basic navigation. Please reconnect to access live features.
        </p>
      </div>
    </main>
  );
}