function updateToc() {
  const headers = document.querySelectorAll("h1[id], h2[id], h3[id], h4[id], h5[id], h6[id]")
  const tocEntries = document.querySelectorAll("ul.toc-content > li > a")

  const viewportTop = 0
  const viewportBottom = window.innerHeight

  tocEntries.forEach((entry) => {
    const slug = entry.getAttribute("data-for")
    if (!slug) return

    const header = document.getElementById(slug)
    if (!header) return

    const rect = header.getBoundingClientRect()
    const isVisible = rect.top >= viewportTop && rect.bottom <= viewportBottom

    if (isVisible) {
      entry.classList.add("in-view")
    } else {
      entry.classList.remove("in-view")
    }
  })
}

function toggleToc(this: HTMLElement) {
  this.classList.toggle("collapsed")
  this.setAttribute(
    "aria-expanded",
    this.getAttribute("aria-expanded") === "true" ? "false" : "true",
  )
  const content = this.nextElementSibling as HTMLElement | undefined
  if (!content) return
  content.classList.toggle("collapsed")
}

function setupToc() {
  for (const toc of document.getElementsByClassName("toc")) {
    const button = toc.querySelector(".toc-header")
    const content = toc.querySelector(".toc-content")
    if (!button || !content) return
    button.addEventListener("click", toggleToc)
    window.addCleanup(() => button.removeEventListener("click", toggleToc))
  }
}

document.addEventListener("nav", () => {
  setupToc()
  updateToc()

  const onScroll = () => updateToc()
  window.addEventListener("scroll", onScroll, { passive: true })
  window.addCleanup(() => window.removeEventListener("scroll", onScroll))
})
