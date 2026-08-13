import { useEffect } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

const getHashId = (hash) => {
  const rawId = hash.slice(1);

  try {
    return decodeURIComponent(rawId);
  } catch {
    return rawId;
  }
};

export default function ScrollToTop() {
  const { pathname, hash } = useLocation();
  const navigationType = useNavigationType();

  useEffect(() => {
    if (navigationType === "POP" && !hash) return;

    const appScroller = document.querySelector(".arena-app-main");

    const scrollElementIntoView = (element) => {
      if (!element) return;
      if (appScroller && appScroller.contains(element)) {
        const top = element.getBoundingClientRect().top - appScroller.getBoundingClientRect().top + appScroller.scrollTop;
        appScroller.scrollTo({ top, left: 0, behavior: "smooth" });
        return;
      }
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    if (hash) {
      const id = getHashId(hash);
      const timer = window.setTimeout(() => {
        scrollElementIntoView(document.getElementById(id));
      }, 50);
      return () => window.clearTimeout(timer);
    }

    appScroller?.scrollTo({ top: 0, left: 0, behavior: "instant" });
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname, hash, navigationType]);

  return null;
}
