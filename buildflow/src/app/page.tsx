export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <main className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-gray-900 mb-6">
            Build<span className="text-blue-600">Flow</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Generate and visualize DIY projects with AI-powered instructions and materials lists.
            Create step-by-step manuals for any project idea.
          </p>
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md mx-auto">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              Project Setup Complete! 🎉
            </h2>
            <p className="text-gray-600">
              BuildFlow is ready for development. The project structure, TypeScript configuration,
              and all dependencies have been set up successfully.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
