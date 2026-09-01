import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowRight, CalendarDays, Check, Clock3, Copy, Pencil, Send, Trash2, UserRound } from "lucide-react";
import BlogCover, { blogCoverVisual } from "@/components/ml/BlogCover";
import { Reveal } from "@/components/ml/PageReveal";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/api/mlArenaApi";
import { API_URL } from "@/api/client";
import { useAuth } from "@/lib/AuthContext";
import { formatBlogDate, getBlogCategory } from "@/lib/blog-data";

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

function enhanceArticleHtml(source) {
  if (!source || typeof DOMParser === "undefined") return source;
  const documentNode = new DOMParser().parseFromString(`<div id="article-root">${source}</div>`, "text/html");
  const root = documentNode.getElementById("article-root");
  if (!root) return source;

  root.querySelectorAll("p").forEach((paragraph) => {
    if (!/^>\s?/.test(paragraph.textContent.trimStart())) return;
    const quote = documentNode.createElement("blockquote");
    const content = documentNode.createElement("p");
    content.textContent = paragraph.textContent.trimStart().replace(/^>\s?/, "");
    quote.appendChild(content);
    paragraph.replaceWith(quote);
  });

  const walker = documentNode.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const textNodes = [];
  while (walker.nextNode()) textNodes.push(walker.currentNode);
  const tokenPattern = /(\|\|[^|\n]+\|\||~~[^~\n]+~~|(?<!\*)\*[^*\n]+\*(?!\*))/g;
  textNodes.forEach((textNode) => {
    if (textNode.parentElement?.closest("code, pre, .blog-spoiler")) return;
    const text = textNode.nodeValue || "";
    const matches = [...text.matchAll(tokenPattern)];
    if (!matches.length) return;
    const fragment = documentNode.createDocumentFragment();
    let cursor = 0;
    matches.forEach((match) => {
      fragment.append(text.slice(cursor, match.index));
      const token = match[0];
      let element;
      if (token.startsWith("||")) {
        element = documentNode.createElement("span");
        element.className = "blog-spoiler";
        element.tabIndex = 0;
        element.setAttribute("role", "button");
        element.setAttribute("aria-expanded", "false");
        element.textContent = token.slice(2, -2);
      } else if (token.startsWith("~~")) {
        element = documentNode.createElement("del");
        element.textContent = token.slice(2, -2);
      } else {
        element = documentNode.createElement("em");
        element.textContent = token.slice(1, -1);
      }
      fragment.appendChild(element);
      cursor = match.index + token.length;
    });
    fragment.append(text.slice(cursor));
    textNode.replaceWith(fragment);
  });

  return root.innerHTML;
}

