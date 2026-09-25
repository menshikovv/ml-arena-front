import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowRight, Clock3, RotateCcw, Search, Send, X } from "lucide-react";
import BlogCover, { blogCoverVisual } from "@/components/ml/BlogCover";
import { Reveal, Stagger, StaggerItem } from "@/components/ml/PageReveal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/api/mlArenaApi";
import { formatBlogDate } from "@/lib/blog-data";
import { useAuth } from "@/lib/AuthContext";
import "./Blog.css";

const PAGE_SIZE = 6;

function adaptPost(post) {
  const category = post.category || post.primary_category || null;
  return {
    ...post,
    categorySlug: category?.slug || post.category_slug || null,
    categoryName: category?.name || post.category_name || null,
    tags: (post.tags || []).map((tag) => typeof tag === "string" ? tag : tag.name || tag.slug).filter(Boolean),
    publishedAt: post.published_at || post.publishedAt,
    readingTime: post.reading_time_minutes ?? post.reading_time ?? post.readingTime ?? null,
    featured: post.is_featured ?? post.featured ?? false,
    visual: blogCoverVisual(post),
  };
}

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
  return (
    <Link to={`/blog/${post.slug}`} className="blog-card group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
      <BlogCover visual={post.visual} compact className="blog-card__cover" />
      <div className="blog-card__body">
        <h3 className="blog-card__title">{post.title}</h3>
        <div className="blog-card__meta">
          {post.categoryName && <span className="blog-card__category">{post.categoryName}</span>}
          {post.readingTime != null && <span className="blog-card__reading"><Clock3 size={14} /> {post.readingTime} мин</span>}
        </div>
        <p className="blog-card__excerpt">{post.excerpt}</p>
        <div className="blog-card__footer">
          <span>{formatBlogDate(post.publishedAt)}</span>
          <span className="blog-card__read">Читать <ArrowRight size={16} aria-hidden="true" /></span>
        </div>
      </div>
    </Link>
  );
}

function BlogLoading() {
  return (
    <div role="status" aria-live="polite" aria-label="Загружаем статьи">
      <div className="blog-results__heading blog-results__heading--loading border-b border-border pb-6">
        <div className="h-8 w-56 rounded-sm bg-secondary" />
        <div className="mt-3 h-4 w-20 rounded-sm bg-secondary/80" />
      </div>
      <div className="blog-card-grid">
        {[0, 1, 2].map((item) => <div key={item} className="blog-card blog-card--loading"><div className="blog-card__cover bg-secondary/55" /><div className="space-y-4 p-5"><div className="h-6 w-4/5 rounded-sm bg-secondary" /><div className="h-4 w-24 rounded-sm bg-secondary/80" /><div className="h-4 w-full rounded-sm bg-secondary/80" /></div></div>)}
      </div>
    </div>
  );
}

