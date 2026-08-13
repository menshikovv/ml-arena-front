import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowRight, CalendarDays, Clock3, RotateCcw, Search, Send, X } from "lucide-react";
import BlogCover from "@/components/ml/BlogCover";
import { Reveal, Stagger, StaggerItem } from "@/components/ml/PageReveal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BLOG_CATEGORIES, BLOG_POSTS, formatBlogDate, getBlogCategory } from "@/lib/blog-data";
import { FOUNDER_TELEGRAM_URL } from "@/lib/founder-season";

const PAGE_SIZE = 6;

function normalize(value) {
  return value.toLowerCase().replaceAll("ё", "е").replace(/\s+/g, " ").trim();
}

function materialWord(count) {
  const lastTwo = count % 100;
  if (lastTwo >= 11 && lastTwo <= 14) return "материалов";
  const last = count % 10;
  if (last === 1) return "материал";
  if (last >= 2 && last <= 4) return "материала";
  return "материалов";
}

function ArticleCard({ post }) {
  const category = getBlogCategory(post.category);

  return (
    <Link to={`/blog/${post.slug}`} className="group flex h-full flex-col overflow-hidden rounded-md border border-border bg-card shadow-sm transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-1 hover:border-primary/30 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
      <BlogCover visual={post.visual} compact className="aspect-video shrink-0" />
      <div className="flex flex-1 flex-col p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="font-semibold text-primary">{category?.name}</span>
          <span className="flex items-center gap-1.5 text-muted-foreground"><Clock3 size={13} /> {post.readingTime} мин</span>
        </div>
        <h2 className="mt-4 line-clamp-3 font-heading text-xl font-extrabold leading-tight transition-colors group-hover:text-primary">{post.title}</h2>
        <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted-foreground">{post.excerpt}</p>
        <div className="mt-6 flex items-center justify-between border-t border-border pt-4 text-xs text-muted-foreground">
          <span>{formatBlogDate(post.publishedAt)}</span>
          <span className="flex items-center gap-1.5 font-semibold text-primary">Читать <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" /></span>
        </div>
      </div>
    </Link>
  );
}