export default function BlogPost() {
  const { slug } = useParams();
  const { isAuthenticated, user } = useAuth();
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);
  const [comment, setComment] = useState("");
  const postQuery = useQuery({ queryKey: ["blog-post", slug], queryFn: () => api.blog.post(slug), retry: false });
  const serverPost = postQuery.data;
  const post = serverPost ? {
    ...serverPost,
    category: serverPost.category?.slug || serverPost.primary_category?.slug || serverPost.category_slug || "news",
    tags: (serverPost.tags || []).map((tag) => typeof tag === "string" ? tag : tag.name || tag.slug).filter(Boolean),
    publishedAt: serverPost.published_at || serverPost.publishedAt,
    readingTime: serverPost.reading_time_minutes || serverPost.reading_time || serverPost.readingTime || 5,
    author: serverPost.author?.display_name || serverPost.author?.name || serverPost.author || "ML-Арена",
    visual: blogCoverVisual(serverPost),
    sections: [],
  } : null;
  const category = post ? getBlogCategory(post.category) : null;
  const commentsQuery = useQuery({ queryKey: ["blog-comments", serverPost?.id], queryFn: () => api.blog.comments(serverPost.id), enabled: Boolean(serverPost?.id) });
  const comments = Array.isArray(commentsQuery.data) ? commentsQuery.data : commentsQuery.data?.items || [];
  const createComment = useMutation({
    mutationFn: () => api.blog.createComment(serverPost.id, comment.trim()),
    onSuccess: () => { setComment(""); queryClient.invalidateQueries({ queryKey: ["blog-comments", serverPost.id] }); },
  });
  const updateComment = useMutation({
    mutationFn: ({ id, body }) => api.blog.updateComment(id, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["blog-comments", serverPost.id] }),
  });
  const deleteComment = useMutation({
    mutationFn: (id) => api.blog.deleteComment(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["blog-comments", serverPost.id] }),
  });
  const canManageComment = (item) => Boolean(user?.id && (item.author_id === user.id || item.user_id === user.id || item.author?.id === user.id));

  const relatedQuery = useQuery({
    queryKey: ["blog-related", serverPost?.id],
    queryFn: () => api.blog.posts({ limit: 10, offset: 0 }),
    enabled: Boolean(serverPost?.id),
    staleTime: 30000,
  });
  const relatedPosts = useMemo(() => {
    if (!post) return [];
    const response = relatedQuery.data;
    const items = response?.data || response?.items || [];
    return items
      .filter((item) => item?.slug && item.slug !== post.slug)
      .map((item) => ({
        ...item,
        category: item.category?.slug || item.primary_category?.slug || item.category_slug || "news",
        visual: blogCoverVisual(item),
      }))
      .sort((a, b) => Number(b.category === post.category) - Number(a.category === post.category))
      .slice(0, 3);
  }, [post, relatedQuery.data]);

  useEffect(() => {
    if (!post) return undefined;
    const previousTitle = document.title;
    const descriptionMeta = document.querySelector('meta[name="description"]');
    const previousDescription = descriptionMeta?.getAttribute("content");
    document.title = `${post.title} — ML-Арена`;
    descriptionMeta?.setAttribute("content", post.excerpt || "Материал блога ML-Арены");
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
      document.title = previousTitle;
      if (previousDescription) descriptionMeta?.setAttribute("content", previousDescription);
      canonical.remove();
      schema.remove();
    };
  }, [post]);

  useEffect(() => {
    if (!serverPost?.id) return;
    api.blog.trackEvent(serverPost.id, "view").catch(() => undefined);
  }, [serverPost?.id]);

  if (!post && postQuery.isLoading) return <div className="flex min-h-[60vh] items-center justify-center text-sm text-muted-foreground">Загружаем материал…</div>;
  if (!post) return <Navigate to="/blog" replace />;

  const currentUrl = typeof window === "undefined" ? "" : window.location.href;
  const shareTelegram = `https://t.me/share/url?url=${encodeURIComponent(currentUrl)}&text=${encodeURIComponent(post.title)}`;
  const shareVk = `https://vk.com/share.php?url=${encodeURIComponent(currentUrl)}&title=${encodeURIComponent(post.title)}`;
  const guestCta = post.cta || { title: "Продолжить знакомство с ML-Ареной", text: "Войдите в аккаунт и сохраните результаты своей практики.", label: "Войти", to: "/login", authTo: "/profile" };
  const cta = isAuthenticated ? {
    title: "Продолжите практику на ML-Арене",
    text: "Откройте профиль, участвуйте в активностях и сохраняйте подтверждённые результаты.",
    label: "Открыть профиль",
    to: guestCta.authTo || "/profile",
  } : guestCta;
  const ctaTarget = cta.to;
  const articleHtml = enhanceArticleHtml(serverPost?.body_html?.replaceAll('src="/api/', `src="${API_URL}/api/`));

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

  const toggleSpoiler = (event) => {
    const spoiler = event.target.closest?.(".blog-spoiler");
    if (!spoiler) return;
    if (event.type === "keydown" && !["Enter", " "].includes(event.key)) return;
    event.preventDefault();
    const revealed = spoiler.classList.toggle("is-revealed");
    spoiler.setAttribute("aria-expanded", String(revealed));
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

        <Reveal className="mx-auto max-w-[1040px] px-4 pt-8 sm:px-6 md:pt-12">
          <BlogCover visual={post.visual} className="aspect-video max-h-[540px] min-h-64 w-full" />
        </Reveal>

        <div className="mx-auto max-w-[900px] px-4 py-12 sm:px-6 lg:py-16">
          <article className="min-w-0">
            {articleHtml ? <div className="blog-article" onClick={toggleSpoiler} onKeyDown={toggleSpoiler} dangerouslySetInnerHTML={{ __html: articleHtml }} /> : <div className="space-y-12">
              {post.sections.map((section, sectionIndex) => (
                <Reveal key={section.id} delay={Math.min(sectionIndex * 0.03, 0.12)}>
                  <section id={section.id} className="scroll-mt-24">
                    <h2 className="font-heading text-3xl font-extrabold leading-tight">{section.title}</h2>
                    <div className="mt-5 space-y-5 text-lg leading-9 text-muted-foreground">
                      {section.paragraphs?.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                    </div>
                    {section.bullets && (
                      <ul className="mt-5 space-y-3">
                        {section.bullets.map((item) => <li key={item} className="grid grid-cols-[18px_1fr] gap-3 text-lg leading-8 text-muted-foreground"><Check className="mt-1 text-primary" size={17} /><span>{item}</span></li>)}
                      </ul>
                    )}
                    {section.code && <pre className="scrollbar-thin mt-6 overflow-x-auto border border-border bg-[#08111f] p-5 text-sm leading-7 text-slate-200"><code>{section.code}</code></pre>}
                  </section>
                </Reveal>
              ))}
            </div>}

            <Reveal className="mt-14 border-y border-border py-8">
              <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
                <div>
                  <h2 className="font-heading text-2xl font-extrabold">{cta.title}</h2>
                  <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">{cta.text}</p>
                </div>
                <Button asChild size="lg"><Link to={ctaTarget} onClick={() => serverPost?.id && api.blog.trackEvent(serverPost.id, "cta_click").catch(() => undefined)}>{cta.label} <ArrowRight size={16} /></Link></Button>
              </div>
            </Reveal>

            {serverPost?.id && <Reveal className="mt-12 border-t border-border pt-8"><h2 className="font-heading text-2xl font-extrabold">Комментарии</h2>{isAuthenticated ? <form className="mt-5" onSubmit={(event) => { event.preventDefault(); if (comment.trim()) createComment.mutate(); }}><Textarea value={comment} onChange={(event) => setComment(event.target.value)} maxLength={2000} rows={4} placeholder="Напишите комментарий" /><div className="mt-3 flex justify-end"><Button type="submit" disabled={!comment.trim() || createComment.isPending}>Отправить</Button></div>{createComment.error && <p className="mt-2 text-sm text-destructive">{createComment.error.message}</p>}</form> : <p className="mt-4 text-sm text-muted-foreground">Войдите, чтобы оставить комментарий.</p>}<div className="mt-6 divide-y divide-border border-y border-border">{comments.map((item) => <article key={item.id} className="py-5"><div className="flex items-center justify-between gap-3"><p className="text-sm font-bold">{item.author?.nickname || item.author_name || "Участник"}</p><div className="flex items-center gap-2"><time className="text-xs text-muted-foreground">{item.created_at ? new Date(item.created_at).toLocaleDateString("ru-RU") : ""}</time>{canManageComment(item) && <><button type="button" className="text-muted-foreground hover:text-primary" aria-label="Редактировать комментарий" onClick={() => { const body = window.prompt("Изменить комментарий", item.body); if (body?.trim() && body.trim() !== item.body) updateComment.mutate({ id: item.id, body: body.trim() }); }}><Pencil size={14} /></button><button type="button" className="text-muted-foreground hover:text-destructive" aria-label="Удалить комментарий" onClick={() => { if (window.confirm("Удалить комментарий?")) deleteComment.mutate(item.id); }}><Trash2 size={14} /></button></>}</div></div><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{item.body}</p></article>)}{!commentsQuery.isLoading && !comments.length && <p className="py-6 text-sm text-muted-foreground">Комментариев пока нет.</p>}</div></Reveal>}

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

        </div>

        {relatedPosts.length > 0 && <section className="border-t border-border bg-secondary/20">
          <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 md:py-16">
            <Reveal className="flex items-end justify-between gap-5">
              <div><h2 className="font-heading text-3xl font-extrabold">Читайте дальше</h2><p className="mt-2 text-sm text-muted-foreground">Еще несколько материалов по теме и практике ML.</p></div>
              <Button asChild variant="ghost" className="hidden sm:inline-flex"><Link to="/blog">Все материалы <ArrowRight size={15} /></Link></Button>
            </Reveal>
            <div className="mt-8 grid gap-5 md:grid-cols-3">{relatedPosts.map((item) => <RelatedCard key={item.slug} post={item} />)}</div>
          </div>
        </section>}
      </main>
    </div>
  );
}
