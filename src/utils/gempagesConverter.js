/**
 * HTML to GemPages JSON Converter
 * Converts HTML advertorials to GemPages native component format
 */

// Generate unique IDs like GemPages uses
const generateUID = () => {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_'
  let result = 'g'
  for (let i = 0; i < 10; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

const generateCID = () => generateUID()
const generateSectionId = () => String(Date.now()) + String(Math.floor(Math.random() * 1000000))

// Default advanced settings for components
const defaultAdvanced = {
  border: { desktop: { normal: { border: "none", borderType: "none", borderWidth: "1px", color: "#121212", isCustom: true, width: "1px 1px 1px 1px" } } },
  boxShadow: { desktop: { normal: { angle: 49, blur: "4px", color: "rgba(18, 18, 18, 0.7)", distance: "4px", spread: "4px", type: "shadow-1" } } },
  d: { desktop: true, mobile: true, tablet: true },
  hasBoxShadow: { desktop: { normal: false } },
  op: { desktop: "100%" },
  pageType: "GP_STATIC",
  rounded: { desktop: { normal: { bblr: "0px", bbrr: "0px", btlr: "0px", btrr: "0px", radiusType: "none" } } }
}

// Create a text element
const createTextElement = (text, styles = {}) => ({
  advanced: { ...defaultAdvanced },
  label: "Text Block",
  settings: {
    background: { desktop: { attachment: "scroll", color: "transparent", image: { height: 0, src: "", width: 0 }, position: { x: 50, y: 50 }, repeat: "no-repeat", size: "cover", type: "color" } },
    globalSize: { desktop: { padding: { type: "custom" }, width: "100%" } },
    htmlTag: "div",
    text: text,
    translate: "text"
  },
  styles: {
    align: { desktop: "left" },
    hasLineClamp: { desktop: false },
    lineClamp: { desktop: 1, mobile: 1, tablet: 1 },
    shapeRounded: { desktop: { bblr: "0px", bbrr: "0px", btlr: "0px", btrr: "0px", radiusType: "none" } },
    textAlign: styles.textAlign || { desktop: "left", mobile: "left" },
    typo: {
      type: "paragraph-1",
      attrs: { color: styles.color || "#151515", loadFontStyles: ["bold"] },
      custom: {
        fontSize: styles.fontSize || { desktop: "17px", mobile: "16px", tablet: "16px" },
        fontStyle: "normal",
        fontWeight: styles.fontWeight || "400",
        hasShadowText: false,
        letterSpacing: { desktop: "normal" },
        lineHeight: styles.lineHeight || { desktop: "170%", mobile: "170%", tablet: "170%" }
      }
    }
  },
  tag: "Text",
  uid: generateUID()
})

// Create a heading element
const createHeadingElement = (text, level = 2, styles = {}) => ({
  advanced: { ...defaultAdvanced },
  label: "Heading",
  settings: {
    background: { desktop: { attachment: "scroll", color: "transparent", image: { height: 0, src: "", width: 0 }, position: { x: 50, y: 50 }, repeat: "no-repeat", size: "cover", type: "color" } },
    globalSize: { desktop: { gap: "", padding: { type: "custom" }, width: "default" } },
    htmlTag: level,
    text: text,
    translate: "text"
  },
  styles: {
    align: { desktop: styles.align || "center" },
    shapeRounded: { desktop: { bblr: "0px", bbrr: "0px", btlr: "0px", btrr: "0px", radiusType: "none" } },
    textAlign: styles.textAlign || { desktop: "left" },
    typo: {
      attrs: { color: styles.color || "text-2" },
      custom: {
        fontSize: styles.fontSize || { desktop: level === 1 ? "48px" : "32px", mobile: level === 1 ? "32px" : "24px", tablet: level === 1 ? "40px" : "28px" },
        fontStyle: "normal",
        fontWeight: styles.fontWeight || "700",
        hasShadowText: false,
        letterSpacing: { desktop: "normal" },
        lineHeight: { desktop: "130%", mobile: "130%", tablet: "130%" }
      },
      type: level === 1 ? "heading-1" : "heading-2"
    }
  },
  tag: "Heading",
  uid: generateUID()
})

// Create an image element
const createImageElement = (src, alt = "", styles = {}) => ({
  advanced: { ...defaultAdvanced },
  label: "Image",
  settings: {
    image: { height: 0, src: src, width: 0 },
    imageLink: { link: "", target: "_self" },
    isAdaptive: true,
    isNotLazyload: false,
    priority: false,
    quality: 70
  },
  styles: {
    align: { desktop: styles.align || "center" },
    borderImg: { normal: { border: "none", borderType: "none", borderWidth: "1px", color: "#000000", isCustom: false, width: "1px 1px 1px 1px" } },
    borderRadius: styles.borderRadius || { bblr: "12px", bbrr: "12px", btlr: "12px", btrr: "12px", radiusType: "custom" },
    boxShadowImg: { normal: { angle: 90, blur: "12px", color: "rgba(0, 0, 0, 0.10)", distance: "4px", spread: "0px", type: "shadow-1" } },
    hasBoxShadowImg: { normal: true },
    objectFit: { desktop: "cover" },
    shape: { desktop: { gap: "", height: "auto", shape: "original", width: "100%" } }
  },
  tag: "Image",
  uid: generateUID()
})

// Create a button element
const createButtonElement = (text, link = "#", styles = {}) => ({
  advanced: { ...defaultAdvanced },
  label: "Button",
  settings: {
    btnLink: { link: link, target: "_self" },
    disabled: false,
    enableActiveEffect: true,
    enableBtnLink: true,
    enableHoverEffect: true,
    htmlType: "button",
    iconAlign: "left",
    iconVisible: false,
    label: text,
    shouldClearSpace: true,
    translate: "label"
  },
  styles: {
    align: { desktop: "center" },
    backgroundColor: { hover: styles.hoverBg || "#CC3333", normal: styles.bg || "#FF4444" },
    backgroundColorV2: { hover: styles.hoverBg || "#CC3333", normal: styles.bg || "#FF4444" },
    borderBtnV2: { normal: { border: "none", borderWidth: "1px", isCustom: false, width: "1px 1px 1px 1px" } },
    boxShadowBtn: { normal: { angle: 90, blur: "20px", color: "rgba(0, 0, 0, 0.25)", distance: "6px", spread: "0px", type: "shadow-1" } },
    hasBoxShadowBtn: { hover: true, normal: true },
    fullWidth: { desktop: false, mobile: true },
    globalSize: { desktop: { gap: "", height: "Auto", padding: { bottom: "18px", left: "40px", right: "40px", top: "18px", type: "custom" }, width: "Auto" } },
    roundedBtnV2: { normal: { bblr: "50px", bbrr: "50px", btlr: "50px", btrr: "50px", radiusType: "custom" } },
    textColor: { normal: "#FFFFFF" },
    typo: {
      attrs: { color: "#FFFFFF" },
      custom: { fontSize: { desktop: "20px", mobile: "18px", tablet: "18px" }, fontStyle: "normal", fontWeight: "700", letterSpacing: { desktop: "0.5px" }, lineHeight: { desktop: "140%" } },
      type: "paragraph-1"
    }
  },
  tag: "Button",
  uid: generateUID()
})

// Create countdown timer element
const createCountdownElement = (hours = 2, minutes = 47, seconds = 33) => ({
  advanced: { ...defaultAdvanced },
  label: "Countdown Timer",
  settings: {
    behaviour: "evergreen",
    dayLabel: "Days",
    enableDay: false,
    enableHour: true,
    enableMinute: true,
    enableSecond: true,
    enableWeek: false,
    hourLabel: "Hours",
    loopAfterFinish: true,
    minuteLabel: "Minutes",
    redirectUrl: { link: "#", target: "_self", type: "stay-on-page" },
    secondLabel: "Seconds",
    timerEverygreen: { days: 0, hours: hours, mins: minutes, seconds: seconds, startTime: Date.now(), endTime: Date.now() + (hours * 3600 + minutes * 60 + seconds) * 1000 },
    translate: "dayLabel,hourLabel,minuteLabel,secondLabel,weekLabel"
  },
  styles: {
    backgroundItemColor: "#FFFFFF",
    borderState: { normal: { border: "none", borderType: "none", borderWidth: "1px", isCustom: false, width: "1px 1px 1px 1px" } },
    colorLabel: "text-1",
    colorNumber: "text-2",
    enableLabelTextStyle: true,
    horizontalGap: "16px",
    itemPadding: { desktop: { bottom: "16px", left: "20px", right: "20px", top: "16px" }, mobile: { bottom: "12px", left: "16px", right: "16px", top: "12px" } },
    labelTypo: { attrs: { color: "#666666" }, custom: { fontSize: { desktop: "12px", mobile: "11px", tablet: "12px" }, fontWeight: "600", lineHeight: { desktop: "100%" } }, type: "paragraph-2" },
    numTypo: { attrs: { bold: true, color: "#242424" }, custom: { fontSize: { desktop: "28px", mobile: "24px", tablet: "26px" }, fontWeight: "700", lineHeight: { desktop: "130%" } }, type: "subheading-2" },
    roundedState: { normal: { bblr: "12px", bbrr: "12px", btlr: "12px", btrr: "12px", radiusType: "custom" } },
    textAlign: { desktop: "center" },
    verticalGap: "4px"
  },
  tag: "Countdown",
  uid: generateUID()
})

// Create a Col (Block) wrapper
const createCol = (children, styles = {}) => ({
  advanced: { ...defaultAdvanced, "spacing-setting": styles.spacing || {} },
  childrens: children,
  label: "Block",
  settings: {},
  styles: {},
  tag: "Col",
  uid: generateUID()
})

// Create a Row wrapper
const createRow = (children, styles = {}) => ({
  advanced: { ...defaultAdvanced },
  childrens: children,
  label: "Row",
  settings: {
    blockAlignment: "start",
    horizontalAlign: { desktop: "start" },
    inlineAlignment: "start",
    layout: styles.layout || { desktop: { cols: [12], display: "fill" }, mobile: { cols: [12], display: "fill" } },
    verticalAlign: { desktop: styles.verticalAlign || "start" }
  },
  styles: {
    background: { desktop: { attachment: "scroll", color: styles.bgColor || "transparent", image: { height: 0, src: "", width: 0 }, position: { x: 50, y: 50 }, repeat: "no-repeat", size: "cover", type: "color" } },
    columnGap: { desktop: "1%" },
    height: { desktop: "auto" },
    preloadBgImage: false,
    verticalGutter: { desktop: "16px" },
    width: { desktop: "default" }
  },
  tag: "Row",
  uid: generateUID()
})

// Create a Section wrapper
const createSection = (children, styles = {}) => {
  const section = {
    id: generateSectionId(),
    cid: generateCID(),
    component: JSON.stringify({
      advanced: {
        ...defaultAdvanced,
        blockPadding: "base",
        "spacing-setting": styles.spacing || {
          desktop: { link: false, padding: { bottom: "40px", left: "0px", right: "0px", top: "40px" } },
          mobile: { link: false, padding: { bottom: "30px", left: "20px", right: "20px", top: "30px" } },
          tablet: { link: false, padding: { bottom: "40px", left: "48px", right: "48px", top: "40px" } }
        }
      },
      childrens: children,
      label: "Section",
      settings: {
        blockAlignment: "start",
        horizontalAlign: { desktop: "start" },
        inlineAlignment: "start",
        layout: { desktop: { cols: [12], display: "fill" } },
        lazy: false,
        verticalAlign: { desktop: "start" }
      },
      styles: {
        background: {
          desktop: { attachment: "scroll", color: styles.bgColor || "transparent", image: { height: 0, src: "", width: 0 }, position: { x: 50, y: 50 }, repeat: "no-repeat", size: "cover", type: "color" }
        },
        columnGap: { desktop: "0%" },
        enablePagePadding: { desktop: true, mobile: false, tablet: false },
        preloadBgImage: false,
        verticalGutter: { desktop: "32px" },
        width: { desktop: styles.width || "800px", mobile: "100%", tablet: "100%" }
      },
      tag: "Section",
      uid: generateUID()
    })
  }
  return section
}

// Create sticky banner section
const createStickySection = (text, countdownText) => {
  // Parse countdown from text like "02:47:33"
  const match = countdownText?.match(/(\d+):(\d+):(\d+)/)
  const hours = match ? parseInt(match[1]) : 2
  const minutes = match ? parseInt(match[2]) : 47
  const seconds = match ? parseInt(match[3]) : 33

  const textEl = createTextElement(`<p>${text}</p>`, {
    color: "#FFFFFF",
    textAlign: { desktop: "center", mobile: "center" },
    fontWeight: "600"
  })

  const countdown = createCountdownElement(hours, minutes, seconds)
  countdown.styles.backgroundItemColor = "rgba(255,255,255,0.2)"
  countdown.styles.numTypo.attrs.color = "#FFFFFF"
  countdown.styles.labelTypo.attrs.color = "rgba(255,255,255,0.8)"

  const col = createCol([textEl, countdown])
  const row = createRow([col])

  return {
    id: generateSectionId(),
    cid: generateCID(),
    component: JSON.stringify({
      advanced: { ...defaultAdvanced },
      childrens: [row],
      label: "Sticky",
      settings: {
        background: { desktop: { attachment: "scroll", color: "#FF69B4", image: { height: 0, src: "", width: 0 }, position: { x: 50, y: 50 }, repeat: "no-repeat", size: "cover", type: "color" } },
        display: { desktop: "always" },
        isScrollToTop: false,
        position: { desktop: "top" },
        preloadBgImage: false,
        width: { desktop: "100%", mobile: "100%", tablet: "100%" }
      },
      styles: {},
      tag: "Sticky",
      uid: generateUID()
    })
  }
}

// Main converter function
export const convertHTMLToGemPages = (htmlString) => {
  // Use DOMParser in browser environment
  const parser = new DOMParser()
  const doc = parser.parseFromString(htmlString, 'text/html')
  
  const sections = []
  
  // Extract container content
  const container = doc.querySelector('.container') || doc.body
  
  // Process urgency banner (sticky)
  const urgencyBanner = container.querySelector('.urgency-banner')
  if (urgencyBanner) {
    const bannerText = urgencyBanner.querySelector('strong')?.textContent || 'SPECIAL OFFER'
    const countdown = urgencyBanner.querySelector('.countdown')?.textContent || ''
    const countdownMatch = countdown.match(/(\d+:\d+:\d+)/)
    sections.push(createStickySection(bannerText, countdownMatch ? countdownMatch[1] : '02:47:33'))
  }
  
  // Process hero section
  const heroSection = container.querySelector('.hero-section')
  if (heroSection) {
    const heroChildren = []
    
    // Publication bar
    const pubName = heroSection.querySelector('.pub-name')?.textContent
    const pubDate = heroSection.querySelector('.pub-date')?.textContent
    if (pubName || pubDate) {
      heroChildren.push(createCol([
        createTextElement(`<p><strong>${pubName || ''}</strong></p>`, { color: "#FF69B4", fontWeight: "700" })
      ]))
    }
    
    // Title
    const h1 = heroSection.querySelector('h1')
    if (h1) {
      heroChildren.push(createCol([createHeadingElement(h1.textContent, 1, { textAlign: { desktop: "left" } })]))
    }
    
    // Subhead
    const subhead = heroSection.querySelector('.subhead')
    if (subhead) {
      heroChildren.push(createCol([createTextElement(`<p>${subhead.innerHTML}</p>`, { fontSize: { desktop: "18px", mobile: "16px", tablet: "17px" }, color: "#6b7280" })]))
    }
    
    // Hero image
    const heroImg = heroSection.querySelector('.section-img')
    if (heroImg) {
      heroChildren.push(createCol([createImageElement(heroImg.src, heroImg.alt)]))
    }
    
    // Meta info
    const metaInfo = heroSection.querySelector('.meta-info')
    if (metaInfo) {
      heroChildren.push(createCol([createTextElement(`<p>${metaInfo.textContent}</p>`, { color: "#9ca3af", fontSize: { desktop: "14px", mobile: "13px", tablet: "14px" } })]))
    }
    
    if (heroChildren.length > 0) {
      sections.push(createSection(heroChildren.map(col => createRow([col]))))
    }
  }
  
  // Process testimonial highlight
  const testimonialHighlight = container.querySelector('.testimonial-highlight')
  if (testimonialHighlight) {
    const stars = testimonialHighlight.querySelector('.stars')?.textContent || '⭐️⭐️⭐️⭐️⭐️'
    const quote = testimonialHighlight.querySelector('.featured-testimonial p')?.innerHTML || ''
    const cite = testimonialHighlight.querySelector('cite')?.textContent || ''
    
    const testimonialContent = [
      createTextElement(`<p style="text-align: center;">${stars}</p>`, { textAlign: { desktop: "center", mobile: "center" } }),
      createTextElement(`<p><em>"${quote}"</em></p><p><strong>${cite}</strong></p>`, { fontWeight: "600" })
    ]
    
    const row = createRow([createCol(testimonialContent)], { bgColor: "#FFFBEB" })
    row.advanced = {
      ...row.advanced,
      border: { desktop: { normal: { border: "solid", borderType: "none", borderWidth: "Mixed", color: "#f59e0b", isCustom: true, width: "0px 0px 0px 5px" } } },
      rounded: { desktop: { normal: { bblr: "12px", bbrr: "12px", btlr: "12px", btrr: "12px", radiusType: "custom" } } }
    }
    
    sections.push(createSection([row], { bgColor: "#FFFBEB" }))
  }
  
  // Process text sections
  container.querySelectorAll('.text-section').forEach(textSection => {
    const children = []
    textSection.querySelectorAll('.prose p').forEach(p => {
      children.push(createCol([createTextElement(`<p>${p.innerHTML}</p>`)]))
    })
    if (children.length > 0) {
      sections.push(createSection(children.map(col => createRow([col]))))
    }
  })
  
  // Process reason sections
  container.querySelectorAll('.reason-section').forEach(reasonSection => {
    const children = []
    
    // Reason number
    const reasonNum = reasonSection.querySelector('.reason-number')
    if (reasonNum) {
      const numEl = createTextElement(`<p>${reasonNum.textContent}</p>`, {
        textAlign: { desktop: "center", mobile: "center" },
        fontSize: { desktop: "32px", mobile: "28px", tablet: "30px" },
        fontWeight: "700",
        color: "#FFFFFF"
      })
      // Style the number as a circle
      const numCol = createCol([numEl])
      numCol.styles = {
        background: { desktop: { color: "#FF69B4", type: "color" } }
      }
      numCol.advanced["spacing-setting"] = {
        desktop: { padding: { bottom: "12px", left: "20px", right: "20px", top: "12px" } }
      }
      numCol.advanced.rounded = { desktop: { normal: { bblr: "999px", bbrr: "999px", btlr: "999px", btrr: "999px", radiusType: "circle" } } }
      children.push(createRow([numCol], { layout: { desktop: { cols: [12], display: "fit" }, mobile: { cols: [12], display: "fit" } } }))
    }
    
    // Reason title
    const h2 = reasonSection.querySelector('h2')
    if (h2) {
      children.push(createRow([createCol([createHeadingElement(h2.textContent, 2, { textAlign: { desktop: "center", mobile: "center" } })])]))
    }
    
    // Images
    reasonSection.querySelectorAll('.section-img').forEach(img => {
      children.push(createRow([createCol([createImageElement(img.src, img.alt)])]))
    })
    
    // Expert quotes
    reasonSection.querySelectorAll('.expert-quote').forEach(quote => {
      const quoteEl = createTextElement(`<p><em>${quote.querySelector('p')?.innerHTML || quote.innerHTML}</em></p>`, { fontWeight: "500" })
      const quoteRow = createRow([createCol([quoteEl])], { bgColor: "#f9fafb" })
      quoteRow.advanced.border = { desktop: { normal: { border: "solid", borderWidth: "Mixed", color: "#FF69B4", isCustom: true, width: "0px 0px 0px 5px" } } }
      quoteRow.advanced.rounded = { desktop: { normal: { bblr: "8px", bbrr: "8px", btlr: "8px", btrr: "8px", radiusType: "custom" } } }
      children.push(quoteRow)
    })
    
    // Prose paragraphs
    reasonSection.querySelectorAll('.prose p').forEach(p => {
      children.push(createRow([createCol([createTextElement(`<p>${p.innerHTML}</p>`)])]))
    })
    
    if (children.length > 0) {
      sections.push(createSection(children))
    }
  })
  
  // Process product callout box
  const productBox = container.querySelector('.product-callout-box')
  if (productBox) {
    const children = []
    
    // Title
    const boxTitle = productBox.querySelector('h2')
    if (boxTitle) {
      children.push(createRow([createCol([createHeadingElement(boxTitle.textContent, 2, { color: "#FF69B4", textAlign: { desktop: "center", mobile: "center" } })])]))
    }
    
    // Product image
    const productImg = productBox.querySelector('.section-img')
    if (productImg) {
      children.push(createRow([createCol([createImageElement(productImg.src, productImg.alt)])]))
    }
    
    // Testimonial snippet
    const snippet = productBox.querySelector('.testimonial-snippet')
    if (snippet) {
      children.push(createRow([createCol([createTextElement(`<p><em>${snippet.innerHTML}</em></p>`, { textAlign: { desktop: "center", mobile: "center" } })])]))
    }
    
    // Benefits
    productBox.querySelectorAll('.benefit-bullet').forEach(benefit => {
      const icon = benefit.querySelector('.bullet-icon')?.textContent || '✅'
      const title = benefit.querySelector('h4')?.textContent || ''
      const desc = benefit.querySelector('.bullet-content p')?.textContent || ''
      children.push(createRow([createCol([
        createTextElement(`<p><strong>${icon} ${title}</strong></p><p>${desc}</p>`)
      ])], { bgColor: "#FFFFFF" }))
    })
    
    // CTA Button
    const ctaBtn = productBox.querySelector('.cta-button')
    if (ctaBtn) {
      children.push(createRow([createCol([createButtonElement(ctaBtn.textContent.trim(), ctaBtn.href)])]))
    }
    
    // CTA subtext
    const ctaSubtext = productBox.querySelector('.cta-subtext')
    if (ctaSubtext) {
      children.push(createRow([createCol([createTextElement(`<p>${ctaSubtext.textContent}</p>`, { textAlign: { desktop: "center", mobile: "center" }, color: "#6b7280", fontSize: { desktop: "14px", mobile: "13px" } })])]))
    }
    
    if (children.length > 0) {
      sections.push(createSection(children, { bgColor: "#fdf2f8" }))
    }
  }
  
  // Process bottom line section
  const bottomLine = container.querySelector('.bottom-line-section')
  if (bottomLine) {
    const children = []
    const h2 = bottomLine.querySelector('h2')
    if (h2) {
      children.push(createRow([createCol([createHeadingElement(h2.textContent, 2, { color: "#FF69B4", textAlign: { desktop: "center", mobile: "center" } })])]))
    }
    bottomLine.querySelectorAll('.prose p').forEach(p => {
      children.push(createRow([createCol([createTextElement(`<p>${p.innerHTML}</p>`, { textAlign: { desktop: "center", mobile: "center" } })])]))
    })
    if (children.length > 0) {
      sections.push(createSection(children, { bgColor: "#f9fafb" }))
    }
  }
  
  // Process secret offer section
  const secretOffer = container.querySelector('.secret-offer-section')
  if (secretOffer) {
    const children = []
    
    const h2 = secretOffer.querySelector('h2')
    if (h2) {
      children.push(createRow([createCol([createHeadingElement(h2.textContent, 2, { color: "#FFFFFF", textAlign: { desktop: "center", mobile: "center" } })])]))
    }
    
    secretOffer.querySelectorAll('.prose p').forEach(p => {
      children.push(createRow([createCol([createTextElement(`<p>${p.innerHTML}</p>`, { color: "#FFFFFF", textAlign: { desktop: "center", mobile: "center" } })])]))
    })
    
    // Countdown timer
    const countdownTimer = secretOffer.querySelector('.countdown-timer')
    if (countdownTimer) {
      const timeUnits = countdownTimer.querySelectorAll('.time-unit')
      let hours = 2, minutes = 47, seconds = 33
      timeUnits.forEach((unit, i) => {
        const num = parseInt(unit.querySelector('.time-number')?.textContent) || 0
        if (i === 0) hours = num
        else if (i === 1) minutes = num
        else if (i === 2) seconds = num
      })
      const countdown = createCountdownElement(hours, minutes, seconds)
      countdown.styles.backgroundItemColor = "rgba(255,255,255,0.2)"
      countdown.styles.numTypo.attrs.color = "#FFFFFF"
      countdown.styles.labelTypo.attrs.color = "rgba(255,255,255,0.8)"
      children.push(createRow([createCol([countdown])]))
    }
    
    if (children.length > 0) {
      sections.push(createSection(children, { bgColor: "#FF69B4" }))
    }
  }
  
  // Process social proof gallery
  const socialProof = container.querySelector('.social-proof-gallery')
  if (socialProof) {
    const children = []
    
    const customerCount = socialProof.querySelector('.customer-count')
    if (customerCount) {
      children.push(createRow([createCol([createTextElement(`<p><strong>${customerCount.textContent}</strong></p>`, { color: "#FF69B4", fontSize: { desktop: "24px", mobile: "20px" }, fontWeight: "700", textAlign: { desktop: "center", mobile: "center" } })])]))
    }
    
    const img = socialProof.querySelector('.section-img')
    if (img) {
      children.push(createRow([createCol([createImageElement(img.src, img.alt)])]))
    }
    
    const testimonial = socialProof.querySelector('.featured-testimonial')
    if (testimonial) {
      const quote = testimonial.querySelector('p')?.innerHTML || ''
      const cite = testimonial.querySelector('cite')?.textContent || ''
      children.push(createRow([createCol([createTextElement(`<p><em>"${quote}"</em></p><p><strong>${cite}</strong></p>`)])]))
    }
    
    if (children.length > 0) {
      sections.push(createSection(children))
    }
  }
  
  // Process trust badges
  const trustBadges = container.querySelector('.trust-badges')
  if (trustBadges) {
    const badges = trustBadges.querySelectorAll('.trust-badge')
    const badgeCols = []
    badges.forEach(badge => {
      const icon = badge.querySelector('.badge-icon')?.textContent || ''
      const text = badge.querySelector('.badge-text')?.textContent || ''
      badgeCols.push(createCol([createTextElement(`<p style="text-align: center;"><span style="font-size: 2.5rem;">${icon}</span></p><p style="text-align: center;"><strong>${text}</strong></p>`, { textAlign: { desktop: "center", mobile: "center" } })]))
    })
    if (badgeCols.length > 0) {
      const cols = badgeCols.length
      const layout = { desktop: { cols: Array(cols).fill(Math.floor(12/cols)), display: "fill" }, mobile: { cols: [12], display: "fill" } }
      sections.push(createSection([createRow(badgeCols, { layout })]))
    }
  }
  
  // Process final CTA
  const finalCta = container.querySelector('.final-cta .cta-button')
  if (finalCta) {
    const btn = createButtonElement(finalCta.textContent.trim(), finalCta.href)
    btn.styles.globalSize.desktop.padding = { bottom: "20px", left: "50px", right: "50px", top: "20px", type: "custom" }
    btn.styles.typo.custom.fontSize = { desktop: "22px", mobile: "18px", tablet: "20px" }
    sections.push(createSection([createRow([createCol([btn])])]))
  }
  
  // Build final GemPages JSON structure
  const gemPagesData = {
    theme_page_id: generateSectionId(),
    sections: sections
  }
  
  return gemPagesData
}

export default convertHTMLToGemPages
