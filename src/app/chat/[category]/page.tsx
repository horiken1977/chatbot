export default function ChatPage({
  params,
}: {
  params: { category: string };
}) {
  const categoryName = params.category === "btob" ? "BtoB" : "BtoC";

  return (
    <main className="flex min-h-screen flex-col">
      <header className="border-b p-4">
        <div className="container mx-auto">
          <h1 className="text-2xl font-bold">{categoryName} マーケティング</h1>
        </div>
      </header>

      <div className="flex-1 container mx-auto p-4">
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-gray-600 dark:text-gray-400">
            チャット機能は準備中です...
          </p>
        </div>
      </div>
    </main>
  );
}