export default function Blog() {
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryParam = searchParams.get("category") || "all";
  const activeCategory = BLOG_CATEGORIES.some((category) => category.slug === categoryParam) ? categoryParam : "all";
  const queryParam = searchParams.get("query") || "";
  const [search, setSearch] = useState(queryParam);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    setSearch(queryParam);
  }, [queryParam]);

  useEffect(() => {
    const canonical = document.createElement("link");
    canonical.rel = "canonical";
    canonical.href = `${window.location.origin}/blog`;
    canonical.dataset.blogCanonical = "true";
    document.head.appendChild(canonical);

    let robots = document.querySelector('meta[name="robots"]');
    const createdRobots = !robots;
    const previousRobots = robots?.getAttribute("content");
    if (!robots) {
      robots = document.createElement("meta");
      robots.name = "robots";
      document.head.appendChild(robots);
    }
    robots.setAttribute("content", queryParam ? "noindex,follow" : "index,follow");

    return () => {
      canonical.remove();
      if (createdRobots) robots.remove();
      else if (previousRobots) robots.setAttribute("content", previousRobots);
    };
  }, [queryParam]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [activeCategory, queryParam]);

  const normalizedQuery = normalize(queryParam);
  const filteredPosts = useMemo(() => BLOG_POSTS.filter((post) => {
    if (activeCategory !== "all" && post.category !== activeCategory) return false;
    if (normalizedQuery.length < 2) return true;
    const haystack = normalize([post.title, post.excerpt, ...post.tags].join(" "));
    return haystack.includes(normalizedQuery);
  }), [activeCategory, normalizedQuery]);

  const showFeatured = activeCategory === "all" && normalizedQuery.length < 2;
  const featured = BLOG_POSTS.find((post) => post.featured);
  const listPosts = showFeatured ? filteredPosts.filter((post) => !post.featured) : filteredPosts;
  const visiblePosts = listPosts.slice(0, visibleCount);

  const selectCategory = (slug) => {
    const next = new URLSearchParams(searchParams);
    if (slug === "all") next.delete("category");
    else next.set("category", slug);
    setSearchParams(next);
  };

  const updateSearch = (value) => {
    setSearch(value);
    const next = new URLSearchParams(searchParams);
    const trimmed = value.trim();
    if (trimmed.length >= 2) next.set("query", trimmed);
    else next.delete("query");
    setSearchParams(next, { replace: true });
  };

  const resetFilters = () => {
    setSearch("");
    setSearchParams({});
  };

  return (
    <div className="min-h-full bg-background text-foreground">
      <section className="border-b border-border bg-secondary/25">
        <Reveal className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:py-16 lg:grid-cols-[1fr_0.78fr] lg:items-end">
          <div>
            <h1 className="mt-5 max-w-3xl font-heading text-4xl font-extrabold leading-[1.05] sm:text-5xl lg:text-6xl">Новости ML-Арены</h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">Разборы ML-задач, подготовка к соревнованиям, новости платформы и практические материалы без лишней теории.</p>
          </div>
          <div className="relative lg:mb-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={19} />
            <Input value={search} onChange={(event) => updateSearch(event.target.value)} placeholder="Найти материал..." className="h-[52px] rounded-md bg-card pl-12 pr-12 text-base shadow-sm focus-visible:ring-2 focus-visible:ring-primary/20" aria-label="Поиск по блогу" />
            {search && <button type="button" onClick={() => updateSearch("")} className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground" title="Очистить поиск"><X size={16} /></button>}
          </div>
        </Reveal>
      </section>

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 md:py-14">
        {showFeatured && featured && (
          <Reveal>
            <Link to={`/blog/${featured.slug}`} className="group grid overflow-hidden rounded-md border border-border bg-card shadow-sm transition-[border-color,box-shadow] hover:border-primary/30 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary lg:grid-cols-[1.12fr_0.88fr]">
              <BlogCover visual={featured.visual} className="min-h-72 lg:min-h-[390px]" />
              <div className="flex flex-col justify-center p-6 sm:p-8 lg:p-10">
                <div className="flex flex-wrap items-center gap-3 text-xs">
                  <span className="rounded-sm bg-primary/10 px-2.5 py-1.5 font-semibold text-primary">Главный материал</span>
                  <span className="font-semibold text-muted-foreground">{getBlogCategory(featured.category)?.name}</span>
                </div>
                <h2 className="mt-6 font-heading text-3xl font-extrabold leading-tight transition-colors group-hover:text-primary sm:text-4xl">{featured.title}</h2>
                <p className="mt-4 text-base leading-7 text-muted-foreground">{featured.excerpt}</p>
                <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5"><CalendarDays size={14} /> {formatBlogDate(featured.publishedAt)}</span>
                  <span className="flex items-center gap-1.5"><Clock3 size={14} /> {featured.readingTime} мин</span>
                </div>
                <span className="mt-7 inline-flex items-center gap-2 font-semibold text-primary">Читать материал <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" /></span>
              </div>
            </Link>
          </Reveal>
        )}

        <section className={showFeatured ? "mt-14" : ""}>
          <Reveal className="flex flex-col gap-5 border-b border-border pb-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="font-heading text-3xl font-extrabold">{normalizedQuery ? "Результаты поиска" : activeCategory === "all" ? "Последние материалы" : getBlogCategory(activeCategory)?.name}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{filteredPosts.length} {materialWord(filteredPosts.length)}</p>
            </div>
            <div className="scrollbar-thin flex max-w-full gap-2 overflow-x-auto pb-1">
              {BLOG_CATEGORIES.map((category) => (
                <button key={category.slug} type="button" onClick={() => selectCategory(category.slug)} className={`shrink-0 rounded-md border px-4 py-2.5 text-sm font-semibold transition-colors ${activeCategory === category.slug ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-primary"}`}>{category.name}</button>
              ))}
            </div>
          </Reveal>

          {visiblePosts.length ? (
            <>
              <Stagger key={`${activeCategory}-${queryParam}`} className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {visiblePosts.map((post) => <StaggerItem key={post.slug}><ArticleCard post={post} /></StaggerItem>)}
              </Stagger>
              {visibleCount < listPosts.length && <div className="mt-10 text-center"><Button type="button" variant="outline" size="lg" onClick={() => setVisibleCount((count) => count + 3)}>Показать ещё <ArrowRight size={16} /></Button></div>}
            </>
          ) : (
            <Reveal className="mt-8 border border-border bg-card px-5 py-14 text-center shadow-sm">
              <Search className="mx-auto text-muted-foreground" size={30} />
              <h3 className="mt-5 font-heading text-2xl font-extrabold">{normalizedQuery ? "Ничего не нашли" : "В этой категории пока нет материалов"}</h3>
              <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-muted-foreground">Попробуйте изменить запрос или вернуться ко всем публикациям.</p>
              <Button type="button" variant="outline" className="mt-6" onClick={resetFilters}><RotateCcw size={15} /> Сбросить фильтры</Button>
            </Reveal>
          )}
        </section>
      </main>

      <section className="border-y border-primary/20 bg-primary text-primary-foreground">
        <Reveal className="mx-auto flex max-w-7xl flex-col justify-between gap-7 px-4 py-10 sm:px-6 md:flex-row md:items-center md:py-12">
          <div>
            <p className="font-heading text-2xl font-extrabold sm:text-3xl">Активности Founder Season — в Telegram</p>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-primary-foreground/75">Мини-задачи, быстрые разборы и анонсы первого соревнования выходят в официальном канале ML-Арены.</p>
          </div>
          <Button asChild size="lg" variant="secondary" className="shrink-0"><a href={FOUNDER_TELEGRAM_URL} target="_blank" rel="noopener noreferrer"><Send size={17} /> Открыть Telegram</a></Button>
        </Reveal>
      </section>
    </div>
  );
}
