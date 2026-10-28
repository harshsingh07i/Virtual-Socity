import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#070a12] p-4 text-white">
      <div className="rounded-2xl border border-[#23354d] bg-[#0c1322] p-8 text-center shadow-2xl">
        <h2 className="text-2xl font-bold text-white">404 - District Not Found</h2>
        <p className="mt-2 text-xs text-slate-400">
          The requested miniature sector does not exist in Nexus City.
        </p>
        <Link
          href="/"
          className="mt-5 inline-block rounded-xl bg-[#76f2c0] px-5 py-2.5 text-xs font-bold text-black hover:bg-[#9af6d0] transition-colors"
        >
          Return to City Center
        </Link>
      </div>
    </div>
  );
}
