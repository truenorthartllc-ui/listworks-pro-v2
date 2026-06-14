import { useParams, Link } from "react-router-dom";
import { useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import ARTICLES from "@/data/articles";

export default function BlogPost() {
  const { slug } = useParams();
  const article = ARTICLES.find((a) => a.slug === slug);

  useEffect(() => {
    if (article) document.title = `${article.title} — ListWorks Blog`;
  }, [article]);

  if (!article) {
    return (
      <div className="min-h-screen bg-oat flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-display text-4xl mb-4">Article not found</h1>
          <Link to="/blog" className="text-vermillion underline">Back to blog</Link>
        </div>
      </div>
    );
  }

  const paragraphs = article.content.split("\n\n").filter(Boolean).map((p) => p.trim());

  return (
    <div className="min-h-screen bg-oat text-ink font-body">
      <div className="max-w-[700px] mx-auto px-6 py-16 md:py-24">
        <Link to="/blog" className="inline-flex items-center gap-2 font-mono text-[11px] tracking-[0.15em] uppercase text-ink/50 hover:text-vermillion transition mb-10">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Blog
        </Link>

        <div className="flex items-center gap-4 mb-4">
          <span className="font-mono text-[10px] tracking-[0.15em] uppercase text-ink/40">{article.date}</span>
          <span className="font-mono text-[10px] tracking-[0.15em] uppercase text-ink/30">{article.readTime} read</span>
          {article.tags.map((t) => (
            <span key={t} className="font-mono text-[10px] tracking-[0.1em] uppercase text-vermillion bg-vermillion/5 px-2 py-0.5">
              {t}
            </span>
          ))}
        </div>

        <h1 className="font-display text-4xl md:text-5xl tracking-tight leading-[1.1] mb-8">{article.title}</h1>

        <div className="prose-custom">
          {paragraphs.map((p, i) => {
            if (p.startsWith("## ")) {
              return <h2 key={i} className="font-display text-2xl mt-10 mb-4 tracking-tight">{p.replace("## ", "")}</h2>;
            }
            if (p.startsWith("### ")) {
              return <h3 key={i} className="font-display text-xl mt-8 mb-3 tracking-tight">{p.replace("### ", "")}</h3>;
            }
            if (p.startsWith("**") && p.endsWith("**")) {
              return <p key={i} className="font-body text-lg font-semibold text-ink my-4">{p.replace(/\*\*/g, "")}</p>;
            }
            if (p.startsWith("| ")) {
              const rows = p.split("\n").filter(r => r.startsWith("|"));
              return (
                <div key={i} className="overflow-x-auto my-6">
                  <table className="w-full text-sm border-collapse">
                    {rows.map((row, ri) => (
                      ri === 1 ? null :
                      <tr key={ri} className={ri < 2 ? "border-b border-ink/20" : ""}>
                        {row.split("|").filter(Boolean).map((cell, ci) => (
                          <td key={ci} className="px-3 py-2 font-body text-ink/80">{cell.trim()}</td>
                        ))}
                      </tr>
                    ))}
                  </table>
                </div>
              );
            }
            const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
            if (linkRegex.test(p)) {
              const html = p.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-vermillion underline hover:opacity-80 transition" target="_blank" rel="noopener noreferrer">$1</a>');
              return <p key={i} className="font-body text-base leading-relaxed text-ink/80 mb-4" dangerouslySetInnerHTML={{ __html: html }} />;
            }
            return <p key={i} className="font-body text-base leading-relaxed text-ink/80 mb-4">{p}</p>;
          })}
        </div>

        <div className="mt-16 pt-10 border-t border-ink/15 text-center">
          <p className="font-body text-ink/60 mb-4">Try ListWorks PRO — rewrite your first listing free</p>
          <a href="/" className="btn-vermillion px-7 py-4 font-heading text-sm uppercase tracking-[0.15em] inline-block">
            Rewrite Your Listing in 10 Seconds
          </a>
        </div>
      </div>
    </div>
  );
}