export default function Blog() {
  const { appPublicSettings } = useAuth();
  const telegramUrl = appPublicSettings?.telegram_url;
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryParam = searchParams.get("category") || "all";
  const activeCategory = categoryParam;
  const queryParam = searchParams.get("query") || "";
  const [search, setSearch] = useState(queryParam);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const postsQuery = useQuery({
    queryKey: ["blog-posts", activeCategory, queryParam],
    queryFn: () => api.blog.posts({ category: activeCategory === "all" ? undefined : activeCategory, q: queryParam.trim().length >= 2 ? queryParam.trim() : undefined, limit: 50, offset: 0 }),
    staleTime: 300000,
  });
  const categoriesQuery = useQuery({ queryKey: ["blog-categories"], queryFn: api.blog.categories, staleTime: 300000 });
  const responsePosts = postsQuery.data?.data || postsQuery.data?.items || [];
  const serverPosts = responsePosts.map(adaptPost);
  const posts = serverPosts;
  const serverCategories = Array.isArray(categoriesQuery.data) ? categoriesQuery.data.map((item) => ({ slug: item.slug, name: item.name })) : [];
  const categories = [{ slug: "all", name: "Все" }, ...serverCategories];

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
  const filteredPosts = useMemo(() => posts
    .filter((post) => {
      if (activeCategory !== "all" && post.categorySlug !== activeCategory) return false;
      if (normalizedQuery.length < 2) return true;
      const haystack = normalize([post.title, post.excerpt, ...post.tags].join(" "));
      return haystack.includes(normalizedQuery);
    })
    .sort((first, second) => String(second.publishedAt).localeCompare(String(first.publishedAt))), [activeCategory, normalizedQuery, posts]);

  const visiblePosts = filteredPosts.slice(0, visibleCount);

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

  const submitSearch = (event) => {
    event.preventDefault();
    updateSearch(search);
    window.setTimeout(() => {
      const results = document.getElementById("blog-results");
      if (!results) return;
      const scroller = results.closest(".arena-app-main");
      if (scroller) {
        const top = results.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop - 24;
        scroller.scrollTo({ top, behavior: "smooth" });
        return;
      }
      results.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };

  return (
    <div className="blog-page">
      <section className="blog-hero">
        <Reveal className="blog-hero__inner">
          <div className="blog-hero__copy">
            <h1>Новости<br />ML-Арены</h1>
            <p>Разборы ML-задач, подготовка к соревнованиям, новости платформы и практические материалы без лишней теории.</p>
          </div>
          <form onSubmit={submitSearch} className="blog-hero__search">
            <Search className="blog-hero__search-icon" size={20} aria-hidden="true" />
            <Input value={search} onChange={(event) => updateSearch(event.target.value)} placeholder="Найти материал..." className="blog-hero__search-input" aria-label="Поиск по блогу" />
            {search && <button type="button" onClick={() => updateSearch("")} className="blog-hero__clear" aria-label="Очистить поиск" title="Очистить поиск"><X size={16} /></button>}
            <Button type="submit" size="icon" className="blog-hero__search-button" aria-label="Показать результаты поиска" title="Показать результаты поиска"><Search size={19} /></Button>
          </form>
        </Reveal>
      </section>

      <main className="blog-main">
        {postsQuery.isPending ? <BlogLoading /> : postsQuery.isError ? (
          <div className="border border-destructive/25 bg-destructive/5 px-5 py-14 text-center">
            <h2 className="font-heading text-2xl font-extrabold">Не удалось загрузить статьи</h2>
            <p className="mt-3 text-sm text-muted-foreground">{postsQuery.error?.message || "Повторите попытку немного позже."}</p>
            <Button type="button" variant="outline" className="mt-6" onClick={() => postsQuery.refetch()}><RotateCcw size={15} /> Повторить</Button>
          </div>
        ) : <>
        <section id="blog-results" className="blog-results scroll-mt-24">
          <Reveal className="blog-results__heading">
            <div>
              <h2>{normalizedQuery ? "Результаты поиска" : activeCategory === "all" ? "Последние материалы" : categories.find((item) => item.slug === activeCategory)?.name || "Материалы"}</h2>
              <p>{filteredPosts.length} {materialWord(filteredPosts.length)}</p>
            </div>
            <div className="blog-categories scrollbar-thin" role="group" aria-label="Категории материалов">
              {categories.map((category) => (
                <button key={category.slug} type="button" onClick={() => selectCategory(category.slug)} className={`blog-categories__button ${activeCategory === category.slug ? "blog-categories__button--active" : ""}`} aria-pressed={activeCategory === category.slug}>{category.name}</button>
              ))}
            </div>
          </Reveal>

          {visiblePosts.length ? (
            <>
              <Stagger key={`${activeCategory}-${queryParam}`} className="blog-card-grid" viewportReveal>
                {visiblePosts.map((post) => <StaggerItem key={post.slug} className="blog-card-grid__item"><ArticleCard post={post} /></StaggerItem>)}
              </Stagger>
              {visibleCount < filteredPosts.length && <div className="blog-results__more"><Button type="button" variant="outline" size="lg" onClick={() => setVisibleCount((count) => count + 3)}>Показать ещё <ArrowRight size={16} /></Button></div>}
            </>
          ) : (
            <Reveal className="blog-results__empty">
              <Search className="mx-auto text-muted-foreground" size={30} />
              <h3 className="mt-5 font-heading text-2xl font-extrabold">{normalizedQuery ? "Ничего не нашли" : "В этой категории пока нет материалов"}</h3>
              <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-muted-foreground">Попробуйте изменить запрос или вернуться ко всем публикациям.</p>
              <Button type="button" variant="outline" className="mt-6" onClick={resetFilters}><RotateCcw size={15} /> Сбросить фильтры</Button>
            </Reveal>
          )}
        </section>
        </>}
      </main>

      <section className="blog-telegram">
        <Reveal className="blog-telegram__inner">
          <div>
            <p className="font-heading text-2xl font-extrabold sm:text-3xl">Активности Founder Season — в Telegram</p>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Мини-задачи, быстрые разборы и анонсы первого соревнования выходят в официальном канале ML-Арены.</p>
          </div>
          {telegramUrl && <Button asChild size="lg" variant="outline" className="shrink-0"><a href={telegramUrl} target="_blank" rel="noopener noreferrer"><Send size={17} /> Открыть Telegram</a></Button>}
        </Reveal>
      </section>
    </div>
  );
}
