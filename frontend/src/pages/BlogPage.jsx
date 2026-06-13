import { useEffect } from "react";
import { Link } from "react-router-dom";
import ARTICLES from "@/data/articles";

export default function BlogPage() {
  useEffect(() => {
    document.title = "ListWorks Blog — AI Marketing Tips for Real Estate Agents";
  }, []);

  return (
    <div className="min-h-screen bg-oat text-ink font-body">
      <div className="max-w-[900px] mx-auto px-6 py-20 md:py-28">
        <div className="mb-12">
          <span className="font-mono text-[11px] tracking-[0.25em] uppercase text-vermillion">/ Blog</span>
          <h1 className="font-display text-4xl md:text-6xl tracking-tight leading-[1.05] mt-4">
            <span className="font-light">Marketing tips for</span><br />
            <span className="italic">agents who want to sell faster.</span>
          </h1>
        </div>

        <div className="space-y-8">
          {ARTICLES.map((a) => (
            <Link
              key={a.slug}
              to={`/blog/${a.slug}`}
              className="block border border-ink/15 hover:border-vermillion transition p-6 md:p-8 group"
            >
              <div className="flex items-center gap-4 mb-3">
                <span className="font-mono text-[10px] tracking-[0.15em] uppercase text-ink/40">{a.date}</span>
                <span className="font-mono text-[10px] tracking-[0.15em] uppercase text-ink/30">{a.readTime} read</span>
                {a.tags.map((t) => (
                  <span key={t} className="font-mono text-[10px] tracking-[0.1em] uppercase text-vermillion bg-vermillion/5 px-2 py-0.5">
                    {t}
                  </span>
                ))}
              </div>
              <h2 className="font-display text-2xl md:text-3xl tracking-tight leading-[1.15] group-hover:text-vermillion transition">
                {a.title}
              </h2>
              <p className="font-body text-ink/70 mt-3 leading-relaxed">{a.excerpt}</p>
            </Link>
          ))}
        </div>

        <div className="mt-16 text-center border-t border-ink/15 pt-10">
          <p className="font-body text-ink/60 mb-4">Try ListWorks PRO — 3 free rewrites, no card required</p>
          <a href="/" className="btn-vermillion px-7 py-4 font-heading text-sm uppercase tracking-[0.15em] inline-block">
            Rewrite Your First Listing Free
          </a>
        </div>
      </div>
    </div>
  );
}
