import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, CalendarDays, Check, Clock3, Copy, Send, Share2, UserRound } from "lucide-react";
import BlogCover from "@/components/ml/BlogCover";
import { Reveal } from "@/components/ml/PageReveal";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/AuthContext";
import { BLOG_POSTS, formatBlogDate, getBlogCategory, getBlogPost } from "@/lib/blog-data";
import { FOUNDER_TELEGRAM_URL } from "@/lib/founder-season";

function RelatedCard({ post }) {
  return (
    <Link to={`/blog/${post.slug}`} className="group grid overflow-hidden rounded-md border border-border bg-card shadow-sm transition-[transform,border-color,box-shadow] hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
      <BlogCover visual={post.visual} compact className="aspect-[16/8]" />
      <div className="p-5">
        <span className="text-xs font-semibold text-primary">{getBlogCategory(post.category)?.name}</span>
        <h3 className="mt-3 line-clamp-3 font-heading text-lg font-extrabold leading-tight group-hover:text-primary">{post.title}</h3>
        <span className="mt-5 flex items-center gap-1.5 text-xs font-semibold text-primary">Читать <ArrowRight size={13} className="transition-transform group-hover:translate-x-1" /></span>
      </div>
    </Link>
  );
}

export default function BlogPost() {
  const { slug } = useParams();
  const { isAuthenticated } = useAuth();
  const [copied, setCopied] = useState(false);
  const post = getBlogPost(slug);
  const category = post ? getBlogCategory(post.category) : null;

  const relatedPosts = useMemo(() => {
    if (!post) return [];
    return BLOG_POSTS
      .filter((item) => item.slug !== post.slug)
      .sort((a, b) => Number(b.category === post.category) - Number(a.category === post.category))
      .slice(0, 3);
  }, [post]);

  useEffect(() => {
    if (!post) return undefined;
    const canonical = document.createElement("link");
    canonical.rel = "canonical";
    canonical.href = `${window.location.origin}/blog/${post.slug}`;
    canonical.dataset.blogCanonical = "true";
    document.head.appendChild(canonical);

    const schema = document.createElement("script");
    schema.type = "application/ld+json";
    schema.dataset.blogSchema = "true";
    schema.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Article",
      headline: post.title,
      description: post.excerpt,
      datePublished: post.publishedAt,
      author: { "@type": "Organization", name: post.author },
      publisher: { "@type": "Organization", name: "ML-Арена" },
      mainEntityOfPage: canonical.href,
    });
    document.head.appendChild(schema);

    return () => {
      canonical.remove();
      schema.remove();
    };
  }, [post]);

  if (!post) return <Navigate to="/blog" replace />;

  const currentUrl = typeof window === "undefined" ? "" : window.location.href;
  const shareTelegram = `https://t.me/share/url?url=${encodeURIComponent(currentUrl)}&text=${encodeURIComponent(post.title)}`;
  const shareVk = `https://vk.com/share.php?url=${encodeURIComponent(currentUrl)}&title=${encodeURIComponent(post.title)}`;
  const careerPost = post.category === "career";
  const cta = careerPost
    ? { internal: true, to: isAuthenticated ? "/profile" : "/register", label: isAuthenticated ? "Открыть свой профиль" : "Создать профиль" }
    : { internal: false, to: FOUNDER_TELEGRAM_URL, label: "Перейти в Founder Season" };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
    } catch {
      const input = document.createElement("input");
      input.value = currentUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      input.remove();
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="min-h-full bg-background text-foreground">
      <main>
        <section className="border-b border-border bg-secondary/20">
          <Reveal className="mx-auto max-w-6xl px-4 py-10 sm:px-6 md:py-14">
            <nav className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground" aria-label="Хлебные крошки">
              <Link to="/blog" className="hover:text-primary">Блог</Link><span>/</span>
              <Link to={`/blog?category=${post.category}`} className="hover:text-primary">{category?.name}</Link><span>/</span>
              <span className="max-w-md truncate text-foreground">{post.title}</span>
            </nav>
            <div className="mt-8 max-w-4xl">
              <span className="inline-flex rounded-sm bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">{category?.name}</span>
              <h1 className="mt-5 font-heading text-4xl font-extrabold leading-[1.05] sm:text-5xl lg:text-6xl">{post.title}</h1>
              <p className="mt-6 max-w-3xl text-lg leading-8 text-muted-foreground">{post.excerpt}</p>
              <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-2"><CalendarDays size={16} /> {formatBlogDate(post.publishedAt)}</span>
                <span className="flex items-center gap-2"><Clock3 size={16} /> {post.readingTime} мин</span>
                <span className="flex items-center gap-2"><UserRound size={16} /> {post.author}</span>
              </div>
            </div>
          </Reveal>
        </section>

        <Reveal className="mx-auto max-w-6xl px-4 pt-8 sm:px-6 md:pt-12">
          <BlogCover visual={post.visual} className="aspect-video max-h-[620px] min-h-72 w-full" />
        </Reveal>

        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[minmax(0,760px)_230px] lg:items-start lg:justify-between lg:py-16">
          <article className="min-w-0">
            <div className="space-y-12">
              {post.sections.map((section, sectionIndex) => (
                <Reveal key={section.id} delay={Math.min(sectionIndex * 0.03, 0.12)}>
                  <section id={section.id} className="scroll-mt-24">
                    <h2 className="font-heading text-3xl font-extrabold leading-tight">{section.title}</h2>
                    <div className="mt-5 space-y-4 text-base leading-8 text-muted-foreground">
                      {section.paragraphs?.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                    </div>
                    {section.bullets && (
                      <ul className="mt-5 space-y-3">
                        {section.bullets.map((item) => <li key={item} className="grid grid-cols-[18px_1fr] gap-3 text-base leading-7 text-muted-foreground"><Check className="mt-1 text-primary" size={17} /><span>{item}</span></li>)}
                      </ul>
                    )}
                    {section.code && <pre className="scrollbar-thin mt-6 overflow-x-auto border border-border bg-[#08111f] p-5 text-sm leading-7 text-slate-200"><code>{section.code}</code></pre>}
                  </section>
                </Reveal>
              ))}
            </div>

            <Reveal className="mt-14 border-y border-border py-8">
              <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
                <div>
                  <h2 className="font-heading text-2xl font-extrabold">Продолжить практику</h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">Следующий шаг — применить идею в задаче и сохранить результат.</p>
                </div>
                {cta.internal ? (
                  <Button asChild size="lg"><Link to={cta.to}>{cta.label} <ArrowRight size={16} /></Link></Button>
                ) : (
                  <Button asChild size="lg"><a href={cta.to} target="_blank" rel="noopener noreferrer"><Send size={16} /> {cta.label}</a></Button>
                )}
              </div>
            </Reveal>

            <Reveal className="mt-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag) => <Link key={tag} to={`/blog?query=${encodeURIComponent(tag)}`} className="rounded-sm border border-border bg-card px-3 py-2 text-xs font-semibold text-muted-foreground hover:border-primary/30 hover:text-primary">#{tag}</Link>)}
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={copyLink} className="flex h-10 items-center gap-2 rounded-md border border-border bg-card px-3 text-xs font-semibold hover:border-primary/30 hover:text-primary" title="Копировать ссылку">{copied ? <Check size={15} /> : <Copy size={15} />} {copied ? "Скопировано" : "Ссылка"}</button>
                <a href={shareTelegram} target="_blank" rel="noopener noreferrer" className="flex h-10 w-10 items-center justify-center rounded-md border border-border bg-card hover:border-primary/30 hover:text-primary" title="Поделиться в Telegram"><Send size={16} /></a>
                <a href={shareVk} target="_blank" rel="noopener noreferrer" className="flex h-10 w-10 items-center justify-center rounded-md border border-border bg-card text-xs font-extrabold hover:border-primary/30 hover:text-primary" title="Поделиться во ВКонтакте">VK</a>
              </div>
            </Reveal>
          </article>

          <aside className="hidden lg:block">
            <div className="sticky top-6 border-l border-border pl-6">
              <div className="flex items-center gap-2 text-sm font-extrabold"><Share2 className="text-primary" size={16} /> В этой статье</div>
              <nav className="mt-5 space-y-1">
                {post.sections.map((section) => <a key={section.id} href={`#${section.id}`} className="block border-l-2 border-transparent py-2 pl-3 text-sm leading-5 text-muted-foreground transition-colors hover:border-primary hover:text-primary">{section.title}</a>)}
              </nav>
              <Button asChild variant="ghost" className="mt-6 -ml-3"><Link to="/blog"><ArrowLeft size={15} /> Все материалы</Link></Button>
            </div>
          </aside>
        </div>

        <section className="border-t border-border bg-secondary/20">
          <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 md:py-16">
            <Reveal className="flex items-end justify-between gap-5">
              <div><h2 className="font-heading text-3xl font-extrabold">Читайте дальше</h2><p className="mt-2 text-sm text-muted-foreground">Еще несколько материалов по теме и практике ML.</p></div>
              <Button asChild variant="ghost" className="hidden sm:inline-flex"><Link to="/blog">Все материалы <ArrowRight size={15} /></Link></Button>
            </Reveal>
            <div className="mt-8 grid gap-5 md:grid-cols-3">{relatedPosts.map((item) => <RelatedCard key={item.slug} post={item} />)}</div>
          </div>
        </section>
      </main>
    </div>
  );
}
