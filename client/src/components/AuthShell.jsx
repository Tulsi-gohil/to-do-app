import { Link } from 'react-router-dom';

export default function AuthShell({ children, subtitle }) {
  return (
    <div className="auth-grid relative min-h-screen overflow-hidden">
      <div className="auth-noise pointer-events-none absolute inset-0 opacity-40" />

      <div className="pointer-events-none absolute -left-24 top-24 h-72 w-72 rounded-full bg-mint/10 blur-3xl animate-float" />
      <div
        className="pointer-events-none absolute -right-16 bottom-10 h-80 w-80 rounded-full bg-ember/10 blur-3xl animate-float"
        style={{ animationDelay: '1.4s' }}
      />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col px-5 py-8 md:px-8 lg:flex-row lg:items-center lg:gap-16 lg:py-12">
        <aside className="mb-10 max-w-xl animate-fade-up lg:mb-0 lg:flex-1">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.28em] text-mint">
            TaskFlow
          </p>
          <h1 className="font-display text-4xl leading-tight text-foam md:text-5xl lg:text-6xl">
            Plans that stay with you.
          </h1>
          <p className="mt-4 max-w-md text-base leading-relaxed text-mist md:text-lg">
            {subtitle ||
              'Create an account, verify by email, and keep every task in one calm workspace.'}
          </p>

          <div className="mt-8 hidden gap-3 text-sm text-mist/80 lg:flex">
            <span className="rounded-full border border-white/10 px-3 py-1">OTP email</span>
            <span className="rounded-full border border-white/10 px-3 py-1">Secure login</span>
            <span className="rounded-full border border-white/10 px-3 py-1">Smart todos</span>
          </div>
        </aside>

        <main className="animate-fade-up-delay w-full lg:max-w-md lg:flex-none">
          <div className="rounded-[28px] border border-white/10 bg-moss/55 p-6 shadow-[0_30px_80px_-40px_rgba(0,0,0,0.8)] backdrop-blur-xl md:p-8">
            {children}
          </div>
          <p className="mt-5 text-center text-sm text-mist/70">
            <Link to="/" className="hover:text-mint">
              TaskFlow
            </Link>{' '}
            · organize with intent
          </p>
        </main>
      </div>
    </div>
  );
}
