import Link from "next/link";

export default function Home() {
  return (
    <div className="space-y-8">
      <div className="text-center py-12">
        <div className="text-6xl mb-4 font-bold">寺</div>
        <h1 className="text-4xl font-bold text-stone-800 mb-2">テラコード</h1>
        <p className="text-stone-500 text-lg">寺院管理システム</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
        <Link
          href="/householder"
          className="block bg-white rounded-xl shadow-sm border border-stone-200 p-8 hover:shadow-md hover:border-stone-300 transition-all group"
        >
          <div className="text-4xl mb-4" suppressHydrationWarning>
            👨‍👩‍👧‍👦
          </div>
          <h2 className="text-xl font-bold text-stone-800 mb-2 group-hover:text-stone-600">
            戸主台帳
          </h2>
          <p className="text-stone-500 text-sm">
            戸主・世帯員の情報を登録・管理します
          </p>
        </Link>

        <Link
          href="/ceremonies"
          className="block bg-white rounded-xl shadow-sm border border-stone-200 p-8 hover:shadow-md hover:border-stone-300 transition-all group"
        >
          <div className="text-4xl mb-4" suppressHydrationWarning>
            🪷
          </div>
          <h2 className="text-xl font-bold text-stone-800 mb-2 group-hover:text-stone-600">
            法要・行事
          </h2>
          <p className="text-stone-500 text-sm">
            法要・行事のスケジュールと参加者を管理します
          </p>
        </Link>

        <Link
          href="/genzaicho"
          className="block bg-white rounded-xl shadow-sm border border-stone-200 p-8 hover:shadow-md hover:border-stone-300 transition-all group"
        >
          <div className="text-4xl mb-4" suppressHydrationWarning>
            📋
          </div>
          <h2 className="text-xl font-bold text-stone-800 mb-2 group-hover:text-stone-600">
            現在帳
          </h2>
          <p className="text-stone-500 text-sm">
            在籍中の世帯員一覧を管理します
          </p>
        </Link>

        <Link
          href="/kakocho"
          className="block bg-white rounded-xl shadow-sm border border-stone-200 p-8 hover:shadow-md hover:border-stone-300 transition-all group"
        >
          <div className="text-4xl mb-4" suppressHydrationWarning>
            📖
          </div>
          <h2 className="text-xl font-bold text-stone-800 mb-2 group-hover:text-stone-600">
            過去帳
          </h2>
          <p className="text-stone-500 text-sm">
            故人の法名・命日を記録します
          </p>
        </Link>
      </div>
    </div>
  );
}
